/**
 * Batch B's second round, 13 Sep 2026: Zafar's refs fitted (`ear`,
 * `ear-listen`, `ear-waveform`, `airpods`, `airpods-open`).
 *
 * The ears are open glyphs and ship stroke only, as `ear` always has; his
 * curves are already on the grid, so they go in as drawn and sharp only adds
 * the stub at each free end. The airpods cases are lines and circular arcs, so
 * every plate is an exact offset, checked.
 */
import { add, sub, mul, unit, len } from '../v5/geom.mjs';
import { offsetContour, contourPath, verify, flatten, clipContour, mirrorSegs } from '../v5/offset.mjs';
import { sharpEndIn } from '../v5/icons.mjs';
import { refineCubics, trimInset, dropSpecks } from '../batch-d/refit.mjs';
import { offsetPath as offsetPathC, verify as verifyC } from '../../.claude/skills/icon-system/tools/offset.mjs';

const rad = (a) => (a * Math.PI) / 180;
const ang = (c, p) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;
const on = (c, r, a) => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];
export function num(v) {
  if (!Number.isFinite(v)) throw new Error(`non-finite coordinate: ${v}`);
  const r = Math.round(v * 1e4) / 1e4;
  return String(Object.is(r, -0) ? 0 : r);
}
export const pt = (p) => `${num(p[0])} ${num(p[1])}`;
export const rev = (g) => (g.type === 'L' ? { type: 'L', p0: g.p1, p1: g.p0 } : { type: 'A', c: g.c, r: g.r, a0: g.a1, a1: g.a0 });
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
export const startOf = (g) => (g.type === 'L' ? g.p0 : on(g.c, g.r, g.a0));
export const endOf = (g) => (g.type === 'L' ? g.p1 : on(g.c, g.r, g.a1));
export const L = (p0, p1) => ({ type: 'L', p0, p1 });
export const A = (c, r, a0, a1) => ({ type: 'A', c, r, a0, a1 });
/** A closed run clipped to one side of a line, closed along it. */
export function clipClosed(segs, P, nrm, d, keep) {
  const run = clipContour(segs, P, nrm, d, keep)[0];
  return [...run, L(endOf(run[run.length - 1]), startOf(run[0]))];
}
const S = (d) => ({ kind: 'stroke', d: String(d) });
const F = (d) => ({ kind: 'solid', d: String(d) });
const P = (d) => ({ kind: 'plate', d: String(d) });

/** A stub pushed out of a free end by the corner rule. */
const stub = (p, dir, box) => add(p, mul(dir, sharpEndIn(p, dir, box)));
const tanAt = (g, at) => {
  if (g.type === 'L') return unit(sub(g.p1, g.p0));
  const a = at ? g.a1 : g.a0, s = Math.sign(g.a1 - g.a0);
  return mul([-Math.sin(rad(a)), Math.cos(rad(a))], s);
};
/** An open run as `d`, sharp pushing a stub out of each end marked free. */
export function openRun(segs, sharp, ends = [true, true], box = [1, 1, 23, 23]) {
  let d = '';
  const s0 = startOf(segs[0]), e1 = endOf(segs[segs.length - 1]);
  if (sharp && ends[0]) d += `M${pt(stub(s0, mul(tanAt(segs[0], 0), -1), box))}L${pt(s0)}`;
  else d += `M${pt(s0)}`;
  d += contourPath(segs, false).replace(/^M[-\d. ]+/, '');
  if (sharp && ends[1]) d += `L${pt(stub(e1, tanAt(segs[segs.length - 1], 1), box))}`;
  return d;
}
/** A raw cubic run as `d`: his curves, verbatim, stubbed the same way. */
function cubicRun(start, cubics, sharp, ends, box, startDir, endDir) {
  let d = '';
  if (sharp && ends[0]) d += `M${pt(stub(start, startDir, box))}L${pt(start)}`;
  else d += `M${pt(start)}`;
  let last = start;
  for (const c of cubics) { d += `C${pt(c[0])} ${pt(c[1])} ${pt(c[2])}`; last = c[2]; }
  if (sharp && ends[1]) d += `L${pt(stub(last, endDir, box))}`;
  return d;
}

/* ------------------------------------------------------------------ ears */

/**
 * `ear`: his drawing. The helix is an r=7 arc about (12, 9) from its left
 * horizontal over the top; the back of the ear is two of his cubics, tangent
 * to the helix at (19, 9) and to each other at (14, 19.5), coming round into
 * the lobe, a quarter circle of r=3 about (11, 19) that stops on its left
 * horizontal. The antihelix is an r=2.5 arc about the helix's centre, 2.5 clear
 * of it, with its tail down the LEFT side to (9.5, 11). 16 x 22 on 4..20.
 */
const EAR_BOX = [4, 1, 20, 23];
const HELIX = { c: [12, 9], r: 7 };
function earParts(sharp, { lobeEnd = 180, dx = 0, back = true } = {}) {
  const box = [1, 1, 23, 23];
  const T = (p) => [p[0] + dx, p[1]];
  const C = T(HELIX.c);
  const helix = A(C, HELIX.r, 180, 360);
  const lobeC = T([11, 19]);
  const parts = [];
  if (back) {
    // helix, then his two cubics, then the lobe arc: one run
    let d = sharp ? `M${pt(T([5, 10]))}L${pt(T([5, 9]))}` : `M${pt(T([5, 9]))}`;
    d += contourPath([helix], false).replace(/^M[-\d. ]+/, '');
    d += `C${pt(T([19, 13.4936]))} ${pt(T([15.4839, 12.0806]))} ${pt(T([14, 19.5]))}`;
    d += `C${pt(T([13.5, 22]))} ${pt(T([11.821, 22]))} ${pt(T([11, 22]))}`;
    const lobe = A(lobeC, 3, 90, lobeEnd);
    d += contourPath([lobe], false).replace(/^M[-\d. ]+/, '');
    if (sharp) { const e = endOf(lobe); d += `L${pt(stub(e, tanAt(lobe, 1), box))}`; }
    parts.push(d);
  } else {
    parts.push(openRun([helix], sharp, [true, true], box));
    parts.push(openRun([A(lobeC, 3, 90, 180)], sharp, [true, true], box));
  }
  // antihelix: from its right horizontal over the top and down the left to y=11
  parts.push(openRun([A(C, 2.5, 0, -180), L(T([9.5, 9]), T([9.5, 11]))], sharp, [true, true], box));
  return parts.join('');
}
export function ear(sharp) {
  const key = sharp ? 'sharp' : 'regular';
  return { box: EAR_BOX, variants: { [`stroke.${key}`]: [S(earParts(sharp))] } };
}

