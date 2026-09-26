/**
 * The lab glass family of 13 Sep 2026: `flask-round`, `test-tube`,
 * `test-tube-diagonal` and `test-tubes`, drawn beside `flask-conical` (the
 * batch's `flask`, renamed) and on its vocabulary: a lip bar over the mouth a
 * unit wider than the glass each side, top corners on r=1, a liquid rule ending
 * on both walls, and a fill that opens the glass above the liquid (the
 * `bars-progress` move), the lip left stroked over the top.
 *
 * Every body is lines and circular arcs, so a plate is an exact offset, checked.
 *
 * The tube is one size everywhere it appears, 6 wide on the centre line (ink
 * 8, interior 4): `test-tubes` packs two side by side with their lips 2 apart,
 * which is what fixes it, and a lone tube is not drawn fatter than a pair's.
 */
import { Path, add, sub, mul, unit, len, dot } from '../v5/geom.mjs';
import { offsetContour, contourPath, verify, flatten } from '../v5/offset.mjs';
import { sharpEndIn } from '../v5/icons.mjs';

const rad = (a) => (a * Math.PI) / 180;
const ang = (c, p) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;
const on = (c, r, a) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
function num(v) {
  if (!Number.isFinite(v)) throw new Error(`non-finite coordinate: ${v}`);
  const r = Math.round(v * 1e4) / 1e4;
  return String(Object.is(r, -0) ? 0 : r);
}
const pt = (p) => `${num(p[0])} ${num(p[1])}`;
const rev = (g) => (g.type === 'L' ? { type: 'L', p0: g.p1, p1: g.p0 } : { type: 'A', c: g.c, r: g.r, a0: g.a1, a1: g.a0 });
const windingOf = (segs) => {
  const q = flatten(segs, 24);
  let a = 0;
  for (let i = 0; i < q.length; i++) { const p = q[i], n = q[(i + 1) % q.length]; a += p[0] * n[1] - n[0] * p[1]; }
  return Math.sign(a);
};
export const holeOf = (plate, segs) => contourPath(windingOf(plate) === windingOf(segs) ? [...segs].reverse().map(rev) : segs);
export function plateOf(segs) {
  const off = offsetContour(segs, 1);
  verify(segs, off, 1);
  return off;
}
const polySegs = (pts) => pts.map((p, i) => ({ type: 'L', p0: p, p1: pts[(i + 1) % pts.length] }));

/** A bar whose free ends sharp pushes out along its own line. */
function bar(p0, p1, sharp, box, ends = [true, true]) {
  let a = p0, b = p1;
  if (sharp) {
    const d = unit(sub(p1, p0));
    if (ends[0]) a = add(p0, mul(d, -sharpEndIn(p0, mul(d, -1), box)));
    if (ends[1]) b = add(p1, mul(d, sharpEndIn(p1, d, box)));
  }
  return `M${pt(a)}L${pt(b)}`;
}

/* ------------------------------------------------------------ the frame */

/**
 * A rigid motion, so one tube can be drawn upright and then tilted without a
 * single coordinate being retyped: points turn and move,
 * arcs keep their radius and sweep and turn their angles.
 */
function motion(theta, O) {
  const c = Math.cos(rad(theta)), s = Math.sin(rad(theta));
  const P = (p) => [O[0] + c * p[0] - s * p[1], O[1] + s * p[0] + c * p[1]];
  const G = (g) => (g.type === 'L' ? { type: 'L', p0: P(g.p0), p1: P(g.p1) } : { type: 'A', c: P(g.c), r: g.r, a0: g.a0 + theta, a1: g.a1 + theta });
  return { P, G, V: (v) => [c * v[0] - s * v[1], s * v[0] + c * v[1]] };
}

/* ------------------------------------------------------------- the tube */

export const TUBE = { hw: 3, lip: 4, rTop: 1 };

/**
 * One tube in its own frame: mouth on y=0 centred on x=0, walls at x = -hw and
 * hw running down to the bottom's centre at y = depth, a half-round bottom of
 * radius hw. The liquid is a rule across at y = level in the frame, or, when
 * `horizontal` is given (a world-space y), the rule a tilted tube's liquid
 * actually makes. Returns everything in world space through `m`.
 */
