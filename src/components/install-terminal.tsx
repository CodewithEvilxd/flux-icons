"use client"

import * as React from "react"

import { Check, Copy, Terminal } from "@/components/icons"
import { Segmented, SegmentedItem } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import {
  installIcon,
  installSet,
  PACKAGE_MANAGERS,
  REACT_PACKAGE,
  type PackageManager,
} from "@/lib/icon-code"
import { track } from "@/lib/analytics"

/**
 * Every way of installing the set, in a terminal, for whichever package manager
 * the reader uses.
 *
 * The landing page had one hardcoded `npm i` line inside a code block. That is
 * a screenshot of an install rather than an install: it does not say what the
 * CLI is for, and it silently assumes npm on a site whose own preview dock has
 * offered pnpm, yarn and bun for months. Both commands come from
 * `lib/icon-code.ts`, which is the same source the dock copies from, so the
 * page cannot drift from what the packages are actually called.
 *
 * **Two commands, because they are two different things.** `add` is a
 * dependency: every icon, as components, updated when you update it. `exec`
 * runs the CLI once and leaves a drawing in your project with nothing in your
 * lockfile. Every manager spells the second one differently, which is the whole
 * reason `PACKAGE_MANAGERS` carries a pair of verbs rather than a name.
 *
 * **Only the first line moves with the framework.** `cli add` writes a plain
 * SVG file, so it is the same command and the same result whatever you are
 * building in; the dependency above it is not, because only React has a package
 * of this project's own. That asymmetry is why `install` is one prop rather
 * than a whole framework object: there is exactly one line to swap.
 *
 * The picker is `Segmented`, the site's one-of-many control, and its choice is
 * component state rather than the settings cookie: the cookie is for how the
 * set is drawn, not for facts about the reader's machine. The dock makes the
 * same call for the same reason.
 */
export function InstallTerminal({
  /** The drawing the `add` example names. Checked by `check-demos`. */
  example,
  /**
   * Rendered at the left of the header, where the terminal glyph would be.
   *
   * The framework picker lives there. It was a row of its own above the card
   * and belongs inside it: what you are installing into and what you type to do
   * it are one decision, and splitting them across two surfaces made the chips
   * look like a section header rather than a control on this block.
   */
  leading,
  /**
   * The dependency the first line installs, and the comment written above it.
   *
   * It defaults to the React package, so a caller that passes nothing gets the
   * line this terminal has always shown.
   */
  install = { note: "Every icon, as React components", pkg: REACT_PACKAGE },
}: {
  example: string
  leading?: React.ReactNode
  install?: { note: string; pkg: string }
}) {
  const [pm, setPm] = React.useState<PackageManager>("npm")
  const [copied, setCopied] = React.useState(false)

  const lines = [
    { note: install.note, command: installSet(pm, install.pkg) },
    {
      note: "Or copy one drawing in, with nothing left in your lockfile",
      command: installIcon(pm, example, "stroke"),
    },
  ]

  /*
    The copy takes the commands and not the comments. What lands on a clipboard
    should be runnable when it is pasted, and a `#` line pasted into a shell is
    at best noise and at worst the reason someone thinks the snippet failed.

    Awaited, and the tick only appears if the write resolved. `writeText` is
    refused outright in some contexts, and a button that says "Copied" over an
    empty clipboard is worse than one that does nothing. This page has no
    `Toaster` — that lives on `/icons` — so a refusal is silent here rather than
    reported, which is the one difference from `components/copy-name.tsx`.

    The tick returns to a copy glyph on its own, because a button stuck on
    "Copied" cannot say it a second time, and the second time is exactly when
    someone doubts the first.
  */
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        lines.map((line) => line.command).join("\n")
      )
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
      track("install_copy", { manager: pm, target: "terminal" })
    } catch {
      setCopied(false)
    }
  }

  return (
    /*
      `p-3` with a matching `pb-3` on the header, so the three gaps inside this
      card are the same 12px: above the chips, between the chips and the block,
      and below it. At `p-2` with no top pad of its own the row sat 8px under
      the card's edge with 32px chips in it, which reads as a control jammed
      into a corner rather than one sitting in a header.
    */
    <div className="paper-card-dashed paper-tape-top-left relative p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-1 pb-3">
        {leading ?? (
          <div className="flex items-center gap-2">
            <Terminal className="size-4 shrink-0 text-amber-500" />
            <span className="font-handwritten text-xs font-bold text-amber-500 uppercase tracking-wider">[ TERMINAL CONSOLE ]</span>
          </div>
        )}

        <Segmented className="sm:ml-auto">
          {PACKAGE_MANAGERS.map((manager) => (
            <SegmentedItem
              key={manager.value}
              active={pm === manager.value}
              onClick={() => setPm(manager.value)}
              className="px-2.5 font-handwritten font-bold uppercase"
            >
              {manager.value}
            </SegmentedItem>
          ))}
        </Segmented>

        <Button
          size="icon-lg"
          variant="ghost"
          onClick={copy}
          aria-label={`Copy the ${pm} commands`}
          className="border border-dashed border-border/80 hover:border-amber-500/50 hover:bg-amber-500/10"
        >
          {copied ? <Check className="text-green-500" /> : <Copy />}
        </Button>
      </div>

      <pre className="overflow-x-auto rounded-xl border border-dashed border-border/80 bg-muted/80 px-4 py-4 font-mono text-[13px] leading-relaxed">
        <code>
          {lines.map((line, index) => (
            <React.Fragment key={line.command}>
              {index > 0 && "\n\n"}
              <span className="font-handwritten font-semibold text-amber-500/90">{`# ${line.note}\n`}</span>
              <span
                aria-hidden="true"
                className="pointer-events-none text-muted-foreground select-none"
              >
                {"$ "}
              </span>
              {line.command}
            </React.Fragment>
          ))}
        </code>
      </pre>
    </div>
  )
}
