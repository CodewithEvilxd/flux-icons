<div align="center">
  <a href="https://fluxicons.vercel.app">
    <img src="public/logo/logo.svg" width="80" height="80" alt="Flux Icons logo" />
  </a>
  <br />
  <h1>Flux Icons</h1>
  <p><strong>The Comprehensive Modern Icon Ecosystem for React, shadcn/ui & Next.js.</strong></p>
  <p>3 Specialized Vaults · 3,700+ Master Glyphs · 21,000+ Production SVGs · 0 Runtime Bloat · 100% Free & MIT.</p>

  <p>
    <a href="https://fluxicons.vercel.app"><img src="https://img.shields.io/badge/Website-fluxicons.vercel.app-black?style=flat-square&logo=vercel" alt="Website" /></a>
    <a href="https://github.com/codewithevilxd/flux-icons/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/codewithevilxd/flux-icons/ci.yml?branch=main&label=CI&style=flat-square" alt="CI Status" /></a>
    <a href="https://www.npmjs.com/package/@flux-icons/react"><img src="https://img.shields.io/npm/v/@flux-icons/react?style=flat-square&color=black&label=%40flux-icons%2Freact" alt="NPM Version" /></a>
    <a href="https://www.figma.com/community/plugin/1672557050316875938/flux-icons"><img src="https://img.shields.io/badge/Figma-Community%20Plugin-black?style=flat-square&logo=figma" alt="Figma Plugin" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-black.svg?style=flat-square" alt="License: MIT" /></a>
  </p>

  <p>
    <a href="https://fluxicons.vercel.app"><strong>Live Browser</strong></a> ·
    <a href="#the-three-vaults"><strong>The 3 Vaults</strong></a> ·
    <a href="#quick-start"><strong>Quick Start</strong></a> ·
    <a href="#vault-01-keyline-system"><strong>Keyline Grid</strong></a> ·
    <a href="#shadcnui-registry"><strong>shadcn/ui Registry</strong></a> ·
    <a href="#ai-assistant-mcp-server"><strong>MCP Server</strong></a> ·
    <a href="#packages"><strong>Packages</strong></a> ·
    <a href="#development"><strong>Development</strong></a>
  </p>
</div>

---

## Overview

Flux Icons is an open-source, production-grade icon design system engineered from the ground up for modern web apps, design systems, and AI workflows. Rather than a generic grab-bag of symbols, Flux Icons provides a unified visual hierarchy organized into **three specialized vaults totaling over 3,700 unique icons**:

1. **Keyline Vault**: 1,000 geometric glyphs on a 24×24 grid with strict 2px strokes, 4 cohesive rendering styles, and dual corner geometry (Rounded & Sharp).
2. **Extended Vault**: 2,242 rich interface icons spanning 6 visual treatments (Linear, Bold, Two-Tone, Bulk, Broken, Outline) across 39 UI categories.
3. **Motion Vault**: 467 interactive React icons powered by Framer Motion, with fluid hover, tap, loop, and micro-interaction states.

Every icon is available as tree-shakable React components, copy-paste shadcn/ui registry items, raw normalized SVGs, or via the terminal CLI and AI MCP server.

---

## The Three Vaults

| Vault | Master Glyphs | Total SVGs / Files | Formats & Styles | Best For |
| --- | --- | --- | --- | --- |
| **01. Keyline** | `1,000` | 8,000 SVGs | `stroke`, `two-tone`, `duotone`, `fill` (in both `rounded` & `sharp`) | Core product UI, navigation bars, standard action buttons, and design system primitives. |
| **02. Extended** | `2,242` | 13,450+ SVGs | `Linear`, `Bold`, `Two-Tone`, `Bulk`, `Broken`, `Outline` | Dashboards, fintech, commerce, crypto, settings panels, rich forms, and enterprise apps. |
| **03. Motion** | `467` | 467 Components | Framer Motion interactive animated React components | Hero sections, active toggle feedback, notifications, delight micro-interactions. |

