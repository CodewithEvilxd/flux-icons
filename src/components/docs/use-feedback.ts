"use client";
import { useState } from "react";

import { toast } from "sonner";

const NEW_ISSUE_URL = "https://github.com/CodewithEvilxd/flux-icons/issues/new";

const TITLE_MAX = 72;
export interface UseFeedbackOptions {
  onSuccess?: () => void;
}
export function useFeedback({ onSuccess }: UseFeedbackOptions = {}) {
  const [feedbackText, setFeedbackText] = useState("");
  const canSubmit = Boolean(feedbackText.trim());
  const handleSubmit = () => {
    if (!canSubmit) return;
    const text = feedbackText.trim();
    const url = new URL(NEW_ISSUE_URL);
    url.searchParams.set("title", titleFrom(text));
    url.searchParams.set("body", text);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
    setFeedbackText("");
    toast.success("Opening GitHub with your issue prefilled");
    onSuccess?.();
  };
  return {
    feedbackText,
    setFeedbackText,
    canSubmit,
    handleSubmit,
  };
}
function titleFrom(text: string) {
  const [firstLine = ""] = text.split("\n");
  const trimmed = firstLine.trim();
  return trimmed.length > TITLE_MAX ? `${trimmed.slice(0, TITLE_MAX - 1)}\u2026` : trimmed;
}