function tube({ depth, level, m, sharp, box, horizontal = null }) {
  const { hw, lip, rTop } = TUBE;
  const r = sharp ? 0 : rTop;
  // the closed body, clockwise in the frame
  const body = [];
  body.push({ type: 'L', p0: [-hw + r, 0], p1: [hw - r, 0] });
  if (r) body.push({ type: 'A', c: [hw - r, r], r, a0: -90, a1: 0 });
  body.push({ type: 'L', p0: [hw, r], p1: [hw, depth] });
  body.push({ type: 'A', c: [0, depth], r: hw, a0: 0, a1: 180 });
  body.push({ type: 'L', p0: [-hw, depth], p1: [-hw, r] });
  if (r) body.push({ type: 'A', c: [-hw + r, r], r, a0: 180, a1: 270 });
  const world = body.map(m.G);
  const plate = plateOf(world);
  const lipD = bar(m.P([-lip, 0]), m.P([lip, 0]), sharp, box);
  // liquid: its two ends on the walls' centre lines
  let l0, l1;
  if (horizontal === null) { l0 = m.P([-hw, level]); l1 = m.P([hw, level]); }
  else {
    const at = (x) => {
      // the wall x = const in the frame, where it crosses world y = horizontal
      const A = m.P([x, 0]), B = m.P([x, depth]);
      const t = (horizontal - A[1]) / (B[1] - A[1]);
      if (t < 0 || t > 1) throw new Error('the liquid misses a wall');
      return add(A, mul(sub(B, A), t));
    };
    l0 = at(-hw); l1 = at(hw);
  }
  const liquidD = `M${pt(l0)}L${pt(l1)}`;
  // the panel above the liquid: inner walls, the mouth's inner ink, the liquid's upper ink
  let panel;
  const inner = (x, y) => m.P([x, y]);
  if (horizontal === null) {
    panel = polySegs([inner(-hw + 1, 1), inner(hw - 1, 1), inner(hw - 1, level - 1), inner(-hw + 1, level - 1)]);
  } else {
    const yInk = horizontal - 1;
    const cross = (x) => { const A = m.P([x, 0]), B = m.P([x, depth]); const t = (yInk - A[1]) / (B[1] - A[1]); return add(A, mul(sub(B, A), t)); };
    panel = polySegs([inner(-hw + 1, 1), inner(hw - 1, 1), cross(hw - 1), cross(-hw + 1)]);
  }
  const bodyD = contourPath(world);
  return { bodyD, plate, lipD, liquidD, panel };
}

function tubeVariants(parts, sharp) {
  const key = sharp ? 'sharp' : 'regular';
  const strokes = parts.map((t) => t.bodyD + t.lipD + t.liquidD).join('');
  const plates = parts.map((t) => contourPath(t.plate)).join('');
  const fill = parts.map((t) => contourPath(t.plate) + holeOf(t.plate, t.panel)).join('');
  const lips = parts.map((t) => t.lipD).join('');
  return {
    [`stroke.${key}`]: [{ kind: 'stroke', d: strokes }],
    [`duotone.${key}`]: [{ kind: 'plate', d: plates }, { kind: 'stroke', d: strokes }],
    [`fill.${key}`]: [{ kind: 'solid', d: fill }, { kind: 'stroke', d: lips }],
  };
}

/**
 * `test-tube`: mouth on y=2, the bottom's centre on 19 so its ink stops on 23,
 * lip 8..16 painting 7..17. 10 x 22, a vertical whose short axis is its own
 * the way `thermometer`'s 13 is. Liquid at 14, a little under half.
 */
export const TEST_TUBE_BOX = [7, 1, 17, 23];
export function testTube(sharp) {
  const m = motion(0, [12, 2]);
  return tubeVariants([tube({ depth: 17, level: 12, m, sharp, box: TEST_TUBE_BOX })], sharp);
}

/**
 * `test-tubes`: two of the same tube, lips 2 apart, so their centres sit on 6
 * and 18 and the lips paint 1..11 and 13..23: 22 x 22. The liquid stands at two
 * levels, 13 on the left and 16 on the right, so the pair reads as two samples
 * rather than one tube drawn twice.
 */
