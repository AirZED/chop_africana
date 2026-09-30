"use client";

import { create } from "zustand";

/**
 * A tiny zustand-backed async data store. Fetching logic lives outside React's
 * local useState graph, so a `useEffect(() => { load(); }, [...])` call site
 * doesn't trip the set-state-in-effect rule the way a component-local
 * useState setter invoked synchronously in an effect would.
 */
export function createAsyncResource<T, A extends unknown[]>(fetcher: (...args: A) => Promise<T>) {
  return create<{
    data: T | null;
    loading: boolean;
    error: string | null;
    load: (...args: A) => Promise<void>;
  }>((set) => ({
    data: null,
    loading: false,
    error: null,
    load: async (...args: A) => {
      set({ loading: true, error: null });
      try {
        const data = await fetcher(...args);
        set({ data, loading: false });
      } catch {
        set({ loading: false, error: "Something went wrong. Please try again." });
      }
    },
  }));
}