---

## Quick Start

### 1. Keyline React Icons (`@flux-icons/react`)

Install `@flux-icons/react` using your favorite package manager:

```bash
pnpm add @flux-icons/react
# or npm i @flux-icons/react
# or yarn add @flux-icons/react
# or bun add @flux-icons/react
```

Import icons directly into your React or Next.js app:

```tsx
import { ArrowUpRight, Check, Menu } from "@flux-icons/react"
import { Folder as FolderDuotone } from "@flux-icons/react/duotone"
import { Folder as FolderFill } from "@flux-icons/react/fill"
import { Folder as FolderSharp } from "@flux-icons/react/sharp"
import { Folder as FolderSharpFill } from "@flux-icons/react/sharp/fill"

export function Navbar() {
  return (
    <nav className="flex items-center gap-4">
      <Check className="size-5 text-emerald-500" />
      <ArrowUpRight size={20} strokeWidth={2} />
      <FolderDuotone className="size-6 text-sky-500" />
      <FolderSharpFill className="size-6 text-neutral-800 dark:text-neutral-200" />
    </nav>
  )
}
```

### 2. Extended React Icons

The Extended vault components provide comprehensive UI and dashboard icons with 6 weights:

```tsx
import { 
  CardSend, 
  DirectboxNotif, 
  Element3, 
  WalletMoney 
} from "@/components/extended-icons/icons"

export function DashboardWidget() {
  return (
    <div className="flex gap-4">
      <CardSend className="size-6 text-blue-500" />
      <DirectboxNotif className="size-6 text-violet-500" />
      <WalletMoney className="size-6 text-emerald-500" />
      <Element3 className="size-6 text-neutral-700" />
    </div>
  )
}
```

### 3. Motion Icons (Interactive Micro-Animations)

Motion icons bring tactile delight to buttons, notifications, and indicators using Framer Motion:

```tsx
import { BellMotion, HeartMotion, CheckMotion } from "@/components/motion-icons/icons"

export function InteractiveToolbar() {
  return (
    <div className="flex items-center gap-4">
      <BellMotion trigger="hover" className="size-6 cursor-pointer" />
      <HeartMotion trigger="click" className="size-6 text-rose-500" />
      <CheckMotion isCompleted={true} className="size-6 text-emerald-500" />
    </div>
  )
}
```

---

## Vault 01: Keyline System

**1,000 icons, drawn on one 24×24 grid, in four styles and two corner treatments.** Built for shadcn/ui, free under MIT.

Flux Icons provides a complete visual language designed on a strict 24×24 coordinate grid with 2px stroke geometry. Every glyph is measured, balanced, and available across four distinct visual styles and two mechanical corner treatments.

| Style | Icons | Description |
| --- | --- | --- |
| `stroke` | 1,000 | The full set. 2px keylines on a 24 grid. |
| `two-tone` | 1,000 | The stroke drawing over a flat plate at reduced opacity. |
| `duotone` | 1,000 | No outline: a grey body with the detail in full strength. |
| `fill` | 1,000 | Solid, with the detail knocked back out of the shape. |

`stroke` is the drawing every other style starts from, and since 1.0.0 every name comes in all four. `two-tone` is what `duotone` meant until 0.9.0: the outline kept, a 40% plate under it. `duotone` now drops the outline and decides per icon which part is grey and which is black, so the thing that matters reads first: the check on a badge, the liquid in a flask, the data rather than the chart's axes. A glyph with nothing to fill, like `bar-chart`, carries its stroke drawing in the filled styles, so no import ever comes up empty.

### Rounded and Sharp Corners

Every drawing in the table comes twice: rounded, with round caps and filleted corners, and sharp, with butt caps and square corners. Same names, same coverage, so 8,000 SVGs in total.

```
icons/stroke/bell.svg               # Rounded stroke
icons/fill/bell.svg                 # Rounded fill
icons/sharp/stroke/bell.svg         # Sharp stroke
icons/sharp/fill/bell.svg           # Sharp fill
```

