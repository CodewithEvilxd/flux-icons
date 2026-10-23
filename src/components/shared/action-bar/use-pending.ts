"use client";

import { useState } from "react";

import { toast } from "sonner";

// Runs one async export at a time; calls made while one is in flight are dropped.
export function usePending() {
  const [isPending, setIsPending] = useState(false);
  const withPending = async (fn: () => Promise<void>) => {
    if (isPending) return;
    setIsPending(true);
    try {
      await fn();
    } finally {
      setIsPending(false);
    }
  };
  return { isPending, withPending };
}

export async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch {
    toast.error("Failed to copy to clipboard");
  }
}