/**
 * `ear-listen`: the ear with sound going in. His two dashes on the lower left
 * run at slope 2, 2.02 apart, the short one lengthened to 2.24 (at 1.1 a butt
 * cap has less run than its own width); the lobe stops at (8.17, 20) so the longer dash
 * clears it. His wave at the top right is made concentric with the helix, r=10.5
 * about (12, 9), 1.5 clear of it (a corner-to-corner 22 box leaves no room for
 * the full 2 there: at 45 degrees the arc's radius cannot pass 9.9), running
 * from the top ink line to the right one.
 */
export function earListen(sharp) {
  const key = sharp ? 'sharp' : 'regular';
  const box = [1, 1, 23, 23];
  const lobeEnd = 180 - (Math.atan2(1, 2.8293) * 180) / Math.PI;      // his lobe end, (8.17, 20)
  const ear = earParts(sharp, { lobeEnd });
  const dashes = openRun([L([2, 16.5], [3, 18.5])], sharp, [true, true], box) + openRun([L([5, 13.5], [6.5, 16.5])], sharp, [true, true], box);
  const a0 = -(Math.asin(7 / 10.5) * 180) / Math.PI, a1 = -(Math.acos(10 / 10.5) * 180) / Math.PI;
  const wave = openRun([A(HELIX.c, 10.5, a0, a1)], sharp, [true, true], box);
  return { box, variants: { [`stroke.${key}`]: [S(ear + dashes + wave)] } };
}

/**
 * `ear-waveform`: the helix and antihelix over three bars, his drawing on the
 * set's `audio-lines` pitch of 4 (his 3 left 1 between bars). The bars make the
 * drawing wider on the right than the ear, so the ear moves a unit left and the
 * bars stand on 12, 16 and 20: 3..21, a whole-number padding of 3 (half a unit
 * left painted 3.5, refused 13 Sep). The lobe keeps its quarter circle.
 */
export function earWaveform(sharp) {
  const key = sharp ? 'sharp' : 'regular';
  const box = [1, 1, 23, 23];
  const dx = -1;
  const ear = earParts(sharp, { dx, back: false });
  const bars = [[12, 15, 18], [16, 13, 20], [20, 15, 18]].map(([x, y0, y1]) => openRun([L([x, y0], [x, y1])], sharp, [true, true], box)).join('');
  return { box: [3, 1, 21, 23], variants: { [`stroke.${key}`]: [S(ear + bars)] } };
}

/* --------------------------------------------------------------- airpods */

/**
 * The two cases are a real product, so they keep HIS proportions and radii
 * rather than the set's: restored 14 Sep 2026 on his word ("that's a real
 * product and the shape with radius must be exempted"). The first fit had
 * squared the closed case to 18 on r=4 and narrowed the open one to match, and
 * put circles where his lid is a curve.
 *
 * `airpods`: his case, 2..22 by 3..21 on r=5, the lid's seam across at y=9,
 * the hinge a pill 8..16 riding the seam, and the light a mark of 2 at (12, 14),
 * 2 clear of the hinge's ink. Ink 1..23 by 2..22. Sharp squares the case and
 * the pill on the same box; the light stays round.
 *
 * Duotone: the case's plate under it all. Fill: the case solid with the seam
 * and the hinge knocked out as one region (they overlap, and two knockouts may
 * not), the seam stopping on the walls' inner ink so the case stays one piece,
 * and the light knocked out.
 */
const CASE = { x: [2, 22], y: [3, 21], r: 5 };
function roundRect(x0, y0, x1, y1, rt, rb = rt) {
  const s = [];
  s.push(L([x0 + rt, y0], [x1 - rt, y0]));
  if (rt) s.push(A([x1 - rt, y0 + rt], rt, -90, 0));
  s.push(L([x1, y0 + rt], [x1, y1 - rb]));
  if (rb) s.push(A([x1 - rb, y1 - rb], rb, 0, 90));
  s.push(L([x1 - rb, y1], [x0 + rb, y1]));
  if (rb) s.push(A([x0 + rb, y1 - rb], rb, 90, 180));
  s.push(L([x0, y1 - rb], [x0, y0 + rt]));
  if (rt) s.push(A([x0 + rt, y0 + rt], rt, 180, 270));
  return s.filter((g) => g.type === 'A' || len(sub(g.p1, g.p0)) > 1e-9);
}
const dotD = (c, r) => contourPath([A(c, r, 0, 90), A(c, r, 90, 180), A(c, r, 180, 270), A(c, r, 270, 360)]);

export function airpods(sharp) {
  const key = sharp ? 'sharp' : 'regular';
  const r = sharp ? 0 : CASE.r;
  const body = roundRect(CASE.x[0], CASE.y[0], CASE.x[1], CASE.y[1], r);
  const plate = plateOf(body);
  const seam = `M${CASE.x[0]} 9L${CASE.x[1]} 9`;
  const pill = sharp ? polySegs([[8, 8], [16, 8], [16, 10], [8, 10]]) : [L([9, 8], [15, 8]), A([15, 9], 1, -90, 90), L([15, 10], [9, 10]), A([9, 9], 1, 90, 270)];
  const light = dotD([12, 14], 1);
  const strokes = contourPath(body) + seam + contourPath(pill);
  // the knockout: the seam's band between the walls' inner ink, unioned with the pill's band
  const wi = CASE.x[0] + 1, wo = CASE.x[1] - 1;
  const k = sharp
    ? [L([wi, 8], [7, 8]), A([8, 8], 1, 180, 270), L([8, 7], [16, 7]), A([16, 8], 1, 270, 360), L([17, 8], [wo, 8]), L([wo, 8], [wo, 10]), L([wo, 10], [17, 10]),
       A([16, 10], 1, 0, 90), L([16, 11], [8, 11]), A([8, 10], 1, 90, 180), L([7, 10], [wi, 10]), L([wi, 10], [wi, 8])]
    : (() => {
      const xo = Math.sqrt(3);                                        // the pill's r=2 end meets the seam's edge at 9 - sqrt 3
      return [L([wi, 8], [9 - xo, 8]), A([9, 9], 2, ang([9, 9], [9 - xo, 8]), -90), L([9, 7], [15, 7]), A([15, 9], 2, 270, 360 + ang([15, 9], [15 + xo, 8])), L([15 + xo, 8], [wo, 8]), L([wo, 8], [wo, 10]),
        L([wo, 10], [15 + xo, 10]), A([15, 9], 2, ang([15, 9], [15 + xo, 10]), 90), L([15, 11], [9, 11]), A([9, 9], 2, 90, ang([9, 9], [9 - xo, 10])), L([9 - xo, 10], [wi, 10]), L([wi, 10], [wi, 8])];
    })();
  const kn = k.filter((g) => g.type === 'A' || len(sub(g.p1, g.p0)) > 1e-9);
  const lightHole = [A([12, 14], 1, 0, 90), A([12, 14], 1, 90, 180), A([12, 14], 1, 180, 270), A([12, 14], 1, 270, 360)];
  return {
    box: [1, 2, 23, 22],
    variants: {
      [`stroke.${key}`]: [S(strokes), F(light)],
      [`duotone.${key}`]: [P(contourPath(plate)), S(strokes), F(light)],
      [`fill.${key}`]: [F(contourPath(plate) + holeOf(plate, kn) + holeOf(plate, lightHole))],
    },
  };
}
function polySegs(pts) { return pts.map((p, i) => L(p, pts[(i + 1) % pts.length])); }

