"use client"

import React, { useId, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Bell,
  Check,
  Folder as FolderIcon,
  Heart,
  Lock,
  ShieldCheck,
  Sparkles,
  Sun,
  Zap,
} from "@/components/icons"

const themes = {
  blue: {
    name: "macOS Blue",
    backFill: "#3b82f6",
    backInsetShadow: "inset 0 1px 2px 0 rgba(255,255,255,0.7), inset 0 0 16px 2px rgba(255,255,255,0.35)",
    flapFill: "#1d4ed8",
    flapFillOpacity: 0.76,
    flapStroke: "#93c5fd",
    flapInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.22 0",
    cardFill: "#ffffff",
    cardStroke: "#dbeafe",
    accent: "#2563eb",
    tabColor: "#1e40af",
  },
  amber: {
    name: "Flux Amber",
    backFill: "#f59e0b",
    backInsetShadow: "inset 0 1px 2px 0 rgba(255,255,255,0.7), inset 0 0 16px 2px rgba(255,255,255,0.4)",
    flapFill: "#d97706",
    flapFillOpacity: 0.78,
    flapStroke: "#fde68a",
    flapInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0",
    cardFill: "#ffffff",
    cardStroke: "#fef3c7",
    accent: "#d97706",
    tabColor: "#b45309",
  },
  black: {
    name: "Obsidian Dark",
    backFill: "#1e1e24",
    backInsetShadow: "inset 0 1px 2px 0 rgba(255,255,255,0.35), inset 0 0 12px 2px rgba(255,255,255,0.18)",
    flapFill: "#2a2a32",
    flapFillOpacity: 0.82,
    flapStroke: "#52525b",
    flapInsetColor: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0",
    cardFill: "#ffffff",
    cardStroke: "#e4e4e7",
    accent: "#6366f1",
    tabColor: "#3f3f46",
  },
  white: {
    name: "Snow Light",
    backFill: "#e2e8f0",
    backInsetShadow: "inset 0 1px 2px 0 rgba(255,255,255,0.9), inset 0 0 10px 2px rgba(255,255,255,0.7)",
    flapFill: "#f1f5f9",
    flapFillOpacity: 0.88,
    flapStroke: "#cbd5e1",
    flapInsetColor: "0 0 0 0 0.6 0 0 0 0 0.6 0 0 0 0 0.6 0 0 0 0.15 0",
    cardFill: "#ffffff",
    cardStroke: "#e2e8f0",
    accent: "#0ea5e9",
    tabColor: "#94a3b8",
  },
  motion: {
    name: "Flux Motion",
    backFill: "#7c3aed",
    backInsetShadow: "inset 0 1px 2px 0 rgba(255,255,255,0.75), inset 0 0 16px 2px rgba(255,255,255,0.4)",
    flapFill: "#6d28d9",
    flapFillOpacity: 0.82,
    flapStroke: "#c4b5fd",
    flapInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0",
    cardFill: "#ffffff",
    cardStroke: "#ede9fe",
    accent: "#8b5cf6",
    tabColor: "#5b21b6",
  },
} as const

const sizeScales = {
  sm: 0.65,
  md: 0.82,
  lg: 1.0,
} as const

export type FolderThemeKey = keyof typeof themes

export interface FolderComponentProps extends Omit<React.ComponentProps<"div">, "color"> {
  color?: FolderThemeKey
  size?: "sm" | "md" | "lg"
  href?: string
  variant?: "keyline" | "extended" | "motion" | "3d" | "organic" | "micro"
}

const BASE_WIDTH = 321
const BASE_HEIGHT = 270

const FLAP_PATH =
  "M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z"