Sharp is a drawing of its own rather than a filter over the rounded one. Squaring a corner moves the ink, and where that changes the silhouette the geometry was solved again, so both treatments sit side by side in `raw/` and the build converts neither into the other.

### Containers

56 icons come in a `square-` form and 61 in a `circle-` form, which wrap the base drawing rather than replacing it:

```
icons/stroke/arrow-down.svg
icons/fill/square-arrow-down.svg
icons/sharp/duotone/circle-arrow-down.svg
```

A `square-` or `circle-` prefix does not always mean a container. `circle-half` and `square-dashed` are shapes in their own right, with no base for them to contain, so they are filed as regular icons. The rule is that the base has to exist before the prefix means anything.

---

## Installation and Tooling

### A. Own the Source with shadcn/ui

Flux Icons natively serves a [shadcn/ui](https://ui.shadcn.com) compatible registry directly from the documentation site. Add the registry to your `components.json`:

```json
{
  "registries": {
    "@flux": "https://fluxicons.vercel.app/r/{name}.json"
  }
}
```

Add individual icons into your project using the shadcn CLI:

```bash
npx shadcn add @flux/bell
npx shadcn add @flux/fill/bell
npx shadcn add @flux/sharp/fill/bell
```

Each icon arrives as an isolated, standalone React component without adding runtime dependencies.

### B. AI Assistant MCP Server (`@flux-icons/mcp`)

Give your AI coding companion (Claude Code, Cursor, Windsurf, Antigravity) native access to search, inspect, and import any icon accurately:

```bash
# In Claude Code / Claude Desktop:
claude mcp add flux-icons -- npx -y @flux-icons/mcp
```

Or add to your `.cursor/mcp.json` or IDE config:

```json
{
  "mcpServers": {
    "flux-icons": {
      "command": "npx",
      "args": ["-y", "@flux-icons/mcp"]
    }
  }
}
```

### C. Terminal CLI (`@flux-icons/cli`)

Search and download icons straight to your filesystem without adding packages:

```bash
# Search icons by keyword
npx @flux-icons/cli search arrow

# Download SVGs into an output folder
npx @flux-icons/cli add circle-arrow-down bell --out src/icons

# Specify styles and corner treatments
npx @flux-icons/cli add bell --style fill --corners sharp
```

### D. Direct SVG Files

Optimized, production-ready SVGs with no classes, wrappers, or IDs are available directly from the repository under `icons/`:

```
icons/
├── stroke/               # Rounded stroke SVGs
├── two-tone/             # Rounded two-tone SVGs
├── duotone/              # Rounded duotone SVGs
├── fill/                 # Rounded fill SVGs
└── sharp/
    ├── stroke/           # Sharp stroke SVGs
    ├── two-tone/         # Sharp two-tone SVGs
    ├── duotone/          # Sharp duotone SVGs
    └── fill/             # Sharp fill SVGs
```

### E. Vue, Svelte, Solid, and Vanilla (Iconify)

The entire set is indexed on [Iconify](https://icon-sets.iconify.design/flux-icons/) as `flux-icons`:

```html
<!-- Iconify Web Component / Framework Integrations -->
<iconify-icon icon="flux-icons:bell"></iconify-icon>
<iconify-icon icon="flux-icons:bell-fill"></iconify-icon>
<iconify-icon icon="flux-icons:bell-sharp-duotone"></iconify-icon>
```

### F. Figma Community

- **[Figma Community Plugin](https://www.figma.com/community/plugin/1672557050316875938/flux-icons)**: Instant icon browser inside Figma with style and corner switching.
- **[Figma Community File](https://www.figma.com/community/file/1672255957017818239/flux-icons)**: The complete vector design system with interactive component properties.

---

## Packages

The repository is maintained as a high-performance monorepo containing three npm packages and one Figma plugin:

| Package | Purpose | Distribution |
| --- | --- | --- |
| [`@flux-icons/react`](packages/react) | Tree-shakable React components with subpath exports | [npm](https://www.npmjs.com/package/@flux-icons/react) |
| [`@flux-icons/cli`](packages/cli) | Terminal search and download utility | [npm](https://www.npmjs.com/package/@flux-icons/cli) |
| [`@flux-icons/mcp`](packages/mcp) | MCP server for Claude, Cursor, and AI agents | [npm](https://www.npmjs.com/package/@flux-icons/mcp) |
| [`packages/figma-plugin`](packages/figma-plugin) | Native Figma editor plugin | [Figma Community](https://www.figma.com/community/plugin/1672557050316875938/flux-icons) |

---

## Categories

The icon set spans 39 comprehensive categories designed to meet real production application needs:

Actions, AI, Animals, Art, Charts, Chevrons & Carets, Circle Containers, Commerce, Controls, Devices, Diagrams, Education, Emoji, Files, Finance, Food & Drink, Gender, Git, Health, Home, Layout, Mail, Maps, Media, Nature, Pointers, Science, Shapes, Sport, Square Containers, Stationery, Text, Time, Tools, Transport, Users, Weather, Web, plus specialized utility glyphs.

Release updates and redraws are detailed in the [Changelog](https://fluxicons.vercel.app/changelog).

---

## Repository Architecture

```
flux-icons/
├── src/
│   ├── app/               # Next.js App Router (web application at fluxicons.vercel.app)
│   ├── components/        # UI components, layout, and icon catalog browsers
│   │   ├── icons/         # Keyline React icons (generated)
│   │   ├── extended-icons/# Extended collection components (2,242 icons)
│   │   └── motion-icons/  # Framer Motion animated icons (467 icons)
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Metadata, SEO, search algorithms, and icon loaders
├── packages/
│   ├── react/             # @flux-icons/react component library
│   ├── cli/               # @flux-icons/cli terminal utility
│   ├── mcp/               # @flux-icons/mcp AI assistant integration
│   └── figma-plugin/      # Flux Icons Figma plugin
├── raw/                   # Figma SVG exports (Single Source of Truth)
├── icons/                 # Generated normalized SVGs (rounded & sharp)
├── pipeline/              # Build pipelines, geometry linters, and verification suites
├── previews/              # Social cards, posters, and Figma cover assets
└── public/                # Static brand assets and mockups
```

> [!IMPORTANT]
> **Source of Truth Rule:** `icons/`, `src/components/icons/`, `packages/*/src/`, and `packages/*/icons.json` are generated artifacts. Never edit them by hand. The single source of truth is `raw/`. Any change to a drawing must be made in `raw/` and compiled through the build pipeline.

---

## Development

Prerequisites: **Node.js >= 20.9** and **pnpm**.

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Run the Next.js documentation & browser site
pnpm dev

# 3. Compile raw Figma exports into normalized SVGs
pnpm icons:build

# 4. Generate React components across packages and web catalog
pnpm icons:react

# 5. Run geometry, ink-box, and padding linters
pnpm icons:lint

# 6. Execute full CI verification suite (all 15 checks + tsc)
pnpm icons:ci
```

### Committing Drawings

For updates involving icon geometry or files under `raw/`, use the automated shipping pipeline:

```bash
pnpm ship -m "Add clipboard-check icon"
```

`pnpm ship` regenerates SVGs, rebuilds component exports, verifies geometry against strict linter rules, commits the diff, synchronizes git history timestamps in `src/lib/icon-history.json`, and folds the changes back into the release commit.

For detailed information on geometric tolerances, stroke envelopes, and corner radiuses, refer to [pipeline/README.md](pipeline/README.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Sponsors

<!-- SPONSORS:start -->

[Shadcn UI Community](https://ui.shadcn.com), since August 2026.

<!-- SPONSORS:end -->

---

## License

Flux Icons is open-source software licensed under the [MIT License](LICENSE). Built and maintained with precision by Nishant Gaurav ([@codewithevilxd](https://github.com/codewithevilxd)).