/**
 * `airpods-open`: his drawing, verbatim. The body is the case below the seam,
 * 2..22 by 9..21, top corners on r=1 and bottom on r=5; the lid is his curve,
 * leaving the seam at 3.7961 and 20.2039, bulging out to x=3 and meeting its
 * flat top on y=3 at 6.7609 and 17.2391. The hinge hangs under the seam as
 * half its pill. Ink 1..23 by 2..22, the closed case's box.
 *
 * Sharp squares the lid on his earlier word: a box on 3..21, a unit in from the
 * body's walls so it still reads as a separate lid, standing on the seam.
 *
 * Duotone: one plate round lid and body, his curve offset and checked. Fill:
 * the lid and the body as two solids, the seam between them knocked out, which
 * is what says the lid is off; the half pill and the light knocked out of the
 * body.
 */
const LID = 'M3.7961 9C1.9535 6.6308 3.461 3.4056 6.7609 3L17.2391 3C20.539 3.4056 22.0465 6.6308 20.2039 9';
/** Cut a closed M/L/C path on the line y = at, keeping one side, closed along the line. */
function clipY(d, at, keepAbove) {
  const t = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) || [];
  const segs = []; let i = 0, cur = null, st = null;
  while (i < t.length) {
    const c = t[i++];
    if (c === 'M') { cur = [+t[i++], +t[i++]]; st = cur; }
    else if (c === 'L') { const q = [+t[i++], +t[i++]]; segs.push([cur, cur, q, q]); cur = q; }
    else if (c === 'C') { const k = [cur, [+t[i++], +t[i++]], [+t[i++], +t[i++]], [+t[i++], +t[i++]]]; segs.push(k); cur = k[3]; }
    else if (len(sub(cur, st)) > 1e-9) { segs.push([cur, cur, st, st]); cur = st; }
  }
  const at4 = (k, s) => { const u = 1 - s; return [0, 1].map((j) => u ** 3 * k[0][j] + 3 * u * u * s * k[1][j] + 3 * u * s * s * k[2][j] + s ** 3 * k[3][j]); };
  const cut = (k, s) => { const Lr = (a, b) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
    const p01 = Lr(k[0], k[1]), p12 = Lr(k[1], k[2]), p23 = Lr(k[2], k[3]), p012 = Lr(p01, p12), p123 = Lr(p12, p23), p = Lr(p012, p123);
    return [[k[0], p01, p012, p], [p, p123, p23, k[3]]]; };
  const inside = (p) => (keepAbove ? p[1] <= at + 1e-9 : p[1] >= at - 1e-9);
  // split every segment at its crossings, then keep the pieces on the kept side
  const pieces = [];
  for (const k of segs) {
    const ts = [];
    for (let j = 0; j < 80; j++) {
      let a = j / 80, b = (j + 1) / 80;
      if ((at4(k, a)[1] - at) * (at4(k, b)[1] - at) < 0) {
        for (let n = 0; n < 60; n++) { const m = (a + b) / 2; if ((at4(k, a)[1] - at) * (at4(k, m)[1] - at) <= 0) b = m; else a = m; }
        ts.push((a + b) / 2);
      }
    }
    let rest = k, lo = 0;
    for (const s of ts) { const [h, r] = cut(rest, (s - lo) / (1 - lo)); h[3][1] = at; r[0] = h[3]; pieces.push(h); rest = r; lo = s; }
    pieces.push(rest);
  }
  const kept = pieces.map((k) => inside(at4(k, 0.5)));
  const start = kept.findIndex((v, j) => v && !kept[(j - 1 + kept.length) % kept.length]);
  if (start < 0 || kept.filter((v, j) => v && !kept[(j - 1 + kept.length) % kept.length]).length !== 1) throw new Error('clipY: wants exactly one kept run');
  let out = `M${pt(pieces[start][0])}`;
  for (let j = 0; j < pieces.length; j++) {
    const k = pieces[(start + j) % pieces.length];
    if (!inside(at4(k, 0.5))) break;
    const line = len(sub(k[1], k[0])) < 1e-12 && len(sub(k[2], k[3])) < 1e-12;
    out += line ? `L${pt(k[3])}` : `C${pt(k[1])} ${pt(k[2])} ${pt(k[3])}`;
  }
  return out + 'Z';
}

