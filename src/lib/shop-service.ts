import { randomUUID } from "node:crypto";
import { Collection } from "mongodb";
import { getMongoDb } from "./mongodb";
import { ShopProduct } from "./types";

interface ShopProductDoc {
  _id: string;
  name: string;
  description: string;
  priceCents: number;
  packSize: string;
  emoji: string;
  imagePath: string;
  ingredients: string;
  allergens: string;
  storageInstructions: string;
  bakingSteps: string[];
  active: boolean;
  sortOrder: number;
  stock: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopProductInput {
  name: string;
  description: string;
  price: number;
  packSize: string;
  emoji: string;
  image?: string;
  ingredients: string;
  allergens: string;
  storageInstructions: string;
  bakingSteps: string[];
  active: boolean;
  /** undefined/null = unlimited stock. */
  stock?: number | null;
}

const STORAGE_INSTRUCTIONS =
  "Keep frozen at -18°C until ready to use. Do not refreeze after thawing. Cook from frozen — do not defrost. Not suitable for microwave use.";

const BAKING_STEPS = [
  "Preheat the oven for 10 minutes.",
  "Line a baking tray with parchment paper.",
  "Place pies in a single layer, leaving space between each pie.",
  "Egg wash the pies.",
  "Bake at 220°C for 40–45 minutes, or until golden brown.",
  "Allow to rest for 5 minutes before serving — product will be hot.",
];

const SEED_PRODUCTS: (ShopProductInput & { id: string; sortOrder: number })[] = [
  {
    id: "shop-beef-pie",
    name: "Beef Pie",
    description:
      "Minced beef slow-cooked with onions, carrots and a warm mix of spices, sealed in buttery shortcrust. The party-table classic, ready when you are.",
    price: 12,
    packSize: "4 fzn pk",
    emoji: "🥧",
    image: "/food/beef_pie.png",
    ingredients: "Wheat flour (gluten), butter (milk), water, beef, potato, carrot, onion, chilli, salt, seasoning, vegetable oil.",
    allergens: "Contains gluten & milk.",
    storageInstructions: STORAGE_INSTRUCTIONS,
    bakingSteps: BAKING_STEPS,
    active: true,
    sortOrder: 0,
    stock: null,
  },
  {
    id: "shop-chicken-pie",
    name: "Chicken Pie",
    description:
      "Tender chicken and vegetables in a rich, savory filling, baked into a golden, flaky crust. A lighter classic the whole table agrees on.",
    price: 12,
    packSize: "4 fzn pk",
    emoji: "🥧",
    image: "/food/chicken_pie.png",
    ingredients: "Wheat flour (gluten), butter (milk), water, chicken, potato, carrot, onion, chilli, salt, seasoning, vegetable oil.",
    allergens: "Contains gluten & milk.",
    storageInstructions: STORAGE_INSTRUCTIONS,
    bakingSteps: BAKING_STEPS,
    active: true,
    sortOrder: 1,
    stock: null,
  },
];

async function getCollection(): Promise<Collection<ShopProductDoc>> {
  const db = await getMongoDb();
  const collection = db.collection<ShopProductDoc>("shop_products");
  const count = await collection.estimatedDocumentCount();
  if (count === 0) {
    const now = new Date().toISOString();
    await collection.insertMany(
      SEED_PRODUCTS.map((p) => ({
        _id: p.id,
        name: p.name,
        description: p.description,
        priceCents: Math.round(p.price * 100),
        packSize: p.packSize,
        emoji: p.emoji,
        imagePath: p.image ?? "",
        ingredients: p.ingredients,
        allergens: p.allergens,
        storageInstructions: p.storageInstructions,
        bakingSteps: p.bakingSteps,
        active: p.active,
        sortOrder: p.sortOrder,
        stock: p.stock ?? null,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }
  return collection;
}

function docToProduct(doc: ShopProductDoc): ShopProduct & { active: boolean; sortOrder: number } {
  return {
    productId: doc._id,
    name: doc.name,
    description: doc.description,
    price: doc.priceCents / 100,
    packSize: doc.packSize,
    emoji: doc.emoji,
    image: doc.imagePath || undefined,
    ingredients: doc.ingredients,
    allergens: doc.allergens,
    storageInstructions: doc.storageInstructions,
    bakingSteps: doc.bakingSteps,
    stock: doc.stock ?? null,
    active: doc.active,
    sortOrder: doc.sortOrder,
  };
}

export async function listActiveShopProducts(): Promise<ShopProduct[]> {
  const collection = await getCollection();
  const docs = await collection.find({ active: true }).sort({ sortOrder: 1 }).toArray();
  return docs.map(docToProduct);
}

/** All shop products including inactive — used by the admin panel. */
export async function listAllShopProducts(): Promise<(ShopProduct & { active: boolean; sortOrder: number })[]> {
  const collection = await getCollection();
  const docs = await collection.find({}).sort({ sortOrder: 1, name: 1 }).toArray();
  return docs.map(docToProduct);
}

export async function getShopProductById(id: string): Promise<ShopProduct | null> {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: id, active: true });
  return doc ? docToProduct(doc) : null;
}

/** Includes inactive products — used by the admin panel's edit page. */
export async function getAnyShopProductById(id: string): Promise<(ShopProduct & { active: boolean }) | null> {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: id });
  return doc ? docToProduct(doc) : null;
}

export async function createShopProduct(input: ShopProductInput): Promise<string> {
  const collection = await getCollection();
  const id = randomUUID();
  const [{ max } = { max: -1 }] = await collection
    .aggregate<{ max: number }>([{ $group: { _id: null, max: { $max: "$sortOrder" } } }])
    .toArray();
  const now = new Date().toISOString();

  await collection.insertOne({
    _id: id,
    name: input.name,
    description: input.description,
    priceCents: Math.round(input.price * 100),
    packSize: input.packSize,
    emoji: input.emoji,
    imagePath: input.image ?? "",
    ingredients: input.ingredients,
    allergens: input.allergens,
    storageInstructions: input.storageInstructions,
    bakingSteps: input.bakingSteps,
    active: input.active,
    sortOrder: (max ?? -1) + 1,
    stock: input.stock ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function updateShopProduct(id: string, input: ShopProductInput): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.updateOne(
    { _id: id },
    {
      $set: {
        name: input.name,
        description: input.description,
        priceCents: Math.round(input.price * 100),
        packSize: input.packSize,
        emoji: input.emoji,
        imagePath: input.image ?? "",
        ingredients: input.ingredients,
        allergens: input.allergens,
        storageInstructions: input.storageInstructions,
        bakingSteps: input.bakingSteps,
        active: input.active,
        stock: input.stock ?? null,
        updatedAt: new Date().toISOString(),
      },
    }
  );
  return result.matchedCount > 0;
}

export async function deleteShopProduct(id: string): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

export async function bulkSetShopProductsActive(ids: string[], active: boolean): Promise<number> {
  const collection = await getCollection();
  const result = await collection.updateMany(
    { _id: { $in: ids } },
    { $set: { active, updatedAt: new Date().toISOString() } }
  );
  return result.modifiedCount;
}

/** Swaps sortOrder with the immediate neighbor in the given direction, for simple up/down reordering in the admin list. */
export async function moveShopProduct(id: string, direction: "up" | "down"): Promise<boolean> {
  const collection = await getCollection();
  const current = await collection.findOne({ _id: id });
  if (!current) return false;

  const neighbor = await collection.findOne(
    { sortOrder: direction === "up" ? { $lt: current.sortOrder } : { $gt: current.sortOrder } },
    { sort: { sortOrder: direction === "up" ? -1 : 1 } }
  );
  if (!neighbor) return false;

  await collection.updateOne({ _id: current._id }, { $set: { sortOrder: neighbor.sortOrder } });
  await collection.updateOne({ _id: neighbor._id }, { $set: { sortOrder: current.sortOrder } });
  return true;
}

/** Checks every shop line in a cart against current stock without mutating anything — used at checkout time. */
export async function checkStockAvailable(
  lines: { productId: string; quantity: number }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const collection = await getCollection();
  for (const line of lines) {
    const doc = await collection.findOne({ _id: line.productId });
    if (!doc) return { ok: false, error: `Unknown product: ${line.productId}` };
    if (doc.stock !== null && doc.stock !== undefined && doc.stock < line.quantity) {
      return {
        ok: false,
        error: doc.stock === 0 ? `${doc.name} is sold out` : `Only ${doc.stock} of ${doc.name} left`,
      };
    }
  }
  return { ok: true };
}

/**
 * Atomically decrements stock, never going below zero. A no-op (returns true) for
 * products with unlimited stock (stock is null/unset). Guarded by a filter so
 * concurrent orders can't oversell past zero.
 */
export async function decrementStock(productId: string, quantity: number): Promise<boolean> {
  const collection = await getCollection();

  // Unlimited stock (null) needs no decrement — and $inc on a null field would error.
  const unlimited = await collection.updateOne(
    { _id: productId, stock: null },
    { $set: { updatedAt: new Date().toISOString() } }
  );
  if (unlimited.matchedCount > 0) return true;

  const result = await collection.updateOne(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity }, $set: { updatedAt: new Date().toISOString() } }
  );
  return result.matchedCount > 0;
}