export const TEST_TUBES_BOX = [1, 1, 23, 23];
export function testTubes(sharp) {
  const a = tube({ depth: 17, level: 11, m: motion(0, [6, 2]), sharp, box: TEST_TUBES_BOX });
  const b = tube({ depth: 17, level: 14, m: motion(0, [18, 2]), sharp, box: TEST_TUBES_BOX });
  return tubeVariants([a, b], sharp);
}

/**
 * `test-tube-diagonal`: the same tube held at a tilt, mouth up and right. Not
 * the corner-to-corner 45: that tube, its lip and a level liquid land 90% on
 * another set's drawing, found by overlay on 13 Sep 2026 and redrawn on his word.
 *
 * The box fixes the tilt. At angle t the lip's upper cap is 4 sin t + 1 above
 * the mouth's centre, so the mouth sits on 2 + 4 sin t; the bottom's centre sits
 * on 19 so its ink stops on 23, which makes the depth (17 - 4 sin t)/cos t.
 * Across, the bottom's ink reaches depth sin t + 4 left of the mouth and the
 * lip's cap 4 cos t + 1 right of it. His rule is a whole-number padding (3.44 at
 * 30 degrees was refused), so t is solved for 18 wide, 3 clear each side:
 * 33.07 degrees. The liquid is level in the world at 13, ending on both walls.
 */
export const TEST_TUBE_DIAGONAL_BOX = [3, 1, 21, 23];
const tilt = (() => {
  const depthAt = (t) => (17 - 4 * Math.sin(t)) / Math.cos(t);
  const width = (t) => 4 * Math.cos(t) + 5 + depthAt(t) * Math.sin(t);
  let lo = rad(20), hi = rad(45);
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (width(m) < 18) lo = m; else hi = m; }
  const t = (lo + hi) / 2, depth = depthAt(t);
  return { deg: (t * 180) / Math.PI, depth, O: [3 + depth * Math.sin(t) + 4, 2 + 4 * Math.sin(t)] };
})();
export function testTubeDiagonal(sharp) {
  const m = motion(tilt.deg, tilt.O);
  return tubeVariants([tube({ depth: tilt.depth, level: 0, m, sharp, box: TEST_TUBE_DIAGONAL_BOX, horizontal: 13 })], sharp);
}

/* -------------------------------------------------------- flask-round */

/**
 * `flask-round`: `flask-conical`'s neck (walls 9.5 and 14.5, lip 8..16 on y=2,
 * top corners r=1) on a round bulb of r=7 centred (12, 15), so the bulb's
 * ink stops on 23 and runs 4..20: 16 x 22, narrower than the conical flask's 18
 * because a sphere carries more weight than a cone at the same width, and on a
 * whole-number padding of 4 (r=7.5 painted 3.5, which he refused 13 Sep).
 * The neck meets the bulb on the r=1 concave fillet; sharp takes it to the
 * crossing. Liquid at 16, a chord ending on the bulb's centre line.
 *
 * The fill opens the neck and the bulb above the liquid's ink at 15; its
 * corners where the neck's inner wall meets the bulb's inner ink turn on the
 * fillet's own inner radius, 2 (1 about the crossing in sharp).
 */
