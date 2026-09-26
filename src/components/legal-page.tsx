import Link from "next/link"

import { SITE_LEGAL_LINKS } from "@/lib/site-chrome"
import { SiteFooter } from "@/components/site-footer"
import { SiteNav } from "@/components/site-nav"
import { ArrowUpRight } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * Format ISO date string into readable British English date ("23 Aug 2026").
 */
function legalDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso))
}

/**
 * One section heading and its prose content.
 */
export function LegalSection({
  id,
  title,
  badge,
  children,
}: {
  id: string
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="group scroll-mt-28 border-t border-dashed border-border/80 pt-8 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide uppercase text-foreground">
          <a href={`#${id}`} className="hover:underline underline-offset-4 flex items-center gap-2">
            {title}
            <span className="opacity-0 group-hover:opacity-60 transition-opacity text-sm font-mono text-muted-foreground font-normal">#</span>
          </a>
        </h2>
        {badge && (
          <span className="ann-tag-amber text-xs font-mono font-semibold">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-4 font-handwritten text-base leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

/**
 * A stylized bulleted list inside a LegalSection.
 */
export function LegalList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex list-disc flex-col gap-2.5 pl-5 marker:text-amber-500/80">
      {children}
    </ul>
  )
}

/**
 * High-emphasis permission or policy card for quick visual comprehension.
 */
export function LegalHighlightCard({
  icon,
  title,
  description,
  variant = "neutral",
}: {
  icon?: React.ReactNode
  title: string
  description: string
  variant?: "neutral" | "emerald" | "amber" | "blue"
}) {
  const styles = {
    neutral: "border-border/80 bg-muted/30 text-foreground",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-100",
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-950 dark:text-blue-100",
  }

  return (
    <div className={cn("rounded-2xl border p-4.5 transition-all", styles[variant])}>
      <div className="flex items-center gap-2.5 font-display text-sm font-bold uppercase tracking-wide">
        {icon}
        <span>{title}</span>
      </div>
      <p className="mt-2 font-handwritten text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}

/**
 * An internal or external link in legal prose.
 */
export function LegalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  if (href.startsWith("/")) {
    return (
      <Link
        href={href}
        className="font-medium underline underline-offset-2 text-foreground hover:text-primary transition-colors"
      >
        {children}
      </Link>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 font-medium underline underline-offset-2 text-foreground hover:text-primary transition-colors"
    >
      {children}
      <ArrowUpRight className="size-3" />
      <span className="sr-only">{" (opens in a new tab)"}</span>
    </a>
  )
}

export function LegalPage({
  path,
  title,
  badge = "[ LEGAL & GOVERNANCE ]",
  description,
  updated,
  summaryGrid,
  children,
}: {
  path: string
  title: string
  badge?: string
  description?: string
  /** ISO date these terms last changed. */
  updated: string
  summaryGrid?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <SiteNav />

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 pb-20 pt-6 lg:px-8">
        {/* Navigation Breadcrumb & Document Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-border/80 pb-6 mb-8">
          <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-foreground flex items-center gap-2">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground">Legal</span>
            <span>/</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{title}</span>
          </nav>

          {/* Sibling Tab Switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 font-mono text-xs">
            {SITE_LEGAL_LINKS.map((link) => {
              const active = link.href === path
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-1 font-semibold transition-all",
                    active
                      ? "bg-card text-foreground shadow-xs border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Header Hero */}
        <header className="pb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="ann-tag-amber text-xs font-bold font-mono">{badge}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active &amp; Enforceable
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-wider text-foreground">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-2xl font-handwritten text-base sm:text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-xs text-muted-foreground">
            <span>
              Last amended:{" "}
              <time dateTime={updated} className="font-bold text-foreground">
                {legalDate(updated)}
              </time>
            </span>
            <span>•</span>
            <span>Governing Scope: Global / Open Web</span>
          </div>
        </header>

        {/* Quick Highlights / Summary Grid */}
        {summaryGrid && (
          <div className="mb-10 grid gap-3 sm:grid-cols-2">
            {summaryGrid}
          </div>
        )}

        {/* Main Document Body */}
        <div className="flex flex-col gap-10 rounded-3xl border border-dashed border-border/80 bg-card p-6 sm:p-10 shadow-xs">
          {children}
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-border/80 pt-8 font-mono text-xs">
          <p className="text-muted-foreground">
            Questions regarding our licensing or terms? Open an issue on{" "}
            <LegalLink href="https://github.com/codewithevilxd/flux-icons/issues">GitHub</LegalLink>.
          </p>
          <div className="flex items-center gap-4">
            {SITE_LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "hover:underline",
                  link.href === path ? "font-bold text-foreground" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
