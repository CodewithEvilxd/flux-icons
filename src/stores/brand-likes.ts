"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BrandLikesStore {
  liked: string[];
  toggle: (slug: string) => void;
}

export const useBrandLikesStore = create<BrandLikesStore>()(
  persist(
    (set) => ({
      liked: [],
      toggle: (slug) =>
        set((state) => ({
          liked: state.liked.includes(slug)
            ? state.liked.filter((item) => item !== slug)
            : [...state.liked, slug],
        })),
    }),
    { name: "runeicons-brand-likes", skipHydration: true },
  ),
);
