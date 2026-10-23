"use client";

import { useEffect, useRef } from "react";

import { motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

import { useFeedback } from "./use-feedback";

interface FeedbackFormProps {
  onClose: () => void;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function FeedbackForm({ onClose }: FeedbackFormProps) {
  const { feedbackText, setFeedbackText, canSubmit, handleSubmit } = useFeedback({
    onSuccess: onClose,
  });
  const reduceMotion = useReducedMotion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => textareaRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.button
        type="button"
        aria-label="Close feedback"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/30 dark:bg-black/50"
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: EASE_OUT }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Feedback"
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16, filter: "blur(6px)" }
        }
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={
          reduceMotion
            ? { opacity: 0, transition: { duration: 0.12 } }
            : {
                opacity: 0,
                scale: 0.97,
                y: 8,
                filter: "blur(4px)",
                transition: { duration: 0.16, ease: EASE_OUT },
              }
        }
        transition={
          reduceMotion ? { duration: 0.15 } : { type: "spring", duration: 0.5, bounce: 0.16 }
        }
        className="pad-card relative flex w-full max-w-sm flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-background text-foreground"
      >
        <textarea
          ref={textareaRef}
          placeholder="What icon or feature are you missing?"
          value={feedbackText}
          maxLength={1000}
          onChange={(e) => setFeedbackText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          aria-label="Your feedback"
          className="block min-h-[120px] w-full resize-none bg-transparent text-base text-foreground sm:text-body-sm outline-none placeholder:text-muted-foreground"
        />

        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-caption text-muted-foreground">
            Opens a prefilled GitHub issue.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-8 px-4 active:scale-[0.97]"
          >
            <span>Open issue</span>
          </Button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
