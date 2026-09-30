"use client";

import { create } from "zustand";
import { ShopProduct } from "./types";

interface ShopProductsState {
  items: ShopProduct[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
}

export const useShopProductsStore = create<ShopProductsState>()((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,
  fetchProducts: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/shop/products");
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      set({ items: data.products, loading: false, loaded: true });
    } catch {
      set({ loading: false, error: "Couldn't load products. Please refresh." });
    }
  },
}));
