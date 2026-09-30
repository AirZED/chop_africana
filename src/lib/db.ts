import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

declare global {
  var __db: Database.Database | undefined;
}

function createDb(): Database.Database {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "app.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    -- A single unified order can mix restaurant dishes and shop (pie) products.
    -- The product catalog itself (menu items, shop products) lives in MongoDB;
    -- order_items stores a name/price snapshot so order history stays intact
    -- even if a catalog item is later edited or removed.
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      stripe_payment_intent_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      channel TEXT NOT NULL DEFAULT 'restaurant',
      fulfillment TEXT NOT NULL,
      table_number TEXT,
      full_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      subtotal_cents INTEGER NOT NULL,
      delivery_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      ref_id TEXT NOT NULL,
      name_snapshot TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      line_total_cents INTEGER NOT NULL,
      selections_summary TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_ref ON order_items(ref_id);
  `);

  return db;
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = createDb();
  }
  return global.__db;
}
