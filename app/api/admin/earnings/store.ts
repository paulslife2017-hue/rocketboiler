import { database, initialize } from '../operations/store';
let initialization:Promise<unknown>|undefined;
export async function earningsDb(){
  await initialize();const sql=database();
  initialization??=sql.transaction([
    sql`ALTER TABLE boiler_leads ADD COLUMN IF NOT EXISTS sale_sku TEXT, ADD COLUMN IF NOT EXISTS sale_amount INTEGER CHECK(sale_amount>=0), ADD COLUMN IF NOT EXISTS store_order_id TEXT, ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`,
    sql`CREATE TABLE IF NOT EXISTS boiler_model_prices(sku TEXT PRIMARY KEY,sale INTEGER NOT NULL,cost INTEGER,cost_source TEXT NOT NULL DEFAULT '',updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
    sql`CREATE TABLE IF NOT EXISTS boiler_earnings_settings(id INTEGER PRIMARY KEY CHECK(id=1),labor INTEGER NOT NULL CHECK(labor BETWEEN 80000 AND 100000))`,
    sql`INSERT INTO boiler_earnings_settings(id,labor) VALUES(1,80000) ON CONFLICT DO NOTHING`,
    sql`CREATE TABLE IF NOT EXISTS boiler_sale_costs(id TEXT PRIMARY KEY,sku TEXT,cost INTEGER,labor INTEGER NOT NULL CHECK(labor BETWEEN 80000 AND 100000),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  ]).catch(e=>{initialization=undefined;throw e;});await initialization;return sql;
}
