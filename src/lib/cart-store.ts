"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItemSelection, CartLine, FulfillmentMode } from "./types";

function makeCartItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface CartState {
  items: CartLine[];
  fulfillment: FulfillmentMode;
  table: string | null;
  address: string;
  fullName: string;
  phone: string;
  email: string;
  hasHydrated: boolean;

  setTable: (table: string) => void;
  setFulfillment: (mode: FulfillmentMode) => void;
  setAddress: (address: string) => void;
  setContact: (fullName: string, phone: string, email: string) => void;

  addRestaurantItem: (
    itemId: string,
    selections: CartItemSelection[],
    quantity: number,
    specialInstructions?: string
  ) => void;
  updateRestaurantItem: (
    cartItemId: string,
    selections: CartItemSelection[],
    quantity: number,
    specialInstructions?: string
  ) => void;
  addShopItem: (productId: string, quantity: number) => void;
  setQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  clearAll: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      fulfillment: "delivery",
      table: null,
      address: "",
      fullName: "",
      phone: "",
      email: "",
      hasHydrated: false,

      setTable: (table) => set({ table, fulfillment: "dine-in" }),
      setFulfillment: (mode) => set({ fulfillment: mode }),
      setAddress: (address) => set({ address }),
      setContact: (fullName, phone, email) => set({ fullName, phone, email }),

      addRestaurantItem: (itemId, selections, quantity, specialInstructions) =>
        set({
          items: [
            ...get().items,
            {
              cartItemId: makeCartItemId(),
              kind: "restaurant",
              refId: itemId,
              selections,
              quantity,
              specialInstructions,
            },
          ],
        }),

      updateRestaurantItem: (cartItemId, selections, quantity, specialInstructions) =>
        set({
          items: get().items.map((ci) =>
            ci.cartItemId === cartItemId && ci.kind === "restaurant"
              ? { ...ci, selections, quantity, specialInstructions }
              : ci
          ),
        }),

      addShopItem: (productId, quantity) => {
        const existing = get().items.find((ci) => ci.kind === "shop" && ci.refId === productId);
        if (existing) {
          set({
            items: get().items.map((ci) =>
              ci.cartItemId === existing.cartItemId ? { ...ci, quantity: ci.quantity + quantity } : ci
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { cartItemId: makeCartItemId(), kind: "shop", refId: productId, quantity },
            ],
          });
        }
      },

      setQuantity: (cartItemId, quantity) =>
        set({
          items:
            quantity <= 0
              ? get().items.filter((ci) => ci.cartItemId !== cartItemId)
              : get().items.map((ci) => (ci.cartItemId === cartItemId ? { ...ci, quantity } : ci)),
        }),

      removeItem: (cartItemId) => set({ items: get().items.filter((ci) => ci.cartItemId !== cartItemId) }),

      clearCart: () => set({ items: [] }),

      clearAll: () =>
        set({
          items: [],
          fulfillment: "delivery",
          table: null,
          address: "",
          fullName: "",
          phone: "",
          email: "",
        }),

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "chop-africana-cart",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
