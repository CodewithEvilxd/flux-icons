"use client";

import { Check, ChevronDown, Copy, FileCode as FileCode2, Loader as LoaderCircle } from "@/components/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type AgentCodeLanguage,
  AgentCodeLine,
  splitCodeLines,
  useAgentCodeTokens,
} from "@/components/agents/agent-code";
import { EASE_OUT, SPRING_PRESS, SPRING_SWAP } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type CodeBlockStatus = "streaming" | "complete";

export interface CodeBlockProps {
  code: string;
  language?: AgentCodeLanguage;
  filename?: ReactNode;
  status?: CodeBlockStatus;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  maxHeight?: number | string;
  wrap?: boolean;
  copyable?: boolean;
  expandable?: boolean;
  defaultExpanded?: boolean;
  onCopy?: () => void | Promise<void>;
  className?: string;
}

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  status = "complete",
  showLineNumbers = true,
  highlightLines = [],
  maxHeight = 260,
  wrap = false,
  copyable = true,
  expandable,
  defaultExpanded = false,
  onCopy,
  className,
}: CodeBlockProps) {
  const reduce = useReducedMotion() ?? false;
  const viewportRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const streaming = status === "streaming";
  const tokens = useAgentCodeTokens(code, language);
  const highlighted = useMemo(
    () => new Set(highlightLines),
    [highlightLines],
  );

  const lines = useMemo(() => splitCodeLines(code), [code]);
  const isLong = lines.length > 9;
  const canExpand = expandable ?? isLong;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || !isLong);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !streaming) return;
    const frame = requestAnimationFrame(() => {
      if (viewport.scrollHeight <= viewport.clientHeight) return;
      if (typeof viewport.scrollTo === "function") {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: reduce ? "auto" : "smooth",
        });
      } else {
        viewport.scrollTop = viewport.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(frame);
  });

  const handleCopy = useCallback(async () => {
    if (onCopy) await onCopy();
    else await navigator.clipboard?.writeText(code);
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
  }, [code, onCopy]);

  return (
    <div
      data-state={status}
      aria-busy={streaming}
      className={cn(
        "w-full overflow-hidden rounded-2xl bg-muted/80 text-sm border border-border/60 transition-colors duration-200",
        className,
      )}
    >
      <div className="flex h-10 items-center gap-2.5 px-3 border-b border-border/40 bg-muted/40 select-none">
        <FileCode2
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground/70"
        />
        {filename ? (
          <span className="min-w-0 truncate font-mono text-xs text-foreground/80">
            {filename}
          </span>
        ) : null}
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/55 font-mono">
          {language}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={streaming ? "streaming" : "ready"}
              initial={{ opacity: 0, y: -4, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.92 }}
              transition={SPRING_SWAP}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 text-[10px] font-medium font-mono",
                streaming
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {streaming ? (
                <LoaderCircle
                  className={cn("size-3", !reduce && "animate-spin")}
                />
              ) : (
                <Check className="size-3" />
              )}
              {streaming ? "Writing" : "Ready"}
            </motion.span>
          </AnimatePresence>

          {copyable || onCopy ? (
            <motion.button
              type="button"
              aria-label={copied ? "Copied" : "Copy code"}
              title={copied ? "Copied" : "Copy code"}
              onClick={handleCopy}
              whileTap={reduce ? undefined : { scale: 0.88 }}
              transition={SPRING_PRESS}
              className="relative grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-background/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.4, opacity: 0, rotate: 30 }}
                    transition={SPRING_SWAP}
                    className="text-emerald-500"
                  >
                    <Check className="size-3.5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={SPRING_SWAP}
                  >
                    <Copy className="size-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <div
          ref={viewportRef}
          role={streaming ? "log" : undefined}
          aria-live={streaming ? "polite" : undefined}
          className="scrollbar-hide overflow-auto py-2"
          style={{ maxHeight: isExpanded ? "none" : maxHeight }}
        >
          <motion.pre
            key={code}
            initial={reduce ? false : { opacity: 0.7, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="m-0 min-w-max font-mono text-xs leading-5 text-foreground/85"
          >
            <code>
              {lines.map((line, index) => {
                const lineNumber = index + 1;
                return (
                  <span
                    key={line.offset}
                    className={cn(
                      "grid min-h-5 transition-colors duration-150",
                      showLineNumbers
                        ? "grid-cols-[2.75rem_minmax(0,1fr)]"
                        : "grid-cols-1",
                      highlighted.has(lineNumber) && "bg-blue-500/[0.07]",
                    )}
                  >
                    {showLineNumbers ? (
                      <span className="select-none pr-3 text-right tabular-nums text-muted-foreground/35">
                        {lineNumber}
                      </span>
                    ) : null}
                    <AgentCodeLine
                      code={line.content}
                      tokens={tokens?.[index]}
                      className={cn(
                        "pr-4",
                        showLineNumbers ? "pl-1" : "pl-4",
                        wrap
                          ? "whitespace-pre-wrap wrap-break-word"
                          : "whitespace-pre",
                      )}
                    />
                  </span>
                );
              })}
            </code>
          </motion.pre>
        </div>

        {canExpand && !isExpanded && (
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-16 bg-linear-to-t from-muted via-muted/60 to-transparent" />
        )}
      </div>

      {canExpand && (
        <div className="flex items-center justify-center border-t border-border/40 bg-muted/40 py-2">
          <motion.button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={SPRING_PRESS}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-xs font-semibold text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors cursor-pointer select-none"
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
            <span>{isExpanded ? "Collapse Code" : "Expand Code"}</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