export function airpodsOpen(sharp) {
  const key = sharp ? 'sharp' : 'regular';
  const rt = sharp ? 0 : 1, rb = sharp ? 0 : 5;
  const body = roundRect(2, 9, 22, 21, rt, rb);
  const hinge = sharp ? [L([8, 9], [8, 10]), L([8, 10], [16, 10]), L([16, 10], [16, 9])]
    : [A([9, 9], 1, 180, 90), L([9, 10], [15, 10]), A([15, 9], 1, 90, 0)];
  const light = dotD([12, 14], 1);
  const bodySolid = clipClosed(plateOf(body), [0, 10], [0, 1], 0, 1);
  const xo = Math.sqrt(3);
  const notch = sharp
    ? [L([7, 10], [7, 10]), A([8, 10], 1, 180, 90), L([8, 11], [16, 11]), A([16, 10], 1, 90, 0), L([17, 10], [7, 10])]
    : [A([9, 9], 2, ang([9, 9], [9 - xo, 10]), 90), L([9, 11], [15, 11]), A([15, 9], 2, 90, ang([15, 9], [15 + xo, 10])), L([15 + xo, 10], [9 - xo, 10])];
  const notchSegs = notch.filter((g) => g.type === 'A' || len(sub(g.p1, g.p0)) > 1e-9);
  const lightHole = [A([12, 14], 1, 0, 90), A([12, 14], 1, 90, 180), A([12, 14], 1, 180, 270), A([12, 14], 1, 270, 360)];

  let lidD, plateD, lidSolidD;
  if (sharp) {
    const lid = [L([3, 9], [3, 3]), L([3, 3], [21, 3]), L([21, 3], [21, 9])];
    lidD = contourPath(lid, false);
    // every convex corner on r=1, the two steps where lid meets body closing to points
    const plateSegs = [L([1, 21], [1, 9]), A([2, 9], 1, 180, 270), L([2, 8], [2, 3]), A([3, 3], 1, 180, 270), L([3, 2], [21, 2]), A([21, 3], 1, 270, 360),
      L([22, 3], [22, 8]), A([22, 9], 1, 270, 360), L([23, 9], [23, 21]), A([22, 21], 1, 0, 90), L([22, 22], [2, 22]), A([2, 21], 1, 90, 180)];
    const silSegs = [L([2, 21], [2, 9]), L([2, 9], [3, 9]), ...lid, L([21, 9], [22, 9]), L([22, 9], [22, 21]), L([22, 21], [2, 21])].filter((g) => len(sub(g.p1, g.p0)) > 1e-9);
    verify(silSegs, plateSegs, 1);
    plateD = contourPath(plateSegs);
    lidSolidD = contourPath(clipClosed(plateOf([...lid, L([21, 9], [3, 9])]), [0, 8], [0, 1], 0, -1));
  } else {
    lidD = LID;
    // the silhouette: the body with his lid standing on its top edge, as M/L/C
    const sil = 'M2 16L2 10C2 9.4477 2.4477 9 3 9L3.7961 9' + LID.replace(/^M[-\d. ]+/, '') +
      'L21 9C21.5523 9 22 9.4477 22 10L22 16C22 18.7614 19.7614 21 17 21L7 21C4.2386 21 2 18.7614 2 16Z';
    const fine = refineCubics(sil);
    plateD = dropSpecks(trimInset(offsetPathC(fine, 1), fine, 1));
    const chk = verifyC(fine, plateD, 1);
    if (!chk.ok) throw new Error(`airpods-open plate off by ${chk.worst.toFixed(4)}`);
    // above the seam's ink the plate is the lid's offset and nothing else
    lidSolidD = clipY(plateD, 8, true);
  }
  const strokes = contourPath(body) + lidD + contourPath(hinge, false);
  return {
    box: [1, 2, 23, 22],
    variants: {
      [`stroke.${key}`]: [S(strokes), F(light)],
      [`duotone.${key}`]: [P(plateD), S(strokes), F(light)],
      [`fill.${key}`]: [F(lidSolidD + contourPath(bodySolid) + holeOf(bodySolid, notchSegs) + holeOf(bodySolid, lightHole))],
    },
  };
}

/* ----------------------------------------------------------------- lungs */

/**
 * `lungs`, his 13 Sep drawing on circles. Each lobe is four pieces joined
 * tangent where his are smooth: the medial wall, a line leaning in toward the
 * base as his bows; the shoulder, an r=3 circle tangent to that wall that peaks
 * on y=10 beside the bronchus; the lateral wall, the circle tangent to x=2 and
 * internally tangent to the shoulder that runs down to the base; and the base, a
 * line falling toward the outside as his does, on r=1 at both corners (sharp:
 * the crossings). The bronchi leave the trachea's foot at (12, 6) and end ON the
 * shoulders along their radii; the fold leaves the medial wall at y=14 and
 * curls down toward the lateral wall, his bronchiole.
 *
 * Duotone: a plate per lobe, the airway over them. Fill: the lobes solid, the
 * airway stroked, and each fold knocked out as a line from its free end to the
 * medial wall's inner ink (dropped for a round on 13 Sep, back on his word).
 */
