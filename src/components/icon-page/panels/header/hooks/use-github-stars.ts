"use client";
import { useEffect, useState } from "react";
import { animate } from "motion/react";

const STORAGE_KEY = "runeicons-github-stars";
const MAX_AGE_MS = 30 * 60 * 1000;

let memory: { stars: number; at: number } | null = null;
let inflight: Promise<number | null> | null = null;

const readStored = (): { stars: number; at: number } | null => {
  if (memory && Date.now() - memory.at < MAX_AGE_MS) return memory;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { stars?: unknown; at?: unknown };
    if (typeof parsed.stars !== "number" || typeof parsed.at !== "number") return null;
    if (Date.now() - parsed.at >= MAX_AGE_MS) return null;
    memory = { stars: parsed.stars, at: parsed.at };
    return memory;
  } catch {
    return null;
  }
};

const loadStars = (): Promise<number | null> => {
  const stored = readStored();
  if (stored) return Promise.resolve(stored.stars);
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const response = await fetch("/api/github-stars");
      if (!response.ok) return null;
      const { stars } = (await response.json()) as { stars: number | null };
      if (stars == null) return null;
      memory = { stars, at: Date.now() };
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
      } catch {}
      return stars;
    } catch (error) {
      console.error("Error fetching stars:", error);
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
};

export function useGitHubStars() {
  const [displayCount, setDisplayCount] = useState<string>("0");

  useEffect(() => {
    let controls: ReturnType<typeof animate> | undefined;
    let cancelled = false;

    loadStars().then((stars) => {
      if (cancelled || stars == null) return;
      controls = animate(0, stars, {
        duration: 2,
        ease: "easeOut",
        onUpdate(value) {
          const current = Math.floor(value);
          if (current >= 1000) {
            setDisplayCount((current / 1000).toFixed(1) + "K");
          } else {
            setDisplayCount(current.toString());
          }
        },
      });
    });

    return () => {
      cancelled = true;
      if (controls) {
        controls.stop();
      }
    };
  }, []);

  return displayCount;
}
