import { getIconDataById } from "@/lib/rune-icons/icons";
import { CustomizationState, IconData } from "@/lib/types";

export const MAX_TRAY_ITEMS = 6;

export const DUOTONE_SECONDARY_DEFAULT = "#9DB4F5";
export const TYPE_DEFAULT_COLORS: Record<string, [string, string]> = {
  normal: ["", ""],
  pixelated: ["", ""],
  glass: ["", ""],
  duotone: ["#3859FD", DUOTONE_SECONDARY_DEFAULT],
  fill: ["#DDDDDD", "#1C1F21"],
};

export interface IconTypeEffectSupport {
  color: boolean;
  motion: boolean;
  roundness: boolean;
  flipRotate: boolean;
  shadow: boolean;
  noise: boolean;
  texture: boolean;
  blur: boolean;
}

const FULL_SUPPORT: IconTypeEffectSupport = {
  color: true,
  motion: true,
  roundness: true,
  flipRotate: true,
  shadow: true,
  noise: true,
  texture: true,
  blur: true,
};

export const TYPE_EFFECT_SUPPORT: Record<string, IconTypeEffectSupport> = {
  normal: FULL_SUPPORT,
  duotone: FULL_SUPPORT,
  fill: FULL_SUPPORT,
  pixelated: {
    ...FULL_SUPPORT,
    motion: false,
    roundness: false,
    flipRotate: false,
    shadow: false,
    noise: false,
    texture: false,
  },
  glass: {
    ...FULL_SUPPORT,
    color: false,
    motion: false,
    roundness: false,
    shadow: false,
    noise: false,
    texture: false,
  },
};

export function resolveEffectiveIconType(
  selectedIcon: IconData | null,
  stateIconType: CustomizationState["iconType"],
): CustomizationState["iconType"] {
  if (selectedIcon?.category === "custom") return "normal";
  return (selectedIcon?.iconType as CustomizationState["iconType"] | undefined) ?? stateIconType;
}

export const DEFAULT_STATE: CustomizationState = {
  colors: ["", ""],
  numColors: 2,
  scale: 3,
  blur: 0,
  motion: {
    enabled: false,
    animationType: "draw",
    duration: 2,
    delay: 0.12,
    easingId: "ease-in-out",
    customCubic: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    loop: true,
    replayNonce: 0,
    pathTrimStart: 0,
    pathTrimEnd: 100,
    pathSequential: false,
    pathStaggerDelay: 0.12,
    pathReverse: false,
    isPaused: false,
    scrubProgress: null,
    presetId: null,
    interactionMode: "animate" as const,
    trigger: "auto" as const,
    autoReverse: false,
    selectedPathIndex: -1,
    perPathAnimations: {},
  },
  translateX: 0,
  translateY: 0,
  padding: 4,
  cornerRadius: 12,
  backgroundColor: "transparent",
  flipH: false,
  flipV: false,
  rotation: 0,
  width: 128,
  height: 128,
  lockAspect: true,
  iconGradient: false,
  shadow: {
    enabled: false,
    opacity: 0,
    blur: 10,
    offsetX: 0,
    offsetY: 4,
    inner: false,
  },
  noise: {
    enabled: false,
    intensity: 20,
  },
  texture: {
    enabled: false,
    selected: "none",
    opacity: 50,
  },
  gradient: {
    type: "linear",
    angle: 135,
    stops: [
      { color: "#6366f1", position: 0 },
      { color: "#a855f7", position: 50 },
      { color: "#ec4899", position: 100 },
    ],
    target: "stroke" as const,
    spreadMethod: "pad" as const,
    cx: 50,
    cy: 50,
    r: 50,
  },
  customIcons: [],
  iconType: "normal",
  strokeStyle: "round",
};

export const WORKSPACE_STATE_KEY = "rune_workspace_state";
export const SELECTED_ICON_KEY = "rune_selected_icon_id";
export const TRAY_ICON_IDS_KEY = "rune_tray_icon_ids";

const VALID_ICON_TYPES: CustomizationState["iconType"][] = [
  "normal",
  "duotone",
  "fill",
  "pixelated",
  "glass",
];
const VALID_STROKE_STYLES: CustomizationState["strokeStyle"][] = [
  "round",
  "sharp",
  "soft",
  "medium",
];

// Merges saved or imported state over DEFAULT_STATE so older/newer configs
// can't drop nested keys, inject invalid enum values, or restore dead blob: URLs.
// Removed icon types (isometric, dither) fall back to "normal".
export function sanitizeCustomizationState(raw: Record<string, unknown>): CustomizationState {
  const parsed = raw as Partial<CustomizationState> & Record<string, unknown>;
  return {
    ...DEFAULT_STATE,
    ...parsed,
    iconType: VALID_ICON_TYPES.includes(parsed.iconType as CustomizationState["iconType"])
      ? (parsed.iconType as CustomizationState["iconType"])
      : DEFAULT_STATE.iconType,
    strokeStyle: VALID_STROKE_STYLES.includes(
      parsed.strokeStyle as CustomizationState["strokeStyle"],
    )
      ? (parsed.strokeStyle as CustomizationState["strokeStyle"])
      : DEFAULT_STATE.strokeStyle,
    motion: { ...DEFAULT_STATE.motion, ...parsed.motion },
    shadow: { ...DEFAULT_STATE.shadow, ...parsed.shadow },
    noise: { ...DEFAULT_STATE.noise, ...parsed.noise },
    texture: { ...DEFAULT_STATE.texture, ...parsed.texture },
    gradient: { ...DEFAULT_STATE.gradient, ...parsed.gradient },
    customIcons: Array.isArray(parsed.customIcons)
      ? parsed.customIcons.filter(
          (icon: unknown) =>
            typeof icon === "object" &&
            icon !== null &&
            typeof (icon as { id?: unknown }).id === "string" &&
            typeof (icon as { name?: unknown }).name === "string" &&
            typeof (icon as { url?: unknown }).url === "string" &&
            !(icon as { url: string }).url.startsWith("blob:"),
        )
      : [],
  };
}

const DEFAULT_PLUS = getIconDataById("indicators-plus", "normal");
export const DEFAULT_TRAY_ICONS: IconData[] = DEFAULT_PLUS
  ? [{ ...DEFAULT_PLUS, iconType: "normal" }]
  : [];
