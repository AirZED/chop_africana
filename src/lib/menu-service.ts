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

const SWALLOW_OPTIONS = {
  title: "Swallow Option",
  required: true,
  maxSelections: 1,
  options: [
    { name: "Eba", price: 0 },
    { name: "Poundo", price: 0 },
    { name: "Starch", price: 0 },
    { name: "Amala", price: 0 },
  ],
};

const SEED_ITEMS: (MenuItemInput & { id: string; sortOrder: number })[] = [
  // --- Combo Deals ---
  {
    id: "combo-meal-13",
    name: "£13 Combo Meal",
    description: "Includes 1 rice dish, 1 side, and 1 protein of your choice.",
    basePrice: 13,
    category: "Combo Deals",
    emoji: "🍱",
    prepMinutes: 20,
    popular: true,
    active: true,
    sortOrder: 0,
    modifierGroups: [
      {
        title: "Rice Dish",
        required: true,
        maxSelections: 1,
        options: [
          { name: "Jollof Rice", price: 0 },
          { name: "Fried Rice", price: 0 },
          { name: "Coconut Rice", price: 0 },
        ],
      },
      {
        title: "Side",
        required: true,
        maxSelections: 1,
        options: [
          { name: "Plantain", price: 0 },
          { name: "Moi Moi", price: 0 },
          { name: "Salad", price: 0 },
        ],
      },
      {
        title: "Protein",
        required: true,
        maxSelections: 1,
        options: [
          { name: "Soft Chicken Thigh", price: 0 },
          { name: "Turkey Mid-Wing", price: 0 },
          { name: "Hake Fish", price: 0 },
          { name: "Mackerel Fish", price: 0 },
        ],
      },
    ],
  },
  {
    id: "combo-meal-10",
    name: "£10 Combo Meal",
    description: "Includes 1 rice dish and 1 side, with a soft chicken drumstick.",
    basePrice: 10,
    category: "Combo Deals",
    emoji: "🍱",
    prepMinutes: 20,
    popular: false,
    active: true,
    sortOrder: 1,
    modifierGroups: [
      {
        title: "Rice Dish",
        required: true,
        maxSelections: 1,
        options: [
          { name: "Jollof Rice", price: 0 },
          { name: "Fried Rice", price: 0 },
          { name: "Coconut Rice", price: 0 },
        ],
      },
      {
        title: "Side",
        required: true,
        maxSelections: 1,
        options: [
          { name: "Plantain", price: 0 },
          { name: "Moi Moi", price: 0 },
          { name: "Salad", price: 0 },
        ],
      },
    ],
  },

  // --- Rice Dishes ---
  { id: "jollof-rice", name: "Jollof Rice", description: "Our signature smoky party jollof rice.", basePrice: 8, category: "Rice Dishes", emoji: "🍚", prepMinutes: 15, popular: true, active: true, sortOrder: 2, modifierGroups: [] },
  { id: "fried-rice", name: "Fried Rice", description: "Classic Nigerian-style fried rice with mixed vegetables.", basePrice: 8, category: "Rice Dishes", emoji: "🍚", prepMinutes: 15, popular: false, active: true, sortOrder: 3, modifierGroups: [] },
  { id: "coconut-rice", name: "Coconut Rice", description: "Fragrant rice cooked in rich coconut milk.", basePrice: 8, category: "Rice Dishes", emoji: "🍚", prepMinutes: 15, popular: false, active: true, sortOrder: 4, modifierGroups: [] },
  { id: "ofada-rice-ayamase", name: "Ofada Rice & Ayamase Stew", description: "Local Ofada rice served with spicy ayamase (green pepper) stew.", basePrice: 13, category: "Rice Dishes", emoji: "🍚", prepMinutes: 20, popular: false, active: true, sortOrder: 5, modifierGroups: [] },

  // --- Other Dishes ---
  { id: "beans-pottage", name: "Beans Pottage", description: "Slow-cooked beans pottage, a hearty Nigerian classic.", basePrice: 10, category: "Other Dishes", emoji: "🍲", prepMinutes: 20, popular: false, active: true, sortOrder: 6, modifierGroups: [] },
  { id: "special-noodles-omelette", name: "Special Noodles & Plain Omelette", description: "Stir-fried noodles served with a plain omelette.", basePrice: 9.5, category: "Other Dishes", emoji: "🍲", prepMinutes: 15, popular: false, active: true, sortOrder: 7, modifierGroups: [] },

  // --- Protein (a la carte) ---
  { id: "soft-chicken-thigh", name: "Soft Chicken Thigh", description: "Tender, well-seasoned chicken thigh.", basePrice: 4.5, category: "Protein", emoji: "🍗", prepMinutes: 15, popular: false, active: true, sortOrder: 8, modifierGroups: [] },
  { id: "soft-chicken-drumstick", name: "Soft Chicken Drumstick", description: "Tender, well-seasoned chicken drumstick.", basePrice: 1.5, category: "Protein", emoji: "🍗", prepMinutes: 15, popular: false, active: true, sortOrder: 9, modifierGroups: [] },
  { id: "turkey-mid-wing", name: "Turkey Mid-Wing", description: "Grilled turkey mid-wing.", basePrice: 4.5, category: "Protein", emoji: "🍗", prepMinutes: 15, popular: false, active: true, sortOrder: 10, modifierGroups: [] },
  { id: "hake-fish", name: "Hake Fish", description: "Pan-fried hake fish fillet.", basePrice: 4.5, category: "Protein", emoji: "🐟", prepMinutes: 15, popular: false, active: true, sortOrder: 11, modifierGroups: [] },
  { id: "beef-suya", name: "Beef Suya", description: "Spiced, char-grilled beef suya skewers.", basePrice: 9.5, category: "Protein", emoji: "🍢", prepMinutes: 18, popular: true, active: true, sortOrder: 12, modifierGroups: [] },
  { id: "suya-chicken-wings", name: "Suya Chicken Wings", description: "2 pieces of suya-spiced chicken wings.", basePrice: 3.5, category: "Protein", emoji: "🍗", prepMinutes: 15, popular: false, active: true, sortOrder: 13, modifierGroups: [] },
  { id: "honey-bbq-wings", name: "Honey BBQ Wings", description: "2 pieces of honey BBQ glazed wings.", basePrice: 3.5, category: "Protein", emoji: "🍗", prepMinutes: 15, popular: false, active: true, sortOrder: 14, modifierGroups: [] },
  { id: "nkwobi", name: "Nkwobi (Cow Foot)", description: "Spiced cow foot in a rich palm oil sauce.", basePrice: 9.5, category: "Protein", emoji: "🍖", prepMinutes: 20, popular: false, active: true, sortOrder: 15, modifierGroups: [] },

  // --- Extras ---
  { id: "extra-plantain", name: "Plantain", description: "Sweet fried plantain.", basePrice: 4, category: "Extras", emoji: "🍌", prepMinutes: 10, popular: false, active: true, sortOrder: 16, modifierGroups: [] },
  { id: "extra-yam-fries", name: "Yam Fries", description: "Crispy fried yam.", basePrice: 4, category: "Extras", emoji: "🍟", prepMinutes: 10, popular: false, active: true, sortOrder: 17, modifierGroups: [] },
  { id: "extra-chips", name: "Chips", description: "Classic fries.", basePrice: 3, category: "Extras", emoji: "🍟", prepMinutes: 10, popular: false, active: true, sortOrder: 18, modifierGroups: [] },
  { id: "extra-moi-moi", name: "Moi Moi", description: "Steamed bean pudding.", basePrice: 2, category: "Extras", emoji: "🍮", prepMinutes: 10, popular: false, active: true, sortOrder: 19, modifierGroups: [] },
  { id: "extra-salad", name: "Salad", description: "Fresh side salad.", basePrice: 1.8, category: "Extras", emoji: "🥗", prepMinutes: 5, popular: false, active: true, sortOrder: 20, modifierGroups: [] },

  // --- Nigerian Soups ---
  {
    id: "egusi-soup", name: "Egusi Soup", description: "Rich melon seed soup.", basePrice: 13, category: "Nigerian Soups", emoji: "🥘", prepMinutes: 25, popular: true, active: true, sortOrder: 21,
    modifierGroups: [
      { title: "Protein Option", required: true, maxSelections: 1, options: [{ name: "Assorted Meat", price: 0 }, { name: "Goat Meat", price: 0 }, { name: "Chicken Thigh", price: 0 }] },
      SWALLOW_OPTIONS,
    ],
  },
  {
    id: "ogbono-soup", name: "Ogbono Soup", description: "Draw soup made from ground ogbono seeds, served with assorted meat.", basePrice: 14.5, category: "Nigerian Soups", emoji: "🥘", prepMinutes: 25, popular: false, active: true, sortOrder: 22,
    modifierGroups: [SWALLOW_OPTIONS],
  },
  {
    id: "oha-soup", name: "Oha Soup", description: "Traditional oha-leaf soup, served with assorted meat.", basePrice: 14.5, category: "Nigerian Soups", emoji: "🥘", prepMinutes: 25, popular: false, active: true, sortOrder: 23,
    modifierGroups: [SWALLOW_OPTIONS],
  },
  {
    id: "banga-soup", name: "Banga Soup", description: "Palm nut soup.", basePrice: 14.5, category: "Nigerian Soups", emoji: "🥘", prepMinutes: 25, popular: false, active: true, sortOrder: 24,
    modifierGroups: [
      { title: "Protein Option", required: true, maxSelections: 1, options: [{ name: "Assorted Meat", price: 0 }, { name: "Fresh Fish", price: 0 }] },
      SWALLOW_OPTIONS,
    ],
  },
  {
    id: "afang-soup", name: "Afang Soup", description: "Afang-leaf soup with a rich vegetable base.", basePrice: 14.5, category: "Nigerian Soups", emoji: "🥘", prepMinutes: 25, popular: false, active: true, sortOrder: 25,
    modifierGroups: [
      { title: "Protein Option", required: true, maxSelections: 1, options: [{ name: "Assorted Meat", price: 0 }, { name: "Goat Meat", price: 0 }] },
      SWALLOW_OPTIONS,
    ],
  },
  {
    id: "white-soup", name: "White Soup", description: "Light, peppery white soup, served with assorted meat.", basePrice: 13, category: "Nigerian Soups", emoji: "🥘", prepMinutes: 25, popular: false, active: true, sortOrder: 26,
    modifierGroups: [SWALLOW_OPTIONS],
  },
  {
    id: "efo-riro-soup", name: "Efo Riro Soup", description: "Classic vegetable soup.", basePrice: 14.5, category: "Nigerian Soups", emoji: "🥘", prepMinutes: 25, popular: false, active: true, sortOrder: 27,
    modifierGroups: [
      { title: "Protein Option", required: true, maxSelections: 1, options: [{ name: "Assorted Meat", price: 0 }, { name: "Chicken Thigh", price: 0 }] },
      SWALLOW_OPTIONS,
    ],
  },
  {
    id: "pepper-soup", name: "Pepper Soup", description: "Light, spicy pepper soup broth.", basePrice: 6, category: "Nigerian Soups", emoji: "🍲", prepMinutes: 20, popular: false, active: true, sortOrder: 28,
    modifierGroups: [
      { title: "Protein Option", required: true, maxSelections: 1, options: [{ name: "Cow Assorted Meat", price: 0 }, { name: "Goat Assorted Meat", price: 0.5 }, { name: "Cat Fish", price: 1 }] },
      SWALLOW_OPTIONS,
    ],
  },

  // --- Pastries ---
  {
    id: "puff-puff", name: "Puff Puff (Box of 6)", description: "6 soft, sweet Nigerian puff puff.", basePrice: 2.5, category: "Pastries", emoji: "🍩", prepMinutes: 8, popular: true, active: true, sortOrder: 29,
    modifierGroups: [
      {
        title: "Toppings", required: false, maxSelections: 5,
        options: [
          { name: "Biscoff Sauce", price: 0.5 },
          { name: "Milk Chocolate Sauce", price: 0.5 },
          { name: "White Chocolate Sauce", price: 0.5 },
          { name: "Oreo Cookie Crumbs", price: 0.5 },
          { name: "Biscoff Cookie Crumbs", price: 0.5 },
        ],
      },
    ],
  },
  {
    id: "meat-pie", name: "Meat Pie", description: "Flaky, savoury Nigerian meat pie.", basePrice: 2.5, category: "Pastries", emoji: "🥐", prepMinutes: 5, popular: false, active: true, sortOrder: 30,
    modifierGroups: [
      { title: "Quantity", required: true, maxSelections: 1, options: [{ name: "1 Pie", price: 0 }, { name: "5 Pies", price: 7.5 }] },
    ],
  },
  { id: "small-chops-box", name: "Small Chops Box", description: "Samosa, spring rolls, puff puff & chicken drumstick.", basePrice: 4.5, category: "Pastries", emoji: "🍱", prepMinutes: 10, popular: false, active: true, sortOrder: 31, modifierGroups: [] },

  // --- Soft Drinks ---
  { id: "fanta", name: "Fanta", description: "", basePrice: 2.5, category: "Soft Drinks", emoji: "🥤", prepMinutes: 2, popular: false, active: true, sortOrder: 32, modifierGroups: [] },
  { id: "coke", name: "Coke", description: "", basePrice: 2.5, category: "Soft Drinks", emoji: "🥤", prepMinutes: 2, popular: false, active: true, sortOrder: 33, modifierGroups: [] },
  { id: "sprite", name: "Sprite", description: "", basePrice: 2.5, category: "Soft Drinks", emoji: "🥤", prepMinutes: 2, popular: false, active: true, sortOrder: 34, modifierGroups: [] },
  { id: "malt", name: "Malt", description: "", basePrice: 2.5, category: "Soft Drinks", emoji: "🥤", prepMinutes: 2, popular: false, active: true, sortOrder: 35, modifierGroups: [] },
  {
    id: "canned-soft-drink", name: "Canned Soft Drink", description: "Coke, Fanta, Sprite or Tango.", basePrice: 1.5, category: "Soft Drinks", emoji: "🥫", prepMinutes: 2, popular: false, active: true, sortOrder: 36,
    modifierGroups: [{ title: "Flavour", required: true, maxSelections: 1, options: [{ name: "Coke", price: 0 }, { name: "Fanta", price: 0 }, { name: "Sprite", price: 0 }, { name: "Tango", price: 0 }] }],
  },
  {
    id: "schweppes-mojito-chapman", name: "Schweppes Mojito or Chapman", description: "", basePrice: 1.8, category: "Soft Drinks", emoji: "🥤", prepMinutes: 2, popular: false, active: true, sortOrder: 37,
    modifierGroups: [{ title: "Flavour", required: true, maxSelections: 1, options: [{ name: "Mojito", price: 0 }, { name: "Chapman", price: 0 }] }],
  },

  // --- Alcoholic Drinks ---
  { id: "nigerian-heineken", name: "Nigerian Heineken", description: "", basePrice: 6, category: "Alcoholic Drinks", emoji: "🍺", prepMinutes: 2, popular: false, active: true, sortOrder: 38, modifierGroups: [] },
  { id: "small-nigerian-stout", name: "Small Nigerian Stout", description: "", basePrice: 5.5, category: "Alcoholic Drinks", emoji: "🍺", prepMinutes: 2, popular: false, active: true, sortOrder: 39, modifierGroups: [] },
  { id: "big-nigerian-stout", name: "Big Nigerian Stout", description: "", basePrice: 9.5, category: "Alcoholic Drinks", emoji: "🍺", prepMinutes: 2, popular: false, active: true, sortOrder: 40, modifierGroups: [] },
  { id: "star-beer", name: "Star Beer", description: "", basePrice: 4.5, category: "Alcoholic Drinks", emoji: "🍺", prepMinutes: 2, popular: false, active: true, sortOrder: 41, modifierGroups: [] },
  { id: "origin-beer", name: "Origin Beer", description: "", basePrice: 5.5, category: "Alcoholic Drinks", emoji: "🍺", prepMinutes: 2, popular: false, active: true, sortOrder: 42, modifierGroups: [] },
  { id: "origin-bitters", name: "Origin Bitters", description: "", basePrice: 7.5, category: "Alcoholic Drinks", emoji: "🍺", prepMinutes: 2, popular: false, active: true, sortOrder: 43, modifierGroups: [] },
  { id: "smirnoff-ice", name: "Smirnoff Ice", description: "", basePrice: 4, category: "Alcoholic Drinks", emoji: "🍺", prepMinutes: 2, popular: false, active: true, sortOrder: 44, modifierGroups: [] },
  { id: "palm-wine", name: "Palm Wine", description: "", basePrice: 3.5, category: "Alcoholic Drinks", emoji: "🍷", prepMinutes: 2, popular: false, active: true, sortOrder: 45, modifierGroups: [] },
  { id: "jekomo", name: "Jekomo", description: "", basePrice: 2.5, category: "Alcoholic Drinks", emoji: "🍺", prepMinutes: 2, popular: false, active: true, sortOrder: 46, modifierGroups: [] },
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
        modifierGroups: toModifierGroupDocs(item.modifierGroups),
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

export async function bulkSetMenuItemsActive(ids: string[], active: boolean): Promise<number> {
  const collection = await getCollection();
  const result = await collection.updateMany(
    { _id: { $in: ids } },
    { $set: { active, updatedAt: new Date().toISOString() } }
  );
  return result.modifiedCount;
}

/** Swaps sortOrder with the immediate neighbor in the given direction, for simple up/down reordering in the admin list. */
export async function moveMenuItem(id: string, direction: "up" | "down"): Promise<boolean> {
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