import { filletLineArc } from '../v5/geom.mjs';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';
export const LUNG = { wallTop: [10, 12], lean: 1 / 9, footY: 21, rs: 2, peak: 10, lateralY: 18, baseSlope: 0.25 };
export function lungLobe(sharp, g = LUNG) {
  const u = unit([-g.lean, 1]);                              // down the medial wall
  const side = [-u[1], u[0]][0] < 0 ? [-u[1], u[0]] : [u[1], -u[0]];   // into the lobe, leftward
  const yS = g.peak + g.rs;
  const onWall = add(g.wallTop, mul(u, (yS - g.wallTop[1]) / u[1]));
  const Cs = [onWall[0] + g.rs / side[0] * 1, yS];
  const perp = (q) => (q[0] - g.wallTop[0]) * side[0] + (q[1] - g.wallTop[1]) * side[1];
  if (Math.abs(perp(Cs) - g.rs) > 1e-9) throw new Error('lung shoulder off the wall');
  // lateral circle: leftmost on (2, lateralY), internally tangent to the shoulder
  const dx0 = Cs[0] - 2, dy0 = Cs[1] - g.lateralY;
  const R = (dx0 * dx0 + dy0 * dy0 - g.rs * g.rs) / (2 * (dx0 - g.rs));
  const Co = [2 + R, g.lateralY];
  const foot = add(g.wallTop, mul(u, (g.footY - g.wallTop[1]) / u[1]));
  const baseDir = unit([-1, g.baseSlope]);                   // from the foot toward the outside, falling
  // outer corner: the base line meets the lateral circle on its lower left
  const q = sub(foot, Co), bq = 2 * (q[0] * baseDir[0] + q[1] * baseDir[1]), cq = q[0] * q[0] + q[1] * q[1] - R * R;
  const tc = (-bq + Math.sqrt(bq * bq - 4 * cq)) / 2;
  const corner = add(foot, mul(baseDir, tc));
  const rf = sharp ? 0 : 1;
  const wallTangent = add(Cs, mul(side, -g.rs));
  const shoulderLat = add(Cs, mul(unit(sub(Cs, Co)), g.rs));
  const segs = [];
  if (rf) {
    const V = foot, uIn = mul(u, -1), uB = baseDir;
    const alpha = Math.acos(Math.max(-1, Math.min(1, uIn[0] * uB[0] + uIn[1] * uB[1])));
    const t = rf / Math.tan(alpha / 2);
    const footA = add(V, mul(uIn, t)), footB = add(V, mul(uB, t));
    const Ff = add(V, mul(unit(add(uIn, uB)), rf / Math.sin(alpha / 2)));
    const up = [baseDir[1], -baseDir[0]][1] < 0 ? [baseDir[1], -baseDir[0]] : [-baseDir[1], baseDir[0]];
    const fl = filletLineArc(corner, mul(baseDir, -1), up, Co, R, rf);
    segs.push(L(wallTangent, footA));
    let a0 = ang(Ff, footA), a1 = ang(Ff, footB); while (a1 - a0 > 180) a1 -= 360; while (a0 - a1 > 180) a1 += 360;
    segs.push(A(Ff, rf, a0, a1));
    segs.push(L(footB, fl.T));
    let b0 = ang(fl.F, fl.T), b1 = ang(fl.F, fl.A); while (b1 - b0 > 180) b1 -= 360; while (b0 - b1 > 180) b1 += 360;
    segs.push(A(fl.F, rf, b0, b1));
    let c0 = ang(Co, fl.A), c1 = ang(Co, shoulderLat); while (c1 < c0) c1 += 360;
    segs.push(A(Co, R, c0, c1));
  } else {
    segs.push(L(wallTangent, foot), L(foot, corner));
    let c0 = ang(Co, corner), c1 = ang(Co, shoulderLat); while (c1 < c0) c1 += 360;
    segs.push(A(Co, R, c0, c1));
  }
  let s0 = ang(Cs, shoulderLat), s1 = ang(Cs, wallTangent); while (s1 < s0) s1 += 360;
  segs.push(A(Cs, g.rs, s0, s1));
  return { segs: segs.filter((q2) => q2.type === 'A' ? Math.abs(q2.a1 - q2.a0) > 1e-7 : len(sub(q2.p1, q2.p0)) > 1e-9), Cs, Co, R, u, side, corner, foot };
}
function arc3(p0, p1, p2) {
  const ax = p0[0], ay = p0[1], bx = p1[0], by = p1[1], cx = p2[0], cy = p2[1];
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const c = [ux, uy], r = len(sub(p0, c));
  let a0 = ang(c, p0), am = ang(c, p1), a1 = ang(c, p2);
  // sweep through the middle point
  const within = (a, b, m) => { const n = (x) => ((x % 360) + 360) % 360; return n(m - a) < n(b - a); };
  if (within(a0, a1, am)) { while (a1 < a0) a1 += 360; } else { while (a1 > a0) a1 -= 360; }
  return A(c, r, a0, a1);
}
export function lungs(sharp) {
  const key = sharp ? 'sharp' : 'regular';
  const box = [1, 1, 23, 23];
  let lo = 18, hi = 23;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; const b = strokedBBox(contourPath(lungLobe(sharp, { ...LUNG, footY: m }).segs), 1, sharp ? 'butt' : 'round')[3]; if (b > 23) hi = m; else lo = m; }
  const G = { ...LUNG, footY: lo };
  const lobe = lungLobe(sharp, G);
  const leftSegs = lobe.segs;
  const rightSegs = mirrorSegs(leftSegs).reverse().map(rev);
  const fork = [12, 6];
  const E = add(lobe.Cs, mul(unit(sub(fork, lobe.Cs)), G.rs));
  const trachea = openRun([L([12, 2], fork)], sharp, [true, false], box);
  const bronchi = `M${pt(fork)}L${pt(E)}M${pt(fork)}L${pt([24 - E[0], E[1]])}`;
  const wy = (y) => add(G.wallTop, mul(lobe.u, (y - G.wallTop[1]) / lobe.u[1]));
  const f0 = wy(14), foldArc = arc3(f0, [8.4, 14.45], [7.1, 15.5]);
  const fold = openRun([foldArc], sharp, [false, true], box);
  const foldR = openRun(mirrorSegs([foldArc]), sharp, [false, true], box);
  const lobesD = contourPath(leftSegs) + contourPath(rightSegs);
  const plates = [plateOf(leftSegs), plateOf(rightSegs)];
  const airway = trachea + bronchi;
  const strokes = lobesD + airway + fold + foldR;
  // the fold's knockout: its band from the free end back to the medial wall's inner ink, closed
  // along that ink, so the rim stays 2 thick and the fold reads as a line inside the solid
  const slot = foldSlotOnWall(foldArc, add(G.wallTop, lobe.side), lobe.u, sharp, box);
  return {
    box,
    lobe,
    variants: {
      [`stroke.${key}`]: [S(strokes)],
      [`duotone.${key}`]: [P(plates.map((q) => contourPath(q)).join('')), S(strokes)],
      [`fill.${key}`]: [F(contourPath(plates[0]) + holeOf(plates[0], slot) + contourPath(plates[1]) + holeOf(plates[1], mirrorSegs(slot).reverse().map(rev))), S(airway)],
    },
  };
}

/** A fold arc's band (half width 1) from its free end back to a line (P0 + t u), closed along it. */
function foldSlotOnWall(arc, P0, u, sharp, box) {
  const { c, r, a0, a1 } = arc;
  const s = Math.sign(a1 - a0);
  const norm = (x) => ((x % 360) + 360) % 360;
  const cross = (rho) => {
    const w = sub(P0, c), b = u[0] * w[0] + u[1] * w[1], k = w[0] * w[0] + w[1] * w[1] - rho * rho;
    const disc = b * b - k;
    if (disc < 0) throw new Error('fold band misses the wall ink');
    const pts = [-b + Math.sqrt(disc), -b - Math.sqrt(disc)].map((t) => add(P0, mul(u, t)));
    // the crossing that lies on the arc's own sweep, nearest its start
    const along = (q) => norm((ang(c, q) - a0) * s);
    return pts.filter((q) => along(q) < Math.abs(a1 - a0)).reduce((p, q) => (along(q) < along(p) ? q : p));
  };
  const Qo = cross(r + 1), Qi = cross(r - 1);
  const sweep = (q) => a0 + s * norm((ang(c, q) - a0) * s);
  const E = on(c, r, a1), tan = mul([-Math.sin(rad(a1)), Math.cos(rad(a1))], s);
  const Po = on(c, r + 1, a1), Pi = on(c, r - 1, a1);
  const segs = [A(c, r + 1, sweep(Qo), a1)];
  if (sharp) {
    const k = sharpEndIn(E, tan, box);
    segs.push(L(Po, add(Po, mul(tan, k))), L(add(Po, mul(tan, k)), add(Pi, mul(tan, k))), L(add(Pi, mul(tan, k)), Pi));
  } else {
    const t0 = ang(E, Po), tMid = (Math.atan2(tan[1], tan[0]) * 180) / Math.PI;
    segs.push(A(E, 1, t0, t0 + 180 * (norm(tMid - t0) < 180 ? 1 : -1)));
  }
  segs.push(A(c, r - 1, a1, sweep(Qi)), L(Qi, Qo));
  return segs;
}

/* ----------------------------------------------------------- thermometers */

