import { neon } from '@neondatabase/serverless';

export function database() { if (!process.env.DATABASE_URL) throw new Error('database_not_configured'); return neon(process.env.DATABASE_URL); }
let initialization: Promise<unknown> | undefined;
export async function initialize() {
  if (!initialization) {
    const sql = database();
    initialization = sql.transaction([
      sql`CREATE TABLE IF NOT EXISTS boiler_inventory (sku TEXT PRIMARY KEY, brand TEXT NOT NULL DEFAULT '', model TEXT NOT NULL, on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
      sql`CREATE TABLE IF NOT EXISTS boiler_store_orders (id TEXT PRIMARY KEY, ordered_at TEXT NOT NULL DEFAULT '', customer TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', product TEXT NOT NULL, option_name TEXT NOT NULL DEFAULT '', seller_code TEXT NOT NULL DEFAULT '', sku TEXT REFERENCES boiler_inventory(sku), quantity INTEGER NOT NULL CHECK (quantity > 0), status TEXT NOT NULL DEFAULT 'PAYED', dispatched BOOLEAN NOT NULL DEFAULT FALSE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
      sql`CREATE TABLE IF NOT EXISTS boiler_stock_movements (id TEXT PRIMARY KEY, sku TEXT NOT NULL REFERENCES boiler_inventory(sku), delta INTEGER NOT NULL, reason TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
      sql`CREATE TABLE IF NOT EXISTS boiler_integrations (name TEXT PRIMARY KEY, encrypted TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
    ]).catch((error) => { initialization = undefined; throw error; });
  }
  await initialization;
}
export const cancelled = ['CANCELED', 'RETURNED', 'CANCELED_BY_NOPAYMENT', '취소', '취소완료', '반품완료'];
