// Numerals in his heading-1 box: x 15..21, y 12..19 (baseline 19, top 12). Built only from true circular arcs and
// straight lines, every join tangent. Returns path strings.
import * as G from './geo.mjs';
const f4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return String(Object.is(r, -0) ? 0 : r); };
const pt = (p) => `${f4(p[0])} ${f4(p[1])}`;
const rad = (d) => (d * Math.PI) / 180;
const on = (c, r, a) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
// an arc as cubics, a0 -> a1 in degrees (screen angles: 0 right, 90 down); sweep sign follows a1 - a0
// split on the cardinal angles, not into equal pieces, so every control point sits on the circle's own axes
const arcC = (c, r, a0, a1) => {
  const dir = Math.sign(a1 - a0), stops = [a0];
  for (let a = (dir > 0 ? Math.floor(a0 / 90) + 1 : Math.ceil(a0 / 90) - 1) * 90; dir > 0 ? a < a1 - 1e-9 : a > a1 + 1e-9; a += 90 * dir) stops.push(a);
  stops.push(a1);
  let d = '';
  for (let i = 0; i + 1 < stops.length; i++) d += G.arc(c, r, rad(stops[i]), rad(stops[i + 1] - stops[i])).map((s) => `C${pt(s.p[1])} ${pt(s.p[2])} ${pt(s.p[3])}`).join('');
  return d;
};
/** Tangent point on circle (c, r) for a line from external point p, on the side given by sign (+1 / -1). */
function tangentPoint(p, c, r, sign) {
  const d = G.sub(p, c), L = G.len(d), a = Math.atan2(d[1], d[0]), b = Math.acos(r / L);
  return (a + sign * b) * 180 / Math.PI;
}
export const ONE = 'M15.75 14.1L18 12V19M15 19H21'; // his, verbatim

// One bowl for 3, 5 and 6: r=2 on (18,17), sitting on the baseline 19 with its top at 15, which leaves 1 of white
// under a bar at 12, the house clearance for a letterform. The 2 takes the same radius at the top.
const BOWL = { c: [18, 17], r: 2 };
// 2: a top bowl r=2 on (18,14) from its left, over the top, round to where a straight line leaves it tangent for the
// bottom-left corner (15,19), then his foot to 21
export function two() {
  const c = [18, 14], r = 2, corner = [15, 19];
  const aT = tangentPoint(corner, c, r, -1);
  let a1 = aT; while (a1 < 180) a1 += 360;
  return `M${pt(on(c, r, 180))}${arcC(c, r, 180, a1)}L${pt(corner)}H21`;
}
// 3: flat top: a bar, a diagonal down to the bowl's top, and the bowl round the right, left open at 150 degrees
export function three() {
  const { c, r } = BOWL, top = on(c, r, 270);
  return `M15.5 12H20L${pt(top)}${arcC(c, r, -90, 150)}`;
}
// 4: open form, left stem 15.5 down to the bar at 16.5, bar to 21, right stem 19.5 full height
export const FOUR = 'M15.5 12V16.5H21M19.5 12V19';
// 5: top bar, a stem to the bowl's height, into the bowl at its top, round the right, left open at 150 degrees
export function five() {
  const { c, r } = BOWL, top = on(c, r, 270);
  return `M20.5 12H16V${f4(top[1])}H${f4(top[0])}${arcC(c, r, -90, 150)}`;
}
// 6: the full bowl and a neck leaving its leftmost point tangent, an arc centred on the bowl's horizontal, ending at
// (19.75,12)
export function six(circle = BOWL, end = [20, 12]) { // his 2..5 end their tops at x 20
  const { c, r } = circle, left = on(c, r, 180);
  const dx = end[0] - left[0], dy = left[1] - end[1], R = (dx * dx + dy * dy) / (2 * dx), nc = [left[0] + R, left[1]];
  const aEnd = Math.atan2(end[1] - nc[1], end[0] - nc[0]) * 180 / Math.PI;
  const neck = `M${pt(end)}${arcC(nc, R, aEnd, -180)}`;
  const bowl = `M${pt(left)}${arcC(c, r, 180, 360)}${arcC(c, r, 0, 180)}Z`;
  return neck + bowl;
}