/**
 * The tube thermometer, the batch's `thermometer` as it was: a tube of half
 * width `w` capped round at the top (ink 1), a bulb of radius R at the foot
 * (ink 23) joined on the r=1 concave fillet (sharp: the crossing), a bead at the
 * bulb's centre and a column rising from it. Returned in parts so the level
 * family and the compounds share one body.
 *
 * `panel` is the tube's inner ink above the bulb, its corners on the fillet's
 * own inner radius (2, or 1 about the crossing in sharp). The fills no longer
 * open it (see `tubeFill`); it stays for the alternates.
 */
export function tubeThermo({ cx = 12, w = 4, R = 6, sharp }) {
  const cap = [cx, 2 + w], yb = 22 - R, Cb = [cx, yb];
  const rf = sharp ? 0 : 1;
  const segs = [A(cap, w, 180, 360)];
  let jR, FR = null;
  if (rf) {
    FR = [cx + w + rf, yb - Math.sqrt((R + rf) ** 2 - (w + rf) ** 2)];
    const Tw = [cx + w, FR[1]], Tb = add(Cb, mul(unit(sub(FR, Cb)), R));
    segs.push(L([cx + w, cap[1]], Tw), A(FR, rf, 180, ang(FR, Tb)));
    jR = Tb;
  } else {
    jR = [cx + w, yb - Math.sqrt(R * R - w * w)];
    segs.push(L([cx + w, cap[1]], jR));
  }
  const jL = [2 * cx - jR[0], jR[1]];
  let b0 = ang(Cb, jR), b1 = ang(Cb, jL); while (b1 < b0) b1 += 360;
  segs.push(A(Cb, R, b0, b1));
  if (rf) {
    const FL = [2 * cx - FR[0], FR[1]];
    let a0 = ang(FL, jL), a1 = 360; while (a1 - a0 > 180) a1 -= 360;
    segs.push(A(FL, rf, a0, a1), L([cx - w, FL[1]], [cx - w, cap[1]]));
  } else segs.push(L(jL, [cx - w, cap[1]]));
  // panel
  const ri = R - 1, cr = sharp ? 1 : 2;
  const CR = sharp ? jR : FR, CL = [2 * cx - CR[0], CR[1]];
  const tR = add(Cb, mul(unit(sub(CR, Cb)), ri)), tL = [2 * cx - tR[0], tR[1]];
  const panel = [A(cap, w - 1, 180, 360), L([cx + w - 1, cap[1]], [cx + w - 1, CR[1]])];
  let p0 = 180, p1 = ang(CR, tR); while (p1 - p0 > 180) p1 -= 360; while (p0 - p1 > 180) p1 += 360;
  panel.push(A(CR, cr, p0, p1), L(tR, tL));
  let q0 = ang(CL, tL), q1 = 0; while (q1 - q0 > 180) q1 -= 360; while (q0 - q1 > 180) q1 += 360;
  panel.push(A(CL, cr, q0, q1), L([cx - w + 1, CL[1]], [cx - w + 1, cap[1]]));
  return { segs, cap, Cb, yb, w, R, cx, panel: panel.filter((g) => g.type === 'A' ? Math.abs(g.a1 - g.a0) > 1e-7 : len(sub(g.p1, g.p0)) > 1e-9) };
}
const beadD = (c) => dotD(c, 1.5);
const circleSegs = (c, r) => [A(c, r, 0, 90), A(c, r, 90, 180), A(c, r, 180, 270), A(c, r, 270, 360)];
const woundAs = (plate, segs) => contourPath(windingOf(plate) === windingOf(segs) ? segs : [...segs].reverse().map(rev));

/**
 * A tube thermometer's fill, on his 13 Sep reference: the silhouette solid, a
 * ring 2 wide knocked out about the bead (the bead's ink 1.5 plus the house 2,
 * so 3.5), the bead left solid inside it, and the column's own band knocked out
 * rising from the ring to `top`, ended as the stroke ends it (a round cap, or
 * the sharp stub's butt face). Ring and band are one knockout. The earlier fill
 * opened the whole tube above the bulb and read as a padlock.
 */
const RING = 3.5;
function tubeFill(t, plate, top, sharp, box = [1, 1, 23, 23]) {
  const { cx, Cb } = t;
  const bead = woundAs(plate, circleSegs(Cb, 1.5));
  if (top === null) return holeOf(plate, circleSegs(Cb, RING)) + bead;
  const yj = Cb[1] - Math.sqrt(RING * RING - 1);          // the band's walls meet the ring
  const k = [];
  if (sharp) {
    const face = top - sharpEndIn([cx, top], [0, -1], box);
    k.push(L([cx + 1, yj], [cx + 1, face]), L([cx + 1, face], [cx - 1, face]), L([cx - 1, face], [cx - 1, yj]));
  } else {
    k.push(L([cx + 1, yj], [cx + 1, top]), A([cx, top], 1, 0, -180), L([cx - 1, top], [cx - 1, yj]));
  }
  k.push(A(Cb, RING, ang(Cb, [cx - 1, yj]) + 360, ang(Cb, [cx + 1, yj])));
  return holeOf(plate, k) + bead;
}

/**
 * `temperature-empty`, `-quarter`, `-half`, `-full`: the tube thermometer (w=4,
 * R=6, 14 x 22, 5 clear each side) read at four levels. The bulb was 5.5 until
 * 13 Sep, which painted a padding of 5.5 and he wants whole numbers. Full puts
 * the column's cap 2 below the tube's inner ink at 3, on y=6; half and quarter
 * sit on 9 and 11, above where the tube's straight run meets the bulb's fillet
 * (11.1). Empty is the bead alone.
 */
export const LEVELS = { empty: null, quarter: 11, half: 9, full: 6 };
function levelVariants(sharp, level, extra = null) {
  const key = sharp ? 'sharp' : 'regular';
  const t = tubeThermo({ sharp, ...(extra?.body || {}) });
  const plate = plateOf(t.segs);
  const col = level === null ? '' : openRun([L(t.Cb, [t.cx, level])], sharp, [false, true], [1, 1, 23, 23]);
  const bead = beadD(t.Cb);
  const body = contourPath(t.segs);
  const more = extra?.strokes || '', morePlate = extra?.plates || '', moreFill = extra?.fills || '';
  return {
    [`stroke.${key}`]: [S(body + col + more), F(bead)],
    [`duotone.${key}`]: [P(contourPath(plate) + morePlate), S(body + col + more), F(bead)],
    [`fill.${key}`]: [F(contourPath(plate) + tubeFill(t, plate, level, sharp) + moreFill), ...(extra?.fillStrokes ? [S(extra.fillStrokes)] : [])],
  };
}
export const temperature = (level) => (sharp) => ({ box: [5, 1, 19, 23], variants: levelVariants(sharp, LEVELS[level]) });

