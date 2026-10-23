"use client"

import Link from "next/link"
import { Menu } from "lucide-react"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

import { BrandMark } from "@/app/brand-mark"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LightDarkMode } from "@/components/ui/light-dark-mode"
import { cn } from "@/lib/utils"

import { useGitHubStars } from "./hooks/use-github-stars"

const SITE_LINKS = [
  { href: "/brands", label: "Brands" },
  { href: "/packages", label: "Packages" },
]

interface HeaderPanelProps {
  className?: string
}
export function HeaderPanel({ className }: HeaderPanelProps) {
  const displayCount = useGitHubStars()
  return (
    <header
      className={cn(
        "relative flex h-12 shrink-0 items-center overflow-hidden border-b border-border bg-background transition-colors duration-200 ease-out",
        className
      )}
    >
      <div className="bg-pattern-vertical-dashes pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex h-full w-full min-w-0">
        <Link
          href="/"
          prefetch={false}
          aria-label="Flux Icons home"
          className="group flex h-full w-12 shrink-0 cursor-pointer items-center justify-center border-r border-border transition-colors duration-150 ease-out hover:bg-muted/50"
        >
          <span className="flex h-8 w-8 items-center justify-center text-foreground transition-transform duration-150 ease-out group-hover:scale-[1.02]">
            <BrandMark size={19} fill="currentColor" />
          </span>
        </Link>
        <div className="hidden h-full w-[320px] shrink-0 items-center border-r border-border px-5 lg:flex" />
        <div className="hidden h-full min-w-0 flex-1 items-center justify-center border-r border-border px-4 sm:flex lg:justify-end lg:px-6">
          <div className="relative flex h-8 items-center gap-1 rounded-md border border-border bg-[#f5f5f5] p-1 dark:bg-[#1a1a1a]">
            <Link
              href="/icons"
              prefetch={false}
              className={cn(
                "relative flex h-full items-center justify-center rounded-lg px-4 text-[11px] font-medium transition-colors duration-200",
                "text-foreground"
              )}
            >
              <span className="absolute inset-0 rounded-lg border border-border/50 bg-white dark:bg-[#2a2a2a]" />
              <span className="relative z-10">Icons</span>
            </Link>
          </div>
          <nav
            aria-label="Site"
            className="ml-3 hidden items-center gap-0.5 sm:flex"
          >
            {SITE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="flex h-8 items-center rounded-md px-3 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="ml-auto flex h-full shrink-0 items-center justify-end gap-2 px-3 lg:w-85 lg:gap-2.5 lg:px-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-white text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:hidden dark:bg-[#1a1a1a]"
              >
                <Menu className="size-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/icons" prefetch={false}>
                  Icons
                </Link>
              </DropdownMenuItem>
              {SITE_LINKS.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} prefetch={false}>
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="https://github.com/CodewithEvilxd/flux-icons"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block"
          >
            <Button
              variant="outline"
              className="h-8 gap-2 border-border bg-white px-3 text-[11px] font-medium opacity-100 dark:bg-[#1a1a1a]"
              aria-label={`GitHub, ${displayCount} stars`}
            >
              <GithubIcon className="size-3.5" />{" "}
              <span className="inline-block min-w-[3ch] text-left tabular-nums">
                {displayCount}
              </span>
            </Button>
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white dark:bg-[#1a1a1a]">
            <LightDarkMode className="size-4 border-none bg-transparent text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground" />
          </div>
        </div>
      </div>
    </header>
  )
}
