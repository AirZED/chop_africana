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
  bakingSteps: string[];
  active: boolean;
  sortOrder: number;
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
  bakingSteps: string[];
  active: boolean;
}

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
    ingredients:
      "Wheat flour, butter, minced beef (28%), potatoes, onions, carrots, egg, whole milk, beef stock, thyme, curry powder, white pepper, salt.",
    allergens: "Wheat (gluten), milk, egg. Made in a kitchen that also handles nuts.",
    bakingSteps: [
      "Preheat to 200°C (180°C fan).",
      "Bake from frozen, no thawing.",
      "30–35 minutes until golden, rest 5 minutes.",
    ],
    active: true,
    sortOrder: 0,
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
    ingredients:
      "Wheat flour, butter, chicken breast (26%), potatoes, onions, carrots, peas, egg, whole milk, chicken stock, thyme, white pepper, salt.",
    allergens: "Wheat (gluten), milk, egg. Made in a kitchen that also handles nuts.",
    bakingSteps: [
      "Preheat to 200°C (180°C fan).",
      "Bake from frozen, no thawing.",
      "30–35 minutes until golden, rest 5 minutes.",
    ],
    active: true,
    sortOrder: 1,
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
        bakingSteps: p.bakingSteps,
        active: p.active,
        sortOrder: p.sortOrder,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }
  return collection;
}

function docToProduct(doc: ShopProductDoc): ShopProduct & { active: boolean } {
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
    bakingSteps: doc.bakingSteps,
    active: doc.active,
  };
}

export async function listActiveShopProducts(): Promise<ShopProduct[]> {
  const collection = await getCollection();
  const docs = await collection.find({ active: true }).sort({ sortOrder: 1 }).toArray();
  return docs.map(docToProduct);
}

/** All shop products including inactive — used by the admin panel. */
export async function listAllShopProducts(): Promise<(ShopProduct & { active: boolean })[]> {
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
    bakingSteps: input.bakingSteps,
    active: input.active,
    sortOrder: (max ?? -1) + 1,
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
        bakingSteps: input.bakingSteps,
        active: input.active,
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