export const FLASK_ROUND_BOX = [4, 1, 20, 23];
const BULB = { c: [12, 15], R: 7 };
const NECK = { x: [9.5, 14.5], top: 2 };
export function flaskRound(sharp) {
  const { c, R } = BULB;
  const r = sharp ? 0 : 1;
  const [xl, xr] = NECK.x;
  const segs = [];
  segs.push({ type: 'L', p0: [xl + r, NECK.top], p1: [xr - r, NECK.top] });
  if (r) segs.push({ type: 'A', c: [xr - r, NECK.top + r], r, a0: -90, a1: 0 });
  // right junction: the concave fillet's centre sits r outside the wall and R + r from the bulb's centre
  let jR, fR = null;
  if (r) {
    const Fx = xr + r, Fy = c[1] - Math.sqrt((R + r) ** 2 - (Fx - c[0]) ** 2);
    fR = [Fx, Fy];
    const T = [xr, Fy], A = add(c, mul(unit(sub(fR, c)), R));
    segs.push({ type: 'L', p0: [xr, NECK.top + r], p1: T });
    segs.push({ type: 'A', c: fR, r, a0: 180, a1: ang(fR, A) });
    jR = A;
  } else {
    jR = [xr, c[1] - Math.sqrt(R * R - (xr - c[0]) ** 2)];
    segs.push({ type: 'L', p0: [xr, NECK.top], p1: jR });
  }
  const jL = [24 - jR[0], jR[1]];
  // the bulb clockwise from the right junction round the bottom to the left one
  let b0 = ang(c, jR), b1 = ang(c, jL);
  while (b1 < b0) b1 += 360;
  segs.push({ type: 'A', c, r: R, a0: b0, a1: b1 });
  if (r) {
    const fL = [24 - fR[0], fR[1]];
    let a0 = ang(fL, jL), a1 = 360;
    while (a1 - a0 > 180) a1 -= 360;
    segs.push({ type: 'A', c: fL, r, a0, a1 });
    segs.push({ type: 'L', p0: [xl, fL[1]], p1: [xl, NECK.top + r] });
    segs.push({ type: 'A', c: [xl + r, NECK.top + r], r, a0: 180, a1: 270 });
  } else {
    segs.push({ type: 'L', p0: jL, p1: [xl, NECK.top] });
  }
  const plate = plateOf(segs);
  const box = FLASK_ROUND_BOX;
  const lipD = bar([8, NECK.top], [16, NECK.top], sharp, box);
  const yL = 16, hx = Math.sqrt(R * R - (yL - c[1]) ** 2);
  const liquidD = `M${pt([c[0] - hx, yL])}L${pt([c[0] + hx, yL])}`;
  // panel
  const Ri = R - 1, yInk = yL - 1, hxi = Math.sqrt(Ri * Ri - (yInk - c[1]) ** 2);
  const panel = [];
  const top = NECK.top + 1;
  panel.push({ type: 'L', p0: [xl + 1, top], p1: [xr - 1, top] });
  let pR, pL;
  if (!sharp) {
    const T = [xr - 1, fR[1]], A = add(c, mul(unit(sub(fR, c)), Ri));
    panel.push({ type: 'L', p0: [xr - 1, top], p1: T });
    panel.push({ type: 'A', c: fR, r: 2, a0: 180, a1: ang(fR, A) });
    pR = A;
  } else {
    // the stroke's round join paints a unit's disc about the crossing on the inside
    const X = jR;
    const hit = [xr - 1, X[1]];                          // inner wall, level with the crossing
    const a = add(c, mul(unit(sub(X, c)), Ri));         // bulb's inner ink on the crossing's radius
    // the inner walls and the bulb's inner ink both touch the disc of 1 about X
    panel.push({ type: 'L', p0: [xr - 1, top], p1: hit });
    panel.push({ type: 'A', c: X, r: 1, a0: 180, a1: ang(X, a) });
    pR = a;
  }
  let a0 = ang(c, pR), a1 = ang(c, [c[0] + hxi, yInk]);
  while (a1 < a0) a1 += 360;
  panel.push({ type: 'A', c, r: Ri, a0, a1 });
  panel.push({ type: 'L', p0: [c[0] + hxi, yInk], p1: [c[0] - hxi, yInk] });
  pL = [24 - pR[0], pR[1]];
  let c0 = ang(c, [c[0] - hxi, yInk]), c1 = ang(c, pL);
  while (c1 < c0) c1 += 360;
  panel.push({ type: 'A', c, r: Ri, a0: c0, a1: c1 });
  const cj = sharp ? [24 - jR[0], jR[1]] : [24 - fR[0], fR[1]];
  const rr = sharp ? 1 : 2;
  let d0 = ang(cj, pL), d1 = 360;
  while (d1 - d0 > 180) d1 -= 360;
  panel.push({ type: 'A', c: cj, r: rr, a0: d0, a1: d1 });
  panel.push({ type: 'L', p0: [xl + 1, cj[1]], p1: [xl + 1, top] });
  const key = sharp ? 'sharp' : 'regular';
  const strokes = contourPath(segs) + lipD + liquidD;
  return {
    [`stroke.${key}`]: [{ kind: 'stroke', d: strokes }],
    [`duotone.${key}`]: [{ kind: 'plate', d: contourPath(plate) }, { kind: 'stroke', d: strokes }],
    [`fill.${key}`]: [{ kind: 'solid', d: contourPath(plate) + holeOf(plate, panel) }, { kind: 'stroke', d: lipD }],
  };
}