/**
 * `temperature-high`: the thermometer at three quarters (7.5) with the degree
 * mark beside its top, an r=3 ring (the set's badge ring) standing 2 clear of
 * the tube. The body moves left so the pair fills the box: the body's ink on 1,
 * the ring's on 23.
 */
export function temperatureHigh(sharp) {
  const cx = 8, ring = [cx + 11, 5];
  const ringSegs = [A(ring, 3, 0, 90), A(ring, 3, 90, 180), A(ring, 3, 180, 270), A(ring, 3, 270, 360)];
  const ringD = contourPath(ringSegs);
  const ringPlate = plateOf(ringSegs);
  return {
    box: [1, 1, 23, 23],
    variants: levelVariants(sharp, 7.5, { body: { cx }, strokes: ringD, plates: contourPath(ringPlate), fills: '', fillStrokes: ringD }),
  };
}

/**
 * `thermometer`, the clinical stick, on the free diagonal: a capsule of half
 * width 3 with its cap up and right, a tip 5 long running out of its lower end
 * along the axis (3 read as a stub, his word 13 Sep), and three ticks on its upper wall, 2 long into a 4-wide interior so
 * each ends 2 clear of the far wall, on a pitch of 4. Drawn upright in its own
 * frame and turned 45 degrees; the capsule's length is solved so the painted
 * box is 1..23 both ways.
 *
 * Fill: the capsule solid with the ticks knocked out from the wall's inner ink,
 * the tip stroked. Duotone: the capsule's plate.
 */
function motion45(O) {
  const c = Math.SQRT1_2, s = Math.SQRT1_2;
  const P = (p) => [O[0] + c * p[0] - s * p[1], O[1] + s * p[0] + c * p[1]];
  const G = (g) => (g.type === 'L' ? L(P(g.p0), P(g.p1)) : A(P(g.c), g.r, g.a0 + 45, g.a1 + 45));
  return { P, G };
}
function stickParts(sharp, len0, O) {
  const hw = 3, tip = 5;
  const m = motion45(O);
  // frame: +y down the stick toward the tip; the cap centre on (0, 0)
  const body = [A([0, 0], hw, 180, 360), L([hw, 0], [hw, len0]), A([0, len0], hw, 0, 180), L([-hw, len0], [-hw, 0])].map(m.G);
  const tipSeg = [L([0, len0 + hw], [0, len0 + hw + tip])].map(m.G);
  const ticks = [1, 5, 9].map((y) => [L([-hw, y], [-hw + 2, y])].map(m.G));
  const holes = [1, 5, 9].map((y) => {
    // the tick's band from the wall's inner ink to its round end (or butt end in sharp)
    const x0 = -hw + 1, x1 = -hw + 2;
    const seg = sharp
      // the tick runs at 45 degrees in the world, so its butt end sits sqrt 2 - 1 past the round one's centre
      ? (() => { const e = x1 + Math.SQRT2 - 1; return [L([x0, y - 1], [e, y - 1]), L([e, y - 1], [e, y + 1]), L([e, y + 1], [x0, y + 1]), L([x0, y + 1], [x0, y - 1])]; })()
      : [L([x0, y - 1], [x1, y - 1]), A([x1, y], 1, -90, 90), L([x1, y + 1], [x0, y + 1]), L([x0, y + 1], [x0, y - 1])];
    return seg.map(m.G);
  });
  return { body, tipSeg, ticks, holes };
}
export function thermometerStick(sharp) {
  const key = sharp ? 'sharp' : 'regular';
  const box = [1, 1, 23, 23];
  // solve the length and origin so the ink is 1..23: the shape is symmetric about the anti-diagonal
  const inkOf = (len0, O) => {
    const p = stickParts(false, len0, O);
    const d = contourPath(p.body) + contourPath(p.tipSeg, false);
    return strokedBBox(d, 1, 'round');
  };
  let lo = 4, hi = 30, O = [0, 0], len0 = 10;
  for (let i = 0; i < 60; i++) {
    const mlen = (lo + hi) / 2;
    const b = inkOf(mlen, [0, 0]);
    if (b[2] - b[0] > 22) hi = mlen; else lo = mlen;
  }
  len0 = lo;
  const b0 = inkOf(len0, [0, 0]);
  O = [1 - b0[0], 1 - b0[1]];
  const p = stickParts(sharp, len0, O);
  const body = contourPath(p.body);
  const tipD = openRun(p.tipSeg, sharp, [false, true], box);
  const ticksD = p.ticks.map((t) => openRun(t, sharp, [false, true], box)).join('');
  const plate = plateOf(p.body);
  const holes = p.holes.map((h) => holeOf(plate, h)).join('');
  return {
    box,
    variants: {
      [`stroke.${key}`]: [S(body + tipD + ticksD)],
      [`duotone.${key}`]: [P(contourPath(plate)), S(body + tipD + ticksD)],
      [`fill.${key}`]: [F(contourPath(plate) + holes), S(tipD)],
    },
  };
}

/**
 * `thermometer-sun` and `thermometer-snowflake`: the tube thermometer made
 * slim (w=3, R=4.5, the bead alone, since a 6-wide tube has no room for a column
 * at the house gap) standing flush right, with the weather on its left.
 *
 * The sun is the set's `sun` at a smaller size: a disc of r=2.5 with rays from
 * 6.5 to 8, 2 clear of it (a shorter ray leaves a butt cap less run than its width), showing only its left half, the disc opening where it
 * would come within 2 of the tube or the bulb and the ray that would point at
 * the bulb left off. The snowflake is described at `thermometerSnowflake`.
 */
