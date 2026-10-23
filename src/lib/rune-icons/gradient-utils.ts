import type { ViewBox } from "@/lib/svg-utils";
import type { CustomizationState } from "@/lib/types";

export interface GradientStop {
  color: string;
  position: number;
}

function lerpHex(c1: string, c2: string, t: number): string {
  const parse = (c: string) => {
    const h = c.replace("#", "").replace(/^([0-9a-f])([0-9a-f])([0-9a-f])$/i, "$1$1$2$2$3$3");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(c1 || "#000000");
  const [r2, g2, b2] = parse(c2 || "#000000");
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function interpolateStops(stops: GradientStop[], t: number): string {
  const s = [...stops].sort((a, b) => a.position - b.position);
  const pos = t * 100;
  if (!s.length) return "#000000";
  if (pos <= s[0].position) return s[0].color;
  const last = s[s.length - 1];
  if (pos >= last.position) return last.color;
  for (let i = 0; i < s.length - 1; i++) {
    if (pos >= s[i].position && pos <= s[i + 1].position) {
      const range = s[i + 1].position - s[i].position;
      return lerpHex(s[i].color, s[i + 1].color, range === 0 ? 0 : (pos - s[i].position) / range);
    }
  }
  return last.color;
}

export interface ConicSegment {
  points: string;
  color: string;
}

export function buildConicSegments(
  stops: GradientStop[],
  startAngleDeg: number,
  cx: number,
  cy: number,
  r: number,
  n = 72
): ConicSegment[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / n;

    const a1 = ((startAngleDeg + t * 360 - 90) * Math.PI) / 180;
    const a2 = ((startAngleDeg + ((i + 1) / n) * 360 - 90) * Math.PI) / 180;
    const x1 = (cx + r * Math.cos(a1)).toFixed(3);
    const y1 = (cy + r * Math.sin(a1)).toFixed(3);
    const x2 = (cx + r * Math.cos(a2)).toFixed(3);
    const y2 = (cy + r * Math.sin(a2)).toFixed(3);
    return {
      points: `${cx.toFixed(3)},${cy.toFixed(3)} ${x1},${y1} ${x2},${y2}`,
      color: interpolateStops(stops, t),
    };
  });
}

type IconGradient = CustomizationState["gradient"];

// Builds the `icon-gradient` paint server for an icon, in userSpaceOnUse
// coordinates scaled to the icon's viewBox. Angular gradients have no SVG
// primitive, so they are drawn as a pattern of conic wedges.
export function buildIconGradientDefs(gradient: IconGradient, vb: ViewBox): string {
  const stops = [...gradient.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `<stop offset="${s.position}%" stop-color="${s.color || "#000000"}"/>`)
    .join("");
  const spreadMethod = gradient.spreadMethod ?? "pad";

  if (gradient.type === "linear") {
    const centreX = vb.x + vb.w / 2;
    const centreY = vb.y + vb.h / 2;
    const rad = (gradient.angle * Math.PI) / 180;
    const x1 = (centreX - (vb.w / 2) * Math.sin(rad)).toFixed(3);
    const y1 = (centreY + (vb.h / 2) * Math.cos(rad)).toFixed(3);
    const x2 = (centreX + (vb.w / 2) * Math.sin(rad)).toFixed(3);
    const y2 = (centreY - (vb.h / 2) * Math.cos(rad)).toFixed(3);
    return `<linearGradient id="icon-gradient" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse" spreadMethod="${spreadMethod}">${stops}</linearGradient>`;
  }

  const cx = vb.x + ((gradient.cx ?? 50) / 100) * vb.w;
  const cy = vb.y + ((gradient.cy ?? 50) / 100) * vb.h;

  if (gradient.type === "radial") {
    const r = ((gradient.r ?? 50) / 100) * vb.w;
    return `<radialGradient id="icon-gradient" cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${r.toFixed(3)}" gradientUnits="userSpaceOnUse" spreadMethod="${spreadMethod}">${stops}</radialGradient>`;
  }

  const polys = buildConicSegments(gradient.stops, gradient.angle, cx, cy, 17)
    .map((s) => `<polygon points="${s.points}" fill="${s.color}"/>`)
    .join("");
  return `<pattern id="icon-gradient" width="${vb.w}" height="${vb.h}" patternUnits="userSpaceOnUse">${polys}</pattern>`;
}