export function FolderComponent({
  color = "amber",
  size = "md",
  href,
  variant = "keyline",
  className,
  ...props
}: FolderComponentProps) {
  const router = useRouter()
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "")
  const filterId = `apple_folder_filter_${uid}`

  const theme = themes[color] ?? themes.amber
  const scale = sizeScales[size]
  const [isHovered, setIsHovered] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Explicit inline values for open click
  const card1Transform = isOpen
    ? "translate(76px, -195px) rotate(18deg)"
    : isHovered
      ? "translate(56px, -110px) rotate(14deg)"
      : "translate(32px, -12px) rotate(8deg)"

  const card2Transform = isOpen
    ? "translate(0px, -215px) rotate(-1deg)"
    : isHovered
      ? "translate(0px, -134px) rotate(0deg)"
      : "translate(0px, -24px) rotate(0deg)"

  const card3Transform = isOpen
    ? "translate(-76px, -200px) rotate(-18deg)"
    : isHovered
      ? "translate(-56px, -114px) rotate(-14deg)"
      : "translate(-32px, -14px) rotate(-6deg)"

  const flapRotateX = isOpen ? -64 : isHovered ? -50 : -14

  const folderCore = (
    <div
      className="relative cursor-pointer select-none"
      style={{
        width: BASE_WIDTH * scale,
        height: BASE_HEIGHT * scale,
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsOpen(false)
      }}
      onClick={(e) => {
        if (href) {
          e.preventDefault()
          router.push(href)
        } else {
          setIsOpen((o) => !o)
        }
      }}
    >
      {/* Dynamic CSS rules to guarantee immediate GPU hover response on card/folder hover */}
      <style>{`
        .group:hover .apple-folder-card-1-${uid},
        [data-slot="folder"]:hover .apple-folder-card-1-${uid} {
          transform: translate(56px, -110px) rotate(14deg) !important;
        }
        .group:hover .apple-folder-card-2-${uid},
        [data-slot="folder"]:hover .apple-folder-card-2-${uid} {
          transform: translate(0px, -134px) rotate(0deg) !important;
        }
        .group:hover .apple-folder-card-3-${uid},
        [data-slot="folder"]:hover .apple-folder-card-3-${uid} {
          transform: translate(-56px, -114px) rotate(-14deg) !important;
        }
        .group:hover .apple-folder-flap-${uid},
        [data-slot="folder"]:hover .apple-folder-flap-${uid} {
          transform: rotateX(-50deg) !important;
        }
      `}</style>

      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
          perspective: 1000,
        }}
      >
        {/* 1. Apple macOS Folder Back Shell */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="relative overflow-hidden"
            style={{
              width: BASE_WIDTH,
              height: BASE_HEIGHT,
              borderRadius: 25,
              backgroundColor: theme.backFill,
              boxShadow: `${theme.backInsetShadow}, 0 20px 38px -10px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Top Tab specular shine */}
            <div
              className="absolute top-0 left-0 h-10 w-44 rounded-tl-[25px] rounded-tr-[12px] opacity-30 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)",
              }}
            />
            {/* Dark inner shadow pocket where real pages rest */}
            <div
              className="absolute inset-x-4 top-10 bottom-4 rounded-xl opacity-25 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 40%)",
              }}
            />
          </div>
        </div>

        {/* 2. Real Document Pages (Coming gracefully from inside) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          {/* Page 1 (Right Wing: Manifest / Package Document) */}
          <div
            className={`apple-folder-card-1-${uid} absolute will-change-transform`}
            style={{
              transform: card1Transform,
              transition: "transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s",
              zIndex: 1,
            }}
          >
            <RealDocumentPage
              type="right"
              variant={variant}
              theme={theme}
            />
          </div>

          {/* Page 3 (Left Wing: System Grid & Specs Document) */}
          <div
            className={`apple-folder-card-3-${uid} absolute will-change-transform`}
            style={{
              transform: card3Transform,
              transition: "transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1) 0s",
              zIndex: 2,
            }}
          >
            <RealDocumentPage
              type="left"
              variant={variant}
              theme={theme}
            />
          </div>

          {/* Page 2 (Center Hero: Genuine Vector Specimen Sheet) */}
          <div
            className={`apple-folder-card-2-${uid} absolute will-change-transform`}
            style={{
              transform: card2Transform,
              transition: "transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1) 0.02s",
              zIndex: 3,
            }}
          >
            <RealDocumentPage
              type="hero"
              variant={variant}
              theme={theme}
            />
          </div>
        </div>

        {/* 3. Apple macOS Translucent Frosted Front Flap with 3D Tilt */}
        <div
          className={`apple-folder-flap-${uid} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-4 will-change-transform`}
          style={{
            transformOrigin: "bottom center",
            transformStyle: "preserve-3d",
            width: 321,
            height: 241,
            transform: `rotateX(${flapRotateX}deg)`,
            transition: "transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            zIndex: 4,
          }}
        >
          {/* Frosted glass backdrop blur */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              clipPath: `path('${FLAP_PATH}')`,
              WebkitClipPath: `path('${FLAP_PATH}')`,
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          />

          <svg
            className="absolute inset-0"
            width="321"
            height="241"
            viewBox="0 0 321 241"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g filter={`url(#${filterId})`}>
              <path
                d={FLAP_PATH}
                fill={theme.flapFill}
                fillOpacity={theme.flapFillOpacity}
              />
              <path
                d="M25 0.5H136.084C142.905 0.5 149.417 3.3431 154.054 8.3457L177.713 33.874C182.539 39.0808 189.317 42.04 196.416 42.04H296C309.531 42.04 320.5 53.0092 320.5 66.54V216C320.5 229.531 309.531 240.5 296 240.5H25C11.469 240.5 0.5 229.531 0.5 216V25C0.5 11.469 11.469 0.5 25 0.5Z"
                stroke={theme.flapStroke}
                strokeWidth="1.2"
              />
            </g>
            <defs>
              <filter
                id={filterId}
                x="-25.4"
                y="-25.4"
                width="371.8"
                height="291.8"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="BackgroundImageFix"
                  result="shape"
                />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="1.5" />
                <feGaussianBlur stdDeviation="2.65" />
                <feComposite
                  in2="hardAlpha"
                  operator="arithmetic"
                  k2="-1"
                  k3="1"
                />
                <feColorMatrix type="matrix" values={theme.flapInsetColor} />
                <feBlend
                  mode="normal"
                  in2="shape"
                  result={`effect1_innerShadow_${uid}`}
                />
              </filter>
            </defs>
          </svg>

          {/* Apple-style Folder Label / Collection Monogram on front flap */}
          <div className="absolute bottom-4 left-6 flex items-center gap-2 pointer-events-none opacity-95">
            <div className="flex size-5 items-center justify-center rounded-md bg-white/25 backdrop-blur-xs text-white shadow-xs">
              <FolderIcon className="size-3" />
            </div>
            <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-white drop-shadow-sm">
              {variant === "extended"
                ? "EXTENDED · 2,242"
                : variant === "motion"
                  ? "MOTION · 467"
                  : variant === "keyline"
                    ? "KEYLINE · 1,000"
                    : `FLUX · ${variant.toUpperCase()}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div
      data-slot="folder"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsOpen(false)
      }}
      className={cn(
        "group/folder relative flex items-center justify-center select-none pt-18 sm:pt-22 pb-4",
        className
      )}
      {...props}
    >
      {href ? (
        <Link
          href={href}
          onClick={(e) => {
            if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
              e.preventDefault()
              router.push(href)
            }
          }}
          className="block cursor-pointer focus:outline-none rounded-2xl"
          title="Click to open collection"
        >
          {folderCore}
        </Link>
      ) : (
        folderCore
      )}
    </div>
  )
}

export default FolderComponent
export { FolderComponent as Folder }

type Theme = (typeof themes)[keyof typeof themes]

/**
 * RealDocumentPage: Renders an authentic paper document sheet
 * with realistic document header, dog-eared folded paper corner,
 * genuine icon specimens, real code lines, and crisp paper borders.
 */
function RealDocumentPage({
  type,
  variant,
  theme,
}: {
  type: "hero" | "left" | "right"
  variant: string
  theme: Theme
}) {
  const isExtended = variant === "extended"
  const isMotion = variant === "motion"

  // 1. Center Hero Page: Genuine Vector Specimen Sheet
  if (type === "hero") {
    return (
      <div
        data-slot="real-page-hero"
        className="relative flex flex-col justify-between overflow-hidden rounded-[14px] bg-white p-3 pointer-events-auto select-none"
        style={{
          width: 164,
          height: 214,
          border: "1px solid rgba(0, 0, 0, 0.12)",
          boxShadow: "0 14px 28px -6px rgba(0,0,0,0.22), 0 4px 8px -2px rgba(0,0,0,0.08)",
          color: "#0f172a",
        }}
      >
        {/* Apple macOS style dog-ear folded paper corner */}
        <div className="absolute top-0 right-0 size-5.5 overflow-hidden pointer-events-none z-20">
          <div
            className="absolute top-0 right-0 w-0 h-0 border-solid"
            style={{
              borderWidth: "0 18px 18px 0",
              borderColor: "transparent #e2e8f0 transparent transparent",
            }}
          />
          <div className="absolute top-0 right-0 w-4.5 h-4.5 bg-slate-100 border-l border-b border-black/15 rounded-bl-[3px] shadow-xs" />
        </div>

        {/* Real Document Header */}
        <div>
          <div className="flex items-center justify-between pr-4">
            <div className="flex items-center gap-1.5">
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[8px] font-bold text-white shadow-2xs"
                style={{ backgroundColor: theme.accent }}
              >
                {isMotion ? "ANIM" : "SVG"}
              </span>
              <span className="font-mono text-[9px] font-bold text-slate-800 truncate max-w-22">
                {isMotion ? "motion.svg" : isExtended ? "extended.svg" : "specimen.svg"}
              </span>
            </div>
            <span className="font-mono text-[8px] font-semibold text-slate-400">
              {isMotion ? "467" : isExtended ? "2.2K" : "1.0K"}
            </span>
          </div>
          {/* Subtle Document Ruler Line */}
          <div className="w-full h-px bg-slate-200 mt-1.5 mb-1" />
        </div>

        {/* Grid of Real Vector Icons Specimen */}
        <div className="grid grid-cols-2 gap-1.5 my-auto">
          <div className="flex flex-col items-center justify-center rounded-lg p-1.5 bg-purple-50 border border-purple-200/80 text-purple-600 transition-transform hover:scale-105">
            <Sparkles size={20} className={isMotion ? "animate-pulse" : ""} />
            <span className="mt-0.5 font-mono text-[8px] font-bold text-slate-700">sparkles</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg p-1.5 bg-rose-50 border border-rose-200/80 text-rose-600 transition-transform hover:scale-105">
            <Heart size={20} />
            <span className="mt-0.5 font-mono text-[8px] font-bold text-slate-700">heart</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg p-1.5 bg-blue-50 border border-blue-200/80 text-blue-600 transition-transform hover:scale-105">
            <Bell size={20} />
            <span className="mt-0.5 font-mono text-[8px] font-bold text-slate-700">bell</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg p-1.5 bg-amber-50 border border-amber-200/80 text-amber-600 transition-transform hover:scale-105">
            <Zap size={20} />
            <span className="mt-0.5 font-mono text-[8px] font-bold text-slate-700">zap</span>
          </div>
        </div>

        {/* Realistic Code / Document Snippet */}
        <div className="rounded-md bg-slate-50 border border-slate-200/90 px-2 py-1 font-mono text-[8px] text-slate-600 flex items-center justify-between">
          <span className="truncate">{isMotion ? "import { MotionBell }" : "import { Icon }"}</span>
          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
            <Check className="size-2.5" /> MIT
          </span>
        </div>

        {/* Document Footer Barcode / Pagination */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-1 font-mono text-[8px] text-slate-400">
          <span>PAGE 01/01</span>
          <span>{isMotion ? "INTERACTIVE" : "24×24 GRID"}</span>
        </div>
      </div>
    )
  }

  // 2. Left Page: Grid System & Style Architecture Document
  if (type === "left") {
    return (
      <div
        data-slot="real-page-left"
        className="relative flex flex-col justify-between overflow-hidden rounded-[14px] bg-[#fafafa] p-3 pointer-events-auto select-none"
        style={{
          width: 164,
          height: 214,
          border: "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: "0 10px 20px -5px rgba(0,0,0,0.18), 0 3px 6px -2px rgba(0,0,0,0.06)",
          color: "#0f172a",
        }}
      >
        {/* Folded paper corner */}
        <div className="absolute top-0 right-0 size-5.5 overflow-hidden pointer-events-none z-20">
          <div
            className="absolute top-0 right-0 w-0 h-0 border-solid"
            style={{
              borderWidth: "0 18px 18px 0",
              borderColor: "transparent #e2e8f0 transparent transparent",
            }}
          />
          <div className="absolute top-0 right-0 w-4.5 h-4.5 bg-slate-100 border-l border-b border-black/15 rounded-bl-[3px] shadow-xs" />
        </div>

        {/* Header */}
        <div>
          <div className="flex items-center justify-between pr-4">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white">
                {isMotion ? "SPRING" : "SPEC"}
              </span>
              <span className="font-mono text-[9px] font-bold text-slate-800">
                {isMotion ? "physics.ts" : "matrix.pdf"}
              </span>
            </div>
            <span className="font-mono text-[8px] text-slate-400">
              {isMotion ? "7 MODES" : isExtended ? "6 STYLES" : "4 STYLES"}
            </span>
          </div>
          <div className="w-full h-px bg-slate-200 mt-1.5 mb-1" />
        </div>

        {/* Real Document Content: Style Specimen list */}
        <div className="space-y-1.5 my-auto px-0.5">
          <div className="flex items-center justify-between rounded-md bg-white border border-slate-200/80 px-2 py-1 text-slate-700">
            <div className="flex items-center gap-1.5">
              <Sun className="size-3.5 text-amber-500" />
              <span className="font-mono text-[8px] font-bold">{isMotion ? "Spin / Rotate" : "Linear / Stroke"}</span>
            </div>
            <span className="font-mono text-[7px] text-slate-400">{isMotion ? "360°" : "1.5px"}</span>
          </div>

          <div className="flex items-center justify-between rounded-md bg-white border border-slate-200/80 px-2 py-1 text-slate-700">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span className="font-mono text-[8px] font-bold">{isMotion ? "Ring / Shake" : "Two-Tone / Duotone"}</span>
            </div>
            <span className="font-mono text-[7px] text-slate-400">{isMotion ? "Elastic" : "30%"}</span>
          </div>

          <div className="flex items-center justify-between rounded-md bg-white border border-slate-200/80 px-2 py-1 text-slate-700">
            <div className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-indigo-500" />
              <span className="font-mono text-[8px] font-bold">{isMotion ? "Bounce / Move" : "Bold / Fill"}</span>
            </div>
            <span className="font-mono text-[7px] text-slate-400">{isMotion ? "60fps" : "Solid"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-1 font-mono text-[8px] text-slate-400">
          <span>{isMotion ? "FRAMER ENGINE" : "OPTICAL ALIGN"}</span>
          <span>{isMotion ? "FLUX MOTION" : "FLUX LABS"}</span>
        </div>
      </div>
    )
  }

  // 3. Right Page: Package Manifest & Code Integration Sheet
  return (
    <div
      data-slot="real-page-right"
      className="relative flex flex-col justify-between overflow-hidden rounded-[14px] bg-[#fafafa] p-3 pointer-events-auto select-none"
      style={{
        width: 164,
        height: 214,
        border: "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: "0 10px 20px -5px rgba(0,0,0,0.18), 0 3px 6px -2px rgba(0,0,0,0.06)",
        color: "#0f172a",
      }}
    >
      {/* Folded paper corner */}
      <div className="absolute top-0 right-0 size-5.5 overflow-hidden pointer-events-none z-20">
        <div
          className="absolute top-0 right-0 w-0 h-0 border-solid"
          style={{
            borderWidth: "0 18px 18px 0",
            borderColor: "transparent #e2e8f0 transparent transparent",
          }}
        />
        <div className="absolute top-0 right-0 w-4.5 h-4.5 bg-slate-100 border-l border-b border-black/15 rounded-bl-[3px] shadow-xs" />
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center justify-between pr-4">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white">
              NPM
            </span>
            <span className="font-mono text-[9px] font-bold text-slate-800">
              manifest.json
            </span>
          </div>
          <span className="font-mono text-[8px] text-slate-400">v0.1.0</span>
        </div>
        <div className="w-full h-px bg-slate-200 mt-1.5 mb-1" />
      </div>

      {/* Realistic Code Document Block */}
      <div className="rounded-lg bg-slate-900 p-2 font-mono text-[7.5px] leading-relaxed text-slate-300 shadow-inner my-auto">
        <div className="text-amber-400">&#123;</div>
        <div className="pl-2">
          <span className="text-slate-400">&quot;name&quot;:</span>{" "}
          <span className="text-emerald-400">&quot;{isMotion ? "@flux-icons/motion" : "@flux/icons"}&quot;</span>,
        </div>
        <div className="pl-2">
          <span className="text-slate-400">&quot;{isMotion ? "engine" : "license"}&quot;:</span>{" "}
          <span className="text-emerald-400">&quot;{isMotion ? "motion/react" : "MIT"}&quot;</span>,
        </div>
        <div className="pl-2">
          <span className="text-slate-400">&quot;{isMotion ? "interactive" : "treeShakeable"}&quot;:</span>{" "}
          <span className="text-blue-400">true</span>
        </div>
        <div className="text-amber-400">&#125;</div>
      </div>

      {/* Feature Bullet points */}
      <div className="space-y-0.5 font-mono text-[8px] text-slate-600">
        <div className="flex items-center gap-1 text-emerald-700">
          <Check className="size-2.5" /> {isMotion ? "467 Micro-Interactions" : "Zero Bloat Vector SVGs"}
        </div>
        <div className="flex items-center gap-1 text-emerald-700">
          <Check className="size-2.5" /> {isMotion ? "Drop-in React Components" : "Full React & TypeScript"}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-1 font-mono text-[8px] text-slate-400">
        <span>VERIFIED</span>
        <span>2026 MIT</span>
      </div>
    </div>
  )
}