const SLIM = { cx: 17.5, w: 3, R: 4.5 };
function slimVariants(sharp, strokesD) {
  const key = sharp ? 'sharp' : 'regular';
  const t = tubeThermo({ sharp, ...SLIM });
  const plate = plateOf(t.segs);
  const body = contourPath(t.segs), bead = beadD(t.Cb);
  return {
    [`stroke.${key}`]: [S(body + strokesD), F(bead)],
    [`duotone.${key}`]: [P(contourPath(plate)), S(body + strokesD), F(bead)],
    // no column in the stroke, but the fill has room for the band: it rises to the cap's centre,
    // so the cap's solid is 3 thick like the walls
    [`fill.${key}`]: [F(contourPath(plate) + tubeFill(t, plate, t.cap[1], sharp)), S(strokesD)],
  };
}
export function thermometerSun(sharp) {
  const box = [1, 1, 23, 23];
  const C = [10, 10], DR = 2.5, RAY = [6.5, 8];
  const t = tubeThermo({ sharp: false, ...SLIM });
  const tubeInk = SLIM.cx - SLIM.w - 1;
  // the ink an arc end paints: its disc (regular) or the corners of its stubbed butt cap (sharp)
  const endInk = (a, out) => {
    const p = on(C, DR, a), dir = [out * -Math.sin(rad(a)), out * Math.cos(rad(a))];
    if (!sharp) return { pts: [p], reach: 1 };
    const q = add(p, mul(dir, sharpEndIn(p, dir, box))), n = [Math.cos(rad(a)), Math.sin(rad(a))];
    return { pts: [add(q, n), sub(q, n)], reach: 0 };
  };
  const clear = (a, out) => {
    const { pts, reach } = endInk(a, out);
    // the ray straight up paints down to 6 from the centre (its cap, or its stub's face)
    const rayFoot = [C[0], C[1] - (RAY[0] - 1)];
    const toRay = (q) => (q[1] < rayFoot[1] ? Math.abs(q[0] - C[0]) - 1 : len(sub(q, [C[0], rayFoot[1] + 0])) - 0) ;
    return Math.min(...pts.map((q) => Math.min(len(sub(q, t.Cb)) - (t.R + 1), tubeInk - q[0], toRay(q)) - reach)) - 2;
  };
  // the disc opens where either end would come within 2 of the tube or the bulb
  let lo = 40, hi = 150;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (clear(m, -1) < 0) lo = m; else hi = m; }
  const aLow = hi;
  lo = 210; hi = 330;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (clear(m, 1) < 0) hi = m; else lo = m; }
  const aHigh = lo;
  const disc = openRun([A(C, DR, aLow, aHigh)], sharp, [true, true], box);
  const rays = [135, 180, 225, 270].map((a) => openRun([L(on(C, RAY[0], a), on(C, RAY[1], a))], sharp, [true, true], box)).join('');
  return { box, variants: slimVariants(sharp, disc + rays) };
}
/**
 * The snowflake, redrawn 13 Sep 2026 on his word ("ours looks very off"): the
 * old one crowded its arms with 1.5 vees part way along, and a vee that close
 * to an arm's tip clots into a knob. Now three lines through the hub on a 60
 * degree pitch. Toward the weather each runs D and ends in a fork of two
 * B = 2.5 branches opened 90 degrees, nothing past the fork, so every prong is
 * clear. Toward the thermometer each is a stub, so the hub reads as a star and
 * not an arrowhead.
 *
 * Neighbouring forks' facing ends sit D - 2B sin 15 apart, so D = 4 + 2B sin 15
 * leaves them exactly 2 clear; the left fork's ends reach x = 1, which puts the
 * hub on 2 + D + B/sqrt 2 = 9.06, and the stubs run until the level one's cap is
 * 2 clear of the tube's ink at 13.5.
 */
export function thermometerSnowflake(sharp) {
  const box = [1, 1, 23, 23];
  const B = 2.5, D = 4 + 2 * B * Math.sin(rad(15));
  const C = [2 + D + B * Math.SQRT1_2, 12];
  const s = SLIM.cx - SLIM.w - 1 - 2 - 1 - C[0];
  let d = '';
  for (const a of [120, 180, 240]) {
    const F0 = on(C, D, a);
    d += openRun([L(on(C, s, a + 180), F0)], sharp, [true, false], box);
    d += openRun([L(on(F0, B, a - 45), F0), L(F0, on(F0, B, a + 45))], sharp, [true, true], box);
  }
  return { box, variants: slimVariants(sharp, d) };
}

/* --------------------------------------------------------------- earbuds */

/**
 * `earbuds`, redrawn 13 Sep 2026 on his references: a mirrored pair of stemmed
 * buds, a 9 and a P. Each head is an r=4 circle whose outer side puts the ink on
 * 1; the stem is 4 wide on the head's inner half, its inner wall running
 * straight up to where it is tangent to the head, its outer wall leaving the
 * head's foot on the r=1 concave fillet (sharp: the crossing, which is the
 * circle's lowest point). The stem runs 10 below the head's centre and ends in a
 * half round of r=2 with a tip line across it 2 above (the first cut ran 12 and
 * read as long legs, 8 read too short; his words), and a dot of r=1 sits at the
 * head's centre, 2 clear of the head's and the wall's inner ink. The inner walls
 * stand on 10 and 14, so the two buds are 2 apart: 22 x 20 on 1..23 by 2..22.
 *
 * Duotone: a plate per bud. Fill: each bud solid above the tip line's band and
 * its tip solid below it, the gap between them the line; the dot knocked out.
 */
export const BUD = { head: [6, 7], R: 4, wall: [6, 10], tip: 17, base: 19, rb: 2 };
function budLeft(sharp) {
  const { head: C, R, wall, base, rb } = BUD;
  const segs = [L([wall[1], base], [wall[1], C[1]])];
  if (sharp) {
    segs.push(A(C, R, 0, -270), L([wall[0], C[1] + R], [wall[0], base]));
  } else {
    const F = [wall[0] - 1, C[1] + Math.sqrt((R + 1) ** 2 - (C[0] - (wall[0] - 1)) ** 2)];
    const At = add(C, mul(sub(F, C), R / (R + 1)));
    segs.push(A(C, R, 0, ang(C, At) - 360), A(F, 1, ang(F, At), 0), L([wall[0], F[1]], [wall[0], base]));
  }
  segs.push(A([(wall[0] + wall[1]) / 2, base], rb, 180, 0));
  return segs;
}
export function earbuds(sharp) {
  const key = sharp ? 'sharp' : 'regular';
  const { head: C, wall, tip } = BUD;
  const left = budLeft(sharp);
  const right = mirrorSegs(left).reverse().map(rev);
  const buds = [left, right];
  const plates = buds.map(plateOf);
  const dots = [C, [24 - C[0], C[1]]];
  const tips = `M${pt([wall[0], tip])}L${pt([wall[1], tip])}M${pt([24 - wall[1], tip])}L${pt([24 - wall[0], tip])}`;
  const strokes = buds.map((b) => contourPath(b)).join('') + tips;
  const dotsD = dots.map((c) => dotD(c, 1)).join('');
  const fill = plates.map((p, i) => {
    const body = clipClosed(p, [0, tip - 1], [0, 1], 0, -1);
    const cap = clipClosed(p, [0, tip + 1], [0, 1], 0, 1);
    return contourPath(body) + holeOf(body, circleSegs(dots[i], 1)) + contourPath(cap);
  }).join('');
  return {
    box: [1, 2, 23, 22],
    variants: {
      [`stroke.${key}`]: [S(strokes), F(dotsD)],
      [`duotone.${key}`]: [P(plates.map((p) => contourPath(p)).join('')), S(strokes), F(dotsD)],
      [`fill.${key}`]: [F(fill)],
    },
  };
}
