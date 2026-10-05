export type MenuCategory = "Mains" | "Soups & Sides" | "Grills" | "Drinks" | "Desserts";

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  groupId: string;
  title: string;
  required: boolean;
  maxSelections: number;
  options: ModifierOption[];
}

export interface MenuItem {
  itemId: string;
  name: string;
  basePrice: number;
  description: string;
  category: MenuCategory;
  emoji: string;
  image?: string;
  prepMinutes?: number;
  popular?: boolean;
  modifierGroups: ModifierGroup[];
}

export interface CartItemSelection {
  groupId: string;
  optionIds: string[];
}

export interface ShopProduct {
  productId: string;
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
  /** undefined/null = unlimited stock. 0 = sold out. */
  stock?: number | null;
}

/** A single line in the unified cart — either a restaurant dish or a shop (pie) product. */
export type CartLine =
  | {
      cartItemId: string;
      kind: "restaurant";
      refId: string; // MenuItem.itemId
      quantity: number;
      selections: CartItemSelection[];
      specialInstructions?: string;
    }
  | {
      cartItemId: string;
      kind: "shop";
      refId: string; // ShopProduct.productId
      quantity: number;
    };

export type FulfillmentMode = "delivery" | "pickup" | "dine-in";
