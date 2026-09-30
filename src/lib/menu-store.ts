"use client";

import { create } from "zustand";
import { MenuItem } from "./types";

interface MenuState {
  items: MenuItem[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
}

export const useMenuStore = create<MenuState>()((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,
  fetchMenu: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to load menu");
      const data = await res.json();
      set({ items: data.items, loading: false, loaded: true });
    } catch {
      set({ loading: false, error: "Couldn't load the menu. Please refresh." });
    }
  },
}));
