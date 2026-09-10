import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path, imports = {}, env = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => {
    if (name in imports) return imports[name];
    throw new Error(`Unexpected import ${name}`);
  }, process: { env }, URL, URLSearchParams, Date, console, crypto: globalThis.crypto });
  return exports;
}
const shared = compile('../app/admin/shared.ts');
const next = { NextResponse: { json: (data, options) => Response.json(data, options) } };
const request = (body, authorized = true) => ({ headers: new Headers(authorized ? { authorization: 'Bearer test-only' } : {}), json: async () => body, nextUrl: new URL('https://example.test/api/leads') });
function route(query) { return compile('../app/api/leads/route.ts', { '@neondatabase/serverless': { neon: () => query }, '../admin/earnings/store': { earningsDb: async () => query }, 'next/server': next }, { ADMIN_PASSWORD: 'test-only', DATABASE_URL: 'test-only' }); }

test('ad attribution distinguishes paid clicks from organic and legacy visits', () => {
  for (const source of ['/', '/regions/geumcheon', '/?utm_source=google&utm_medium=organic', '/?utm_source=naver']) assert.equal(shared.channelOf(source), 'unknown');
  assert.equal(shared.channelOf('/?gclid=test'), 'google');
  assert.equal(shared.channelOf('/?utm_source=google&utm_medium=cpc'), 'google');
  assert.equal(shared.channelOf('/?n_ad=test'), 'naver');
  assert.equal(shared.channelOf('/?utm_source=naver&utm_medium=paid_search'), 'naver');
});
test('unauthenticated list, changes, overview never reach the database', async () => {
  const query = () => { throw new Error('Database must not be called'); };
  const api = route(query);
  assert.equal((await api.GET(request({}, false))).status, 401);
  assert.equal((await api.PATCH(request({}, false))).status, 401);
  const overview = compile('../app/api/admin/overview/route.ts', { '@neondatabase/serverless': { neon: () => query }, 'next/server': next, '../../../admin/shared': shared }, { ADMIN_PASSWORD: 'test-only' });
  assert.equal((await overview.GET(request({}, false))).status, 401);
});
test('invalid status, date and oversized notes are rejected without writes', async () => {
  const api = route(() => { throw new Error('Unexpected write'); });
  const id = '00000000-0000-4000-8000-000000000001';
  for (const change of [{ status: 'invalid' }, { preferred_date: '2026-02-30' }, { notes: 'x'.repeat(4001) }, {}]) assert.equal((await api.PATCH(request({ id, ...change }))).status, 400);
});
test('notes and schedule updates preserve status; missing records and DB failures are reported', async () => {
  let values;
  const id = '00000000-0000-4000-8000-000000000001';
  const api = route(async (_strings, ...args) => { values = args; return [{ id }]; });
  assert.equal((await api.PATCH(request({ id, notes: '통화 완료', preferred_date: '2026-10-01', preferred_time: '오전 10시' }))).status, 200);
  assert.equal(values[0], false);
  assert.equal(values[4], true);
  assert.equal(values[5], '통화 완료');
  assert.equal(values[7], '2026-10-01');
  assert.equal((await route(async () => []).PATCH(request({ id, status: 'completed' }))).status, 404);
  assert.equal((await route(async () => { throw new Error('offline'); }).PATCH(request({ id, status: 'completed' }))).status, 500);
});
test('overview groups stored sources and completion counts across the full result', async () => {
  const query = async (strings) => strings.join('').includes('GROUP BY source') ? [{ source: '/?gclid=x', status: 'completed', count: 3 }, { source: '/?n_ad=x', status: 'new', count: 4 }, { source: '/', status: 'new', count: 5 }] : [];
  const overview = compile('../app/api/admin/overview/route.ts', { '@neondatabase/serverless': { neon: () => query }, 'next/server': next, '../../../admin/shared': shared }, { ADMIN_PASSWORD: 'test-only', DATABASE_URL: 'test-only' });
  const response = await overview.GET(request({}));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const data = await response.json();
  assert.deepEqual(data.channels, { naver: { count: 4, completed: 0 }, google: { count: 3, completed: 3 }, unknown: { count: 5, completed: 0 } });
});
