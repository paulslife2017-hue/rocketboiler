import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import ts from 'typescript';
let transport;
function compile(file,modules={}){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../app/'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>modules[n],process:{env:{DATABASE_URL:'test-encryption-only',ADMIN_PASSWORD:'test'}},Buffer,URL,URLSearchParams,Date,AbortSignal,fetch:(...args)=>transport(...args)});return exports;}
const client=compile('api/admin/naver-ads/client.ts',{'node:crypto':crypto});
const credentials={customerId:'123',apiKey:'test-api-key',secretKey:'test-secret-key'};
test('credentials round-trip encrypted and tampering fails',()=>{const encoded=client.encrypt(credentials);assert.equal(encoded.includes(credentials.secretKey),false);assert.deepEqual(JSON.parse(JSON.stringify(client.decrypt(encoded))),credentials);const parts=encoded.split('.');parts[1]=Buffer.alloc(16).toString('base64');assert.throws(()=>client.decrypt(parts.join('.')));});
test('period validation rejects invalid dates, reversed dates and over 31 days',()=>{assert.equal(client.validPeriod('2026-09-01','2026-09-30'),true);assert.equal(client.validPeriod('2026-09-01','2026-10-01'),true);for(const [a,b] of [['2026-09-01','2026-10-02'],['2026-02-30','2026-03-01'],['2026-09-11','2026-09-01']])assert.equal(client.validPeriod(a,b),false);});
test('empty performance differs from malformed performance',()=>{assert.equal(client.statsOf({data:[]}).salesAmt,0);assert.equal(client.statsOf({data:[{impCnt:100,clkCnt:5,salesAmt:1500},{impCnt:200,clkCnt:5,salesAmt:2500}]}).salesAmt,4000);assert.throws(()=>client.statsOf({}));assert.throws(()=>client.statsOf({data:[{impCnt:1,clkCnt:1}]}));});
test('requests sign GET path only and failures never become zero spend',async()=>{transport=async(url,options)=>{assert.equal(url,'https://api.searchad.naver.com/stats?id=campaign');const h=options.headers;assert.equal(h['X-Signature'],crypto.createHmac('sha256',credentials.secretKey).update(h['X-Timestamp']+'.GET./stats').digest('base64'));return Response.json({data:[]});};await client.request(credentials,'/stats',new URLSearchParams({id:'campaign'}));transport=async()=>new Response('',{status:403});await assert.rejects(client.request(credentials,'/stats'),/403/);});
test('unauthorized requests never read credentials or connect',async()=>{const api=compile('api/admin/naver-ads/route.ts',{'next/server':{NextResponse:{json:(d,o)=>Response.json(d,o)}},'../operations/store':{initialize:()=>{throw Error('unauthorized storage');},database:()=>{}},'./client':client,'../../../admin/shared':{koreaDate:()=> '2026-09-11',channelOf:()=> 'unknown'}});const r={headers:new Headers(),nextUrl:new URL('https://test'),json:async()=>credentials};assert.equal((await api.GET(r)).status,401);assert.equal((await api.POST(r)).status,401);});

test('site scope excludes lookalike domains, other sites and embedded target URLs',()=>{assert.equal(client.isSiteUrl('https://rocketboiler.vercel.app/regions/test?utm_source=naver'),true);for(const url of ['https://rocketaircon.vercel.app','https://rocketboiler.vercel.app.evil.test','https://other.test/?url=https://rocketboiler.vercel.app','https://rocketboiler.vercel.app@evil.test'])assert.equal(client.isSiteUrl(url),false);});
test('site groups exclude unrelated groups even inside the same campaign',async()=>{
 transport=async(url)=>{const u=new URL(url);let data=[];
 if(u.pathname==='/ncc/channels')data=[{nccBusinessChannelId:'boiler',channelKey:'https://rocketboiler.vercel.app'},{nccBusinessChannelId:'other',channelKey:'https://rocketaircon.vercel.app'}];
 if(u.pathname==='/ncc/adgroups')data=[{nccAdgroupId:'yes',pcChannelId:'boiler',mobileChannelId:'boiler'},{nccAdgroupId:'no',pcChannelId:'other',mobileChannelId:'other'},{nccAdgroupId:'mixed',pcChannelId:'boiler',mobileChannelId:'other'},{nccAdgroupId:'override',pcChannelId:'boiler',mobileChannelId:'boiler'}];
 if(u.pathname==='/ncc/ads'){assert.equal(['yes','override'].includes(u.searchParams.get('nccAdgroupId')),true);data=[{ad:{pc:{final:u.searchParams.get('nccAdgroupId')==='yes'?'https://rocketboiler.vercel.app/':'https://other.example/'},mobile:{final:'https://rocketboiler.vercel.app/'}}}];}
 return Response.json(data);
 };
 const scope=await client.siteGroups(credentials);assert.deepEqual(Array.from(scope.groups,g=>g.nccAdgroupId),['yes']);assert.equal(scope.mixed,1);
});
test('toggle signs only userLock update and verifies the returned setting',async()=>{
 let puts=0;transport=async(url,options)=>{if(options.method==='PUT'){puts++;assert.equal(url,'https://api.searchad.naver.com/ncc/adgroups/grp-boiler?fields=userLock');assert.equal(JSON.parse(options.body).userLock,true);assert.equal(options.headers['X-Signature'],crypto.createHmac('sha256',credentials.secretKey).update(options.headers['X-Timestamp']+'.PUT./ncc/adgroups/grp-boiler').digest('base64'));return Response.json({});}return Response.json({userLock:true,status:'PAUSED'});};
 const result=await client.setGroupLock(credentials,{nccAdgroupId:'grp-boiler',userLock:false,bidAmt:100},true);assert.equal(result.paused,true);assert.equal(puts,1);
 transport=async(_url,options)=>Response.json(options.method==='PUT'?{}:{userLock:false});await assert.rejects(client.setGroupLock(credentials,{nccAdgroupId:'grp-boiler'},true),/확인하지/);
});
test('toggle rejects unrelated sites and stale state before mutation',async()=>{
 let writes=0;let scope=[];
 const api=compile('api/admin/naver-ads/route.ts',{'next/server':{NextResponse:{json:(d,o)=>Response.json(d,o)}},'../operations/store':{initialize:async()=>{},database:()=>async()=>[{encrypted:'test'}]},'./client':{...client,decrypt:()=>credentials,siteGroups:async()=>({groups:scope}),request:async()=>({nccAdgroupId:'grp-boiler',userLock:false}),setGroupLock:async()=>{writes++;return {paused:true};}},'../../../admin/shared':{koreaDate:()=> '2026-09-11',channelOf:()=> 'unknown'}});
 const req=(body)=>({headers:new Headers({authorization:'Bearer test'}),json:async()=>body});
 const body={action:'toggle',id:'grp-boiler',paused:false,expectedPaused:true};
 assert.equal((await api.POST(req(body))).status,403);assert.equal(writes,0);
 scope=[{nccAdgroupId:'grp-boiler'}];assert.equal((await api.POST(req(body))).status,409);assert.equal(writes,0);
 assert.equal((await api.POST(req({...body,paused:true,expectedPaused:false}))).status,200);assert.equal(writes,1);
});
