import { randomUUID } from "node:crypto";
import { Collection } from "mongodb";
import { getMongoDb } from "./mongodb";
import { MenuItem, ModifierGroup } from "./types";

interface ModifierOptionDoc {
  id: string;
  name: string;
  priceCents: number;
}

interface ModifierGroupDoc {
  groupId: string;
  title: string;
  required: boolean;
  maxSelections: number;
  options: ModifierOptionDoc[];
}

interface MenuItemDoc {
  _id: string;
  name: string;
  description: string;
  basePriceCents: number;
  category: string;
  emoji: string;
  imagePath: string;
  prepMinutes: number;
  popular: boolean;
  active: boolean;
  sortOrder: number;
  modifierGroups: ModifierGroupDoc[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemInput {
  name: string;
  description: string;
  basePrice: number;
  category: MenuItem["category"];
  emoji: string;
  image?: string;
  prepMinutes?: number;
  popular: boolean;
  active: boolean;
  modifierGroups: {
    id?: string;
    title: string;
    required: boolean;
    maxSelections: number;
    options: { id?: string; name: string; price: number }[];
  }[];
}

const SEED_ITEMS: (MenuItemInput & { id: string; sortOrder: number })[] = [
  {
    id: "smoky-jollof-rice",
    name: "Smoky Jollof Rice",
    basePrice: 14.5,
    description: "Party-style jollof, charred at the bottom, with grilled chicken thigh.",
    category: "Mains",
    emoji: "🍚",
    image: "/menu/smoky_jellof.png",
    prepMinutes: 25,
    popular: true,
    active: true,
    modifierGroups: [],
    sortOrder: 0,
  },
  {
    id: "beef-tacos",
    name: "Beef Tacos",
    basePrice: 9.5,
    description: "Soft corn tortillas filled with seasoned beef, fresh salsa, and avocado.",
    category: "Mains",
    emoji: "🌮",
    image: "/menu/beef_tacos.jpg",
    prepMinutes: 10,
    popular: false,
    active: true,
    modifierGroups: [],
    sortOrder: 1,
  },
  {
    id: "vegetable-stir-fry",
    name: "Vegetable Stir-Fry",
    basePrice: 11,
    description: "A colorful mix of seasonal veggies, sautéed with soy sauce and sesame seeds.",
    category: "Soups & Sides",
    emoji: "🥗",
    image: "/menu/vegetable_stir.jpg",
    prepMinutes: 15,
    popular: false,
    active: true,
    modifierGroups: [],
    sortOrder: 2,
  },
  {
    id: "classic-caesar-salad",
    name: "Classic Caesar Salad",
    basePrice: 8.5,
    description: "Crisp romaine lettuce with Caesar dressing, croutons, and parmesan.",
    category: "Soups & Sides",
    emoji: "🥙",
    image: "/menu/classic_ceaser.jpg",
    prepMinutes: 5,
    popular: false,
    active: true,
    modifierGroups: [],
    sortOrder: 3,
  },
  {
    id: "grilled-salmon",
    name: "Grilled Salmon",
    basePrice: 16,
    description: "Salmon fillet grilled to perfection, served with lemon butter sauce.",
    category: "Grills",
    emoji: "🐟",
    image: "/menu/grilled_salmon.jpg",
    prepMinutes: 20,
    popular: true,
    active: true,
    modifierGroups: [],
    sortOrder: 4,
  },
  {
    id: "chocolate-lava-cake",
    name: "Chocolate Lava Cake",
    basePrice: 6.5,
    description: "Warm chocolate cake with a gooey center, served with vanilla ice cream.",
    category: "Desserts",
    emoji: "🍫",
    image: "/menu/chocolate_lava.jpg",
    prepMinutes: 10,
    popular: false,
    active: true,
    modifierGroups: [],
    sortOrder: 5,
  },
];

async function getCollection(): Promise<Collection<MenuItemDoc>> {
  const db = await getMongoDb();
  const collection = db.collection<MenuItemDoc>("menu_items");
  const count = await collection.estimatedDocumentCount();
  if (count === 0) {
    const now = new Date().toISOString();
    await collection.insertMany(
      SEED_ITEMS.map((item) => ({
        _id: item.id,
        name: item.name,
        description: item.description,
        basePriceCents: Math.round(item.basePrice * 100),
        category: item.category,
        emoji: item.emoji,
        imagePath: item.image ?? "",
        prepMinutes: item.prepMinutes ?? 15,
        popular: item.popular,
        active: item.active,
        sortOrder: item.sortOrder,
        modifierGroups: [],
        createdAt: now,
        updatedAt: now,
      }))
    );
  }
  return collection;
}

function docToMenuItem(doc: MenuItemDoc): MenuItem & { active: boolean } {
  const modifierGroups: ModifierGroup[] = [...doc.modifierGroups]
    .map((g) => ({
      groupId: g.groupId,
      title: g.title,
      required: g.required,
      maxSelections: g.maxSelections,
      options: g.options.map((o) => ({ id: o.id, name: o.name, price: o.priceCents / 100 })),
    }));

  return {
    itemId: doc._id,
    name: doc.name,
    description: doc.description,
    basePrice: doc.basePriceCents / 100,
    category: doc.category as MenuItem["category"],
    emoji: doc.emoji,
    image: doc.imagePath || undefined,
    prepMinutes: doc.prepMinutes,
    popular: doc.popular,
    modifierGroups,
    active: doc.active,
  };
}

function toModifierGroupDocs(groups: MenuItemInput["modifierGroups"]): ModifierGroupDoc[] {
  return groups.map((g) => ({
    groupId: g.id ?? randomUUID(),
    title: g.title,
    required: g.required,
    maxSelections: g.maxSelections,
    options: g.options.map((o) => ({
      id: o.id ?? randomUUID(),
      name: o.name,
      priceCents: Math.round(o.price * 100),
    })),
  }));
}

/** Active menu items only, in display order — used by the public storefront. */
export async function listActiveMenuItems(): Promise<MenuItem[]> {
  const collection = await getCollection();
  const docs = await collection
    .find({ active: true })
    .sort({ sortOrder: 1, name: 1 })
    .toArray();
  return docs.map(docToMenuItem);
}

/** All menu items including inactive — used by the admin panel. */
export async function listAllMenuItems(): Promise<(MenuItem & { active: boolean })[]> {
  const collection = await getCollection();
  const docs = await collection.find({}).sort({ sortOrder: 1, name: 1 }).toArray();
  return docs.map(docToMenuItem);
}

export async function getMenuItemById(id: string): Promise<(MenuItem & { active: boolean }) | null> {
  const collection = await getCollection();
  const doc = await collection.findOne({ _id: id });
  return doc ? docToMenuItem(doc) : null;
}

export async function createMenuItem(input: MenuItemInput): Promise<string> {
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
    basePriceCents: Math.round(input.basePrice * 100),
    category: input.category,
    emoji: input.emoji,
    imagePath: input.image ?? "",
    prepMinutes: input.prepMinutes ?? 15,
    popular: input.popular,
    active: input.active,
    sortOrder: (max ?? -1) + 1,
    modifierGroups: toModifierGroupDocs(input.modifierGroups),
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function updateMenuItem(id: string, input: MenuItemInput): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.updateOne(
    { _id: id },
    {
      $set: {
        name: input.name,
        description: input.description,
        basePriceCents: Math.round(input.basePrice * 100),
        category: input.category,
        emoji: input.emoji,
        imagePath: input.image ?? "",
        prepMinutes: input.prepMinutes ?? 15,
        popular: input.popular,
        active: input.active,
        modifierGroups: toModifierGroupDocs(input.modifierGroups),
        updatedAt: new Date().toISOString(),
      },
    }
  );
  return result.matchedCount > 0;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: id });
  return result.deletedCount > 0;
}
