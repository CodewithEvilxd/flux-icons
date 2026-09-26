/**
 * Emit the 1.0.0 ideas batch into raw/ (or --out=DIR/raw).
 *   node tools/ideas-1-0-0/build.mjs [--out=DIR] [name ...]
 *
 * Twenty-nine names drawn from his screenshot ideas of 17 Sep 2026, some fitted to
 * his own SVGs (airplay, smartphone-cast, hard-drive, accessibility). Where a name is a
 * compound on a shipped base (file-check, message-plus, message-square-plus,
 * shield-check, map-pin, user-check, rotate-cw, audio-lines, credit-card-2) the base's own raw files
 * supply its plates and sharp half, so the base and its compounds cannot drift;
 * everything drawn fresh is lines and circular arcs, so every plate is
 * `offsetContour` at 1 and every knockout is `outlineRun`, both exact.
 *
 * Styles follow the 1.0.0 rules in the skill: two-tone is the stroke over its
 * plate; duotone is the plate grey with the detail black (front black over back
 * grey, scaffolding grey, the stroke drawing for a one-shape icon); fill is the
 * plate with the detail knocked out and signs outside a body left as strokes.
 * An open glyph owes no plate, so its two-tone and duotone grey one part.
 *
 * Sharp squares every fillet, pushes every free line end out by the cut rule,
 * puts a unit stub on every free arc end, leaves T-junction ends and shape arcs
 * alone, and asserts both treatments paint one box.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Path, polyContour, circlePath, onArc, add, sub, mul, len, unit, dot } from '../v5/geom.mjs';
import { offsetContour, contourPath, verify, clipContour } from '../v5/offset.mjs';
const segStart = (s) => (s.type === 'L' ? s.p0 : onArc(s.c, s.r, s.a0));
const segEnd = (s) => (s.type === 'L' ? s.p1 : onArc(s.c, s.r, s.a1));
import { outlineRun, unionContours, subtractContours } from '../v6/outline.mjs';
import { sharpEndIn, sparkleStar } from '../v5/icons.mjs';
import { strokedBBox } from '../../pipeline/lib/geom.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const rad = (a) => (a * Math.PI) / 180;
const rot = (p, c, a) => { const s = Math.sin(rad(a)), k = Math.cos(rad(a)); const x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * k - y * s, c[1] + x * s + y * k]; };
const f4 = (v) => { if (!Number.isFinite(v)) throw new Error(`non-finite ${v}`); const r = Math.round(v * 1e4) / 1e4; return String(Object.is(r, -0) ? 0 : r); };
const P2 = (p) => `${f4(p[0])} ${f4(p[1])}`;

function solve(fn, target, lo, hi, it = 80) {
  const s = Math.sign(fn(hi) - fn(lo));
  if (!s) throw new Error('solve: flat');
  for (let i = 0; i < it; i++) { const m = (lo + hi) / 2; if ((fn(m) - target) * s > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}

/* ------------------------------------------------------------ primitives */

/** An open run with fillets; sharp drops the fillets and pushes free ends out. */
function run(pts, radii = [], { sharp = false, free = [false, false], box = [1, 1, 23, 23], keep = false } = {}) {
  const Q = pts.map((p) => [...p]);
  const n = Q.length;
  if (sharp && free[0]) { const d = unit(sub(Q[0], Q[1])); Q[0] = add(Q[0], mul(d, sharpEndIn(Q[0], d, box))); }
  if (sharp && free[1]) { const d = unit(sub(Q[n - 1], Q[n - 2])); Q[n - 1] = add(Q[n - 1], mul(d, sharpEndIn(Q[n - 1], d, box))); }
  const p = new Path().M(Q[0]);
  for (let i = 1; i < n - 1; i++) p.corner(Q[i], Q[i + 1], sharp && !keep ? 0 : radii[i] || 0);
  p.L(Q[n - 1]);
  return p;
}
const closed = (pts, radii, sharp) => polyContour(pts, sharp ? pts.map(() => 0) : radii);
const ring = (c, r) => ({ d: circlePath(c, r), segs: [{ type: 'A', c, r, a0: 0, a1: 360 }] });
const segsD = (segs) => contourPath(segs, false);

/** The plate of a closed contour: offset a unit and verified sample by sample. */
function plate(segs) {
  const off = offsetContour(segs.map((s) => ({ ...s })), 1);
  verify(segs, off, 1, 0.003);
  return contourPath(off);
}
/** A stroked run's ink as one closed contour. */
const capsule = (segs, sharp) => contourPath(outlineRun(segs.map((s) => ({ ...s })), 1, sharp ? 'butt' : 'round'));
/** Several crossing runs' ink as one outline. */
function inkUnion(runs, sharp) {
  const cap = sharp ? 'butt' : 'round';
  const loops = unionContours(runs.map((r) => outlineRun(r.map((s) => ({ ...s })), 1, cap)), runs, 1, cap);
  return loops.map((l) => contourPath(l)).join('');
}
const rect = (x0, y0, x1, y1) => `M${P2([x0, y0])}L${P2([x1, y0])}L${P2([x1, y1])}L${P2([x0, y1])}Z`;
const polyD = (pts) => `M${P2(pts[0])}` + pts.slice(1).map((q) => `L${P2(q)}`).join('') + 'Z';


/* --------------------------------------------------------------- winding */

/**
 * Wind every subpath of a solid by its depth, outer clockwise and each hole
 * against the shape it sits in, so non-zero and even-odd paint one picture.
 * Figma fills even-odd and a browser non-zero; a hole wound with its outline
 * is a white nick in one and solid in the other.
 */
function subpathPts(sp) {
  const pts = [];
  let cur = null;
  for (const m of sp.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const v = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
    if (m[1] === 'M' || m[1] === 'L') { cur = [v[0], v[1]]; pts.push(cur); }
    else if (m[1] === 'C') {
      const p0 = cur;
      for (let i = 1; i <= 12; i++) { const t = i / 12, u = 1 - t; pts.push([0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * v[k] + 3 * u * t * t * v[k + 2] + t * t * t * v[k + 4])); }
      cur = [v[4], v[5]];
    }
  }
  return pts;
}
const areaPts = (pts) => pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const insidePts = (poly, p) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
function reverseSub(sp) {
  const segs = [];
  let cur = null, start = null;
  for (const m of sp.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const v = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
    if (m[1] === 'M') { cur = [v[0], v[1]]; start = cur; }
    else if (m[1] === 'L') { segs.push({ from: cur, to: [v[0], v[1]] }); cur = [v[0], v[1]]; }
    else if (m[1] === 'C') { segs.push({ from: cur, c1: [v[0], v[1]], c2: [v[2], v[3]], to: [v[4], v[5]] }); cur = [v[4], v[5]]; }
    else if (m[1] === 'Z' && Math.hypot(cur[0] - start[0], cur[1] - start[1]) > 1e-6) { segs.push({ from: cur, to: start }); cur = start; }
  }
  let d = `M${P2(start)}`;
  for (const g of segs.reverse()) d += g.c1 ? `C${P2(g.c2)} ${P2(g.c1)} ${P2(g.from)}` : `L${P2(g.from)}`;
  return d + 'Z';
}
function expandHV(d) {
  let cur = [0, 0], start = [0, 0], out = '';
  for (const m of d.matchAll(/([MLCHVZ])([^MLCHVZ]*)/g)) {
    const v = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
    if (m[1] === 'M') { cur = [v[0], v[1]]; start = cur; out += `M${P2(cur)}`; }
    else if (m[1] === 'L') { cur = [v[0], v[1]]; out += `L${P2(cur)}`; }
    else if (m[1] === 'H') { cur = [v[0], cur[1]]; out += `L${P2(cur)}`; }
    else if (m[1] === 'V') { cur = [cur[0], v[0]]; out += `L${P2(cur)}`; }
    else if (m[1] === 'C') { cur = [v[4], v[5]]; out += `C${P2([v[0], v[1]])} ${P2([v[2], v[3]])} ${P2(cur)}`; }
    else { out += 'Z'; cur = start; }
  }
  return out;
}
function windByDepth(d0) {
  const d = expandHV(d0);
  const subs = d.split(/(?=M)/).filter(Boolean);
  const polys = subs.map(subpathPts);
  return subs.map((sp, i) => {
    const probe = polys[i][0];
    const depth = polys.filter((q, j) => j !== i && Math.abs(areaPts(q)) > Math.abs(areaPts(polys[i])) && insidePts(q, probe)).length;
    const want = depth % 2 === 0 ? 1 : -1;
    try { return Math.sign(areaPts(polys[i])) === want ? sp : reverseSub(sp); } catch (e) { throw new Error(`windByDepth: ${sp.slice(0, 160)}`); }
  }).join('');
}

/* ---------------------------------------------------------------- layers */

const S = (d) => ({ kind: 'stroke', d });
const M = (d) => ({ kind: 'muted', d });
const PL = (d) => ({ kind: 'plate', d });
const SO = (d) => ({ kind: 'solid', d });
const DOT = (d) => ({ kind: 'dot', d });
const HEAD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
function doc(layers, sharp) {
  const cap = sharp ? 'butt' : 'round';
  const line = ({ kind, d }) => {
    if (kind === 'stroke') return `<path d="${d}" stroke="black" stroke-width="2" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
    if (kind === 'muted') return `<path d="${d}" stroke="black" stroke-opacity="0.4" stroke-width="2" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
    if (kind === 'plate') return `<path d="${d}" fill="black" fill-opacity="0.4"/>`;
    if (kind === 'dot') return `<path d="${d}" fill="black"/>`;
    return `<path fill-rule="evenodd" clip-rule="evenodd" d="${windByDepth(d)}" fill="black"/>`;
  };
  return [HEAD, ...layers.filter((l) => l.d).map(line), '</svg>', ''].join('\n');
}

const SETS = {};
const set = (name, box, build) => { build.box = box; SETS[name] = build; };

/* ---------------------------------------------------------- batch helpers */

import { outlines as flatOutlines, contains as polyContains } from '../../pipeline/lib/geom.mjs';
import { offsetPath as offsetCubic, verify as verifyCubic } from '../v6/offset-cubic.mjs';

/** A shipped variant's layers, straight out of raw/. */
function rawLayers(name, style, corners) {
  const src = readFileSync(join(ROOT, 'raw', name, `Container=regular, Style=${style}, Corners=${corners}.svg`), 'utf8');
  return [...src.matchAll(/<path ([^>]*?)\/?>/g)].map((m) => {
    const a = m[1];
    const d = expandHV(/\bd="([^"]+)"/.exec(a)[1].replace(/\s*([MLCHVZ])\s*/g, '$1').trim());
    const kind = /fill-opacity="0.4"/.test(a) ? 'plate' : /stroke-opacity="0.4"/.test(a) ? 'muted' : /stroke="black"/.test(a) ? 'stroke' : 'solid';
    return { kind, d };
  });
}
const layerOf = (name, style, corners, kind) => rawLayers(name, style, corners).filter((l) => l.kind === kind).map((l) => l.d).join('');
/** Subpaths of d, dropping those whose every point satisfies `drop`. */
function dropSubpaths(d, drop) {
  return d.split(/(?=M)/).filter((sp) => !subpathPts(sp).every(drop)).join('');
}
/** Move or scale every coordinate of an M/L/C path, command by command. */
function mapPts(d, fn) {
  let out = '';
  for (const m of expandHV(d).matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const v = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
    const pts = [];
    for (let i = 0; i + 1 < v.length; i += 2) pts.push(fn([v[i], v[i + 1]]));
    out += m[1] + pts.map(P2).join(' ');
  }
  return out;
}
const shift = (d, dx, dy) => mapPts(d, (q) => [q[0] + dx, q[1] + dy]);
const scaleAbout = (d, k, cx, cy, tx, ty) => mapPts(d, (q) => [tx + (q[0] - cx) * k, ty + (q[1] - cy) * k]);

/** Distance from a point to a drawn path's centre line, and whether it sits inside a closed subpath. */
function field(d) {
  const polys = flatOutlines(d, 96);
  const seg = (p, a, b) => { const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1))); return len(sub(p, add(a, mul(ab, t)))); };
  return (p) => {
    let m = Infinity;
    for (const pl of polys) for (let i = 0; i + 1 < pl.length; i++) m = Math.min(m, seg(p, pl[i], pl[i + 1]));
    const inside = polys.some((pl) => pl.length > 3 && len(sub(pl[0], pl[pl.length - 1])) < 1e-6 && polyContains(pl, p));
    return inside ? -m : m;
  };
}
/** Keep-where-clear for a back element behind `front`: its centre line 4 from the front's (2 of daylight). */
const behind = (...fronts) => { const fs = fronts.map(field); return (p) => fs.every((f) => f(p) >= 4 - 1e-9); };

/** Parameter ranges in [0,1] where keep() holds, edges bisected. */
function keepRanges(keep, n = 1440) {
  const out = [];
  let prev = keep(0), start = prev ? 0 : null;
  for (let i = 1; i <= n; i++) {
    const t = i / n, v = keep(t);
    if (v === prev) continue;
    let lo = (i - 1) / n, hi = t;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (keep(m) === prev) lo = m; else hi = m; }
    const e = (lo + hi) / 2;
    if (prev) out.push([start, e]); else start = e;
    prev = v;
  }
  if (prev) out.push([start, 1]);
  return out;
}

/**
 * The visible runs of a loop of lines and arcs behind a front shape. Each run
 * is a Path; in sharp every cut end takes the house stub (a unit along the
 * tangent for an arc, the cap-cut rule for a line), clamped to the box.
 */
function clipLoop(segs, clear, { sharp = false, box = [1, 1, 23, 23], minLen = 0.5, open = false, guard = null } = {}) {
  const lens = segs.map((s) => (s.type === 'L' ? len(sub(s.p1, s.p0)) : (Math.abs(s.a1 - s.a0) * Math.PI * s.r) / 180));
  const total = lens.reduce((a, b) => a + b, 0);
  const at = (t) => {
    let u = t * total;
    for (let i = 0; i < segs.length; i++) {
      if (u <= lens[i] + 1e-12 || i === segs.length - 1) { const k = Math.min(1, u / lens[i]); const s = segs[i]; return { i, k, p: s.type === 'L' ? add(s.p0, mul(sub(s.p1, s.p0), k)) : onArc(s.c, s.r, s.a0 + (s.a1 - s.a0) * k) }; }
      u -= lens[i];
    }
  };
  const piecesOf = (t0, t1) => {
    const A = at(t0), B = at(t1);
    const pieces = [];
    for (let i = A.i; i <= B.i; i++) {
      const s = segs[i], k0 = i === A.i ? A.k : 0, k1 = i === B.i ? B.k : 1;
      if (k1 - k0 < 1e-9) continue;
      pieces.push(s.type === 'L' ? { type: 'L', p0: add(s.p0, mul(sub(s.p1, s.p0), k0)), p1: add(s.p0, mul(sub(s.p1, s.p0), k1)) } : { type: 'A', c: s.c, r: s.r, a0: s.a0 + (s.a1 - s.a0) * k0, a1: s.a0 + (s.a1 - s.a0) * k1 });
    }
    return pieces;
  };
  const ranges = keepRanges((t) => clear(at(t).p));
  const runs = [];
  // a closed loop whose visible run crosses its own start is one run, not two
  if (!open && ranges.length >= 2 && ranges[0][0] < 1e-9 && ranges[ranges.length - 1][1] > 1 - 1e-9) {
    const first = ranges.shift(), last = ranges.pop();
    runs.push(emitRun([...piecesOf(last[0], 1), ...piecesOf(0, first[1])], { sharp, free: [true, true], box, guard }));
  }
  for (const [t0, t1] of ranges) {
    if ((t1 - t0) * total < minLen) continue;
    runs.push(emitRun(piecesOf(t0, t1), { sharp, free: [open || t0 > 1e-9, open || t1 < 1 - 1e-9], box, guard }));
  }
  return runs;
}
/** A run of line/arc pieces as a Path, with sharp stubs on the free ends. */
function emitRun(pieces, { sharp = false, free = [true, true], box = [1, 1, 23, 23], guard = null } = {}) {
  const first = pieces[0], last = pieces[pieces.length - 1];
  const p0 = first.type === 'L' ? first.p0 : onArc(first.c, first.r, first.a0);
  const p1 = last.type === 'L' ? last.p1 : onArc(last.c, last.r, last.a1);
  const tan = (s, which) => (s.type === 'L' ? unit(sub(s.p1, s.p0)) : (() => { const a = ((which === 'end' ? s.a1 : s.a0) * Math.PI) / 180; return mul([-Math.sin(a), Math.cos(a)], Math.sign(s.a1 - s.a0)); })());
  const stub = (p, dir, s) => { let k = s.type === 'L' ? sharpEndIn(p, dir, box) : arcStub(p, dir, box); if (guard) { const nrm = [-dir[1], dir[0]]; const ok = (q) => [1, -1].every((g) => guard(add(add(p, mul(dir, q)), mul(nrm, g)))); if (!ok(k)) { let lo = 0, hi = k; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; } k = lo; } } return k; };
  const path = new Path();
  if (sharp && free[0]) { const dir = mul(tan(first, 'start'), -1); const k = stub(p0, dir, first); if (first.type === 'L') path.M(add(p0, mul(dir, k))); else path.M(add(p0, mul(dir, k))).L(p0); }
  else path.M(p0);
  pieces.forEach((s, i) => {
    if (s.type === 'L') { if (i === 0 && sharp && free[0]) return path.L(s.p1); path.L(s.p1); }
    else path.A(s.c, s.a0, s.a1, Math.sign(s.a1 - s.a0));
  });
  if (sharp && free[1]) { const dir = tan(last, 'end'); const k = stub(p1, dir, last); path.L(add(p1, mul(dir, k))); }
  return path;
}
/** An arc end's stub: a unit, or less where the butt cap's corners would leave the box. */
function arcStub(p, dir, box) {
  const nrm = [-dir[1], dir[0]];
  const fits = (k) => [1, -1].every((g) => { const c = add(add(p, mul(dir, k)), mul(nrm, g)); return c[0] >= box[0] - 1e-9 && c[1] >= box[1] - 1e-9 && c[0] <= box[2] + 1e-9 && c[1] <= box[3] + 1e-9; });
  if (fits(1)) return 1;
  let lo = 0, hi = 1;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; }
  return lo;
}
/** A single open arc run. */
const arcRun = (c, r, a0, a1, opts = {}) => emitRun([{ type: 'A', c, r, a0, a1 }], opts);
/** Closed Path from explicit segment list (arcs and lines), for plates. */
function segsPath(segs) {
  const p = new Path();
  const s0 = segs[0];
  p.M(s0.type === 'L' ? s0.p0 : onArc(s0.c, s0.r, s0.a0));
  for (const s of segs) { if (s.type === 'L') p.L(s.p1); else p.A(s.c, s.a0, s.a1, Math.sign(s.a1 - s.a0)); }
  return p.Z();
}
/**
 * The open counter of a loop that stands on a body: the loop's own region (its
 * centre line carried on into the body) taken in by a unit, less the body's
 * plate. His fill for watch and hard-drive: the body solid, the loop drawn.
 */
function counterOn(loop, body) {
  const inner = offsetContour(loop.segs.map((g) => ({ ...g })), -1);
  const bodyPlate = offsetContour(body.segs.map((g) => ({ ...g })), 1);
  return subtractContours(inner, [bodyPlate]).map((l) => contourPath(l)).join('');
}
/** Cloud: side lobes rs, big lobe rb, left edge x0, floor y1; `cloud(2, 19, 4, 6)` is the shipped cloud. */
function cloudContour(x0, y1, rs, rb) {
  const cl = [x0 + rs, y1 - rs], cb = [x0 + rs + rb, y1 - 2 * rs], cr = [x0 + rs + 2 * rb, y1 - rs];
  const p = new Path().M([cl[0], y1]).L([cr[0], y1]);
  p.A(cr, 90, -90, -1); p.A(cb, 0, -180, -1); p.A(cl, -90, -270, -1);
  return p.Z();
}
const discD = (c, r) => circlePath(c, r);

/* ================================================================ weather */

/** The sun of thermometer-sun, on (10,10): a disc of 2.5 and rays 6.5..8, behind `front`. */
function sunBehind(front, sharp, box) {
  const clear = behind(front);
  const c = [10, 10];
  const disc = clipLoop([{ type: 'A', c, r: 2.5, a0: 45, a1: 405 }], clear, { sharp, box }).map((p) => p.d).join('');
  let rays = '';
  for (const a of [0, 45, 90, 135, 180, 225, 270, 315]) {
    const p = onArc(c, 6.5, a), q = onArc(c, 8, a);
    let ok = true;
    for (let i = 0; i <= 24; i++) if (!clear(add(p, mul(sub(q, p), i / 24)))) ok = false;
    if (ok) rays += run([p, q], [], { sharp, free: [true, true], box }).d;
  }
  return disc + rays;
}
set('cloud-sun', [1, 1, 23, 23], (sharp) => {
  const box = [1, 1, 23, 23];
  const cloud = cloudContour(7, 22, 3, 4.5);
  const sun = sunBehind(cloud.d, sharp, box);
  const pl = plate(cloud.segs);
  return {
    stroke: [S(cloud.d + sun)],
    'two-tone': [PL(pl), S(cloud.d + sun)],
    duotone: [PL(pl), S(sun)],
    fill: [SO(pl), S(sun)],
  };
});

/** moon's own proportion (terminator on the 45 degree axis at 5R/9) on (8.5,8.5), R 6.5. */
set('cloud-moon', [1, 1, 23, 23], (sharp) => {
  const box = [1, 1, 23, 23];
  const cloud = cloudContour(7, 22, 3, 4.5);
  const Rm = 6.5, M = [8.5, 8.5], a = (5 * Rm) / 9, T = [M[0] + a, M[1] - a];
  const top = [M[0], M[1] - Rm], right = [M[0] + Rm, M[1]];
  const rho = len(sub(top, T));
  const angT = (p) => (Math.atan2(p[1] - T[1], p[0] - T[0]) * 180) / Math.PI;
  let aTop = angT(top); if (aTop < 0) aTop += 360;
  const loop = [{ type: 'A', c: M, r: Rm, a0: 0, a1: 270 }, { type: 'A', c: T, r: rho, a0: aTop, a1: angT(right) }];
  const moon = clipLoop(loop, behind(cloud.d), { sharp, box }).map((p) => p.d).join('');
  const pl = plate(cloud.segs);
  return {
    stroke: [S(cloud.d + moon)],
    'two-tone': [PL(pl), S(cloud.d + moon)],
    duotone: [PL(pl), S(moon)],
    fill: [SO(pl), S(moon)],
  };
});

/** copy's grammar: the front cloud carries the plate, the back cloud is cut 2 clear of it. */
set('clouds', [1, 3, 23, 21], (sharp) => {
  const box = [1, 3, 23, 21];
  const front = cloudContour(2, 20, 3, 4.5);
  const back = cloudContour(11, 12, 2.5, 3);
  const b = clipLoop(back.segs, behind(front.d), { sharp, box }).map((p) => p.d).join('');
  const pl = plate(front.segs);
  return {
    stroke: [S(front.d + b)],
    'two-tone': [PL(pl), S(front.d + b)],
    duotone: [M(b), SO(pl)],
    fill: [S(b), SO(pl)],
  };
});

/** The shipped droplet's 3-4-5 flank at r=4 on (18,16); sharp raises the apex so its join paints the rounded top. */
function dropletContour(c, r, sharp) {
  if (!sharp) {
    const tl = [c[0] - 0.8 * r, c[1] - 0.6 * r], tr = [c[0] + 0.8 * r, c[1] - 0.6 * r], V = [c[0], c[1] - r / 0.6];
    const p = new Path().M(tl);
    const aT = (Math.atan2(-0.6, 0.8) * 180) / Math.PI;
    p.corner(V, tr, 1); p.L(tr); p.A(c, aT, 180 - aT, 1);
    return p.Z();
  }
  const Vs = [c[0], c[1] - r / 0.6 + 2 / 3];
  const D = c[1] - Vs[1], th = (Math.acos(r / D) * 180) / Math.PI;
  const aR = -90 + th, aL = -90 - th + 360;
  const p = new Path().M(onArc(c, r, aL)); p.L(Vs); p.L(onArc(c, r, aR)); p.A(c, aR, aL, 1);
  return p.Z();
}
set('humidity', [1, 3, 23, 21], (sharp) => {
  const box = [1, 3, 23, 21];
  const drop = dropletContour([18, 16], 4, sharp);
  const clear = behind(dropletContour([18, 16], 4, false).d);
  let waves = '';
  const h = 6, A = 1, R = (h * h / 4 + A * A) / (2 * A);
  for (const y of [5, 10, 15]) {
    const segs = [];
    for (let i = 0; i < 3; i++) {
      const x = 2 + i * h, up = i % 2 === 0;
      const c = up ? [x + h / 2, y + R - A] : [x + h / 2, y - (R - A)];
      let a0 = (Math.atan2(y - c[1], x - c[0]) * 180) / Math.PI, a1 = (Math.atan2(y - c[1], x + h - c[0]) * 180) / Math.PI;
      if (up && a1 < a0) a1 += 360;
      if (!up && a1 > a0) a1 -= 360;
      segs.push({ type: 'A', c, r: R, a0, a1 });
    }
    // an open wave, not a loop: clip it as a loop whose ends are free
    const runs = clipLoop(segs, clear, { sharp, box, open: true });
    waves += runs.map((p) => p.d).join('');
  }
  const pl = plate(dropletContour([18, 16], 4, false).segs);
  const plS = sharp ? plate(drop.segs) : pl;
  return {
    stroke: [S(drop.d + waves)],
    'two-tone': [PL(plS), S(drop.d + waves)],
    duotone: [PL(plS), S(waves)],
    fill: [SO(plS), S(waves)],
  };
});

/* ================================================================ devices */

const joined = (runs) => runs.map((p) => p.d).join('');
const sq = (radii, sharp) => (sharp ? radii.map(() => 0) : radii);

/**
 * His airplay (refs/airplay.svg, 17 Sep): a screen 2..22 x 3..16 on r=3 with
 * its bottom edge gone, and a triangle 12 wide x 8 on r=1 rising to 13. Each
 * bottom corner keeps its fillet up to the point whose tangent passes through
 * the triangle's centroid (12, 55/3), which is where his hook tips sit, 2.6
 * clear of the flank. Sharp cuts the squared bottom edge at the same x.
 */
set('airplay', [1, 2, 23, 22], (sharp) => {
  const box = [1, 2, 23, 22];
  const tri = polyContour([[12, 13], [18, 21], [6, 21]], sq([1, 1, 1], sharp));
  const g = [12, 55 / 3], c = [5, 13];
  const th = (Math.atan2(g[1] - c[1], g[0] - c[0]) + Math.acos(3 / len(sub(g, c)))) * 180 / Math.PI;
  const tip = onArc(c, 3, th);
  const keep = (p) => p[1] < tip[1] - 1e-9 || p[0] <= tip[0] + 1e-9 || p[0] >= 24 - tip[0] - 1e-9;
  const screen = joined(clipLoop(polyContour([[2, 3], [22, 3], [22, 16], [2, 16]], sq([3, 3, 3, 3], sharp)).segs, keep, { sharp, box }));
  const pl = plate(tri.segs);
  return {
    stroke: [S(screen + tri.d)],
    'two-tone': [PL(pl), S(screen + tri.d)],
    duotone: [M(screen), SO(pl)],
    fill: [S(screen), SO(pl)],
  };
});

/**
 * His smartphone-cast (refs/smartphone-cast.svg, 17 Sep) on cast's waves: a
 * phone on r=4 with smartphone's slot, and cast's dot, r=4 and r=8 arcs about
 * the source, each 2 clear (his were r=3 and r=6, 1 clear). The phone stops 12
 * from the source, 2 clear of the outer wave, as cast's screen does; a sharp
 * end is held to the same 2 where its butt corner would swing closer.
 */
function phoneCast(x0, o, sharp) {
  const box = [o[0] - 1, 1, x0 + 15, 23];
  const phone = joined(clipLoop(polyContour([[x0, 2], [x0 + 14, 2], [x0 + 14, 22], [x0, 22]], sq([4, 4, 4, 4], sharp)).segs, (p) => len(sub(p, o)) >= 12 - 1e-9, { sharp, box, guard: (q) => len(sub(q, o)) >= 11 - 1e-9 }));
  const slot = run([[x0 + 5.5, 6], [x0 + 8.5, 6]], [], { sharp, free: [true, true], box }).d;
  const waves = arcRun(o, 4, -90, 0, { sharp, box }).d + arcRun(o, 8, -90, 0, { sharp, box }).d;
  const dot1 = discD(o, 1);
  return {
    stroke: [S(phone + slot + waves), DOT(dot1)],
    'two-tone': [M(phone + slot), S(waves), DOT(dot1)],
    duotone: [M(phone + slot), S(waves), DOT(dot1)],
    fill: [S(phone + slot + waves), DOT(dot1)],
  };
}
set('smartphone-cast', [3, 1, 21, 23], (sharp) => phoneCast(6, [4, 22], sharp));

/** A watch 12 x 12 on r=2, centred on x 12 now the crown is gone (fill: the body solid, each strap drawn with its counter open, his call); its straps leave the corner tangents at two thirds of the width and narrow half a unit a side over 4 (1.5 shared 57% of its outline with a sample's round watch). */
set('watch', [5, 1, 19, 23], (sharp) => {
  const box = [5, 1, 19, 23];
  const body = polyContour([[6, 6], [18, 6], [18, 18], [6, 18]], sq([2, 2, 2, 2], sharp));
  const bands = run([[8, 6], [8.5, 2], [15.5, 2], [16, 6]], [0, 1, 1, 0], { sharp }).d + run([[8, 18], [8.5, 22], [15.5, 22], [16, 18]], [0, 1, 1, 0], { sharp }).d;
  const sil = polyContour([[8, 6], [8.5, 2], [15.5, 2], [16, 6], [18, 6], [18, 18], [16, 18], [15.5, 22], [8.5, 22], [8, 18], [6, 18], [6, 6]], sq([0, 1, 1, 0, 2, 2, 0, 1, 1, 0, 2, 2], sharp));
  const pls = plate(sil.segs), plb = plate(body.segs);
  return {
    stroke: [S(body.d + bands)],
    'two-tone': [PL(pls), S(body.d + bands)],
    duotone: [PL(pls), SO(plb)],
    fill: [SO(pls + counterOn(polyContour([[7.75, 8], [8.5, 2], [15.5, 2], [16.25, 8]], sq([0, 1, 1, 0], sharp)), body) + counterOn(polyContour([[16.25, 16], [15.5, 22], [8.5, 22], [7.75, 16]], sq([0, 1, 1, 0], sharp)), body))],
  };
});

/**
 * His hard-drive (refs/hard-drive.svg, 17 Sep): a slab 20 x 9 on r=3 (his
 * corners were elliptical, 3.33 by 3.375) with a bead of 1.5 two clear of its
 * right and top and bottom walls, and a shell whose sides leave r=4 top corners
 * on the vertex (5, 4), aim at the slab side's tangent (2, 14), and stop where
 * they meet the slab's corner arc at x 2.495 (his 2.5). Sharp is his own later
 * drawing: one outline whose shell sides run from (5, 4) straight into the
 * slab's corners (2, 11) and (22, 11), plus the slab's top edge. Fill, his call:
 * the slab solid with the bead a hole, the shell drawn with its counter open down
 * to the slab. Duotone, his call: the shell a grey band behind a black slab, the
 * bead grey in its hole.
 */
set('hard-drive', [1, 3, 23, 21], (sharp) => {
  const box = [1, 3, 23, 21];
  const slab = polyContour([[2, 11], [22, 11], [22, 20], [2, 20]], sq([3, 3, 3, 3], sharp));
  const mark = discD([17.5, 15.5], 1.5);
  if (sharp) {
    const sil = polyContour([[2, 11], [5, 4], [19, 4], [22, 11], [22, 20], [2, 20]], [0, 0, 0, 0, 0, 0]);
    const top = run([[2, 11], [22, 11]], [], { sharp });
    const shell = run([[2, 11], [5, 4], [19, 4], [22, 11]], [0, 0, 0, 0], { sharp });
    const pl = plate(sil.segs), k = 9 / 7;
    return {
      stroke: [S(sil.d + top.d), DOT(mark)],
      'two-tone': [PL(pl), S(sil.d + top.d), DOT(mark)],
      duotone: [M(shell.d), PL(mark), SO(plate(slab.segs) + mark)],
      fill: [SO(pl + counterOn(polyContour([[2 - k, 14], [5, 4], [19, 4], [22 + k, 14]], [0, 0, 0, 0]), slab) + mark)],
    };
  }
  const t = 91 / 109;
  const hitL = [5 - 3 * t, 4 + 10 * t], hitR = [24 - hitL[0], hitL[1]];
  const shell = run([hitL, [5, 4], [19, 4], hitR], [0, 4, 4, 0], { sharp });
  const deg = (p, c) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;
  const sil = new Path().M(hitL);
  sil.corner([5, 4], [19, 4], 4); sil.corner([19, 4], hitR, 4); sil.L(hitR);
  sil.A([19, 14], deg(hitR, [19, 14]), 0, 1); sil.L([22, 17]); sil.A([19, 17], 0, 90, 1);
  sil.L([5, 20]); sil.A([5, 17], 90, 180, 1); sil.L([2, 14]); sil.A([5, 14], 180, 360 + deg(hitL, [5, 14]), 1);
  sil.Z();
  const pl = plate(sil.segs);
  return {
    stroke: [S(slab.d + shell.d), DOT(mark)],
    'two-tone': [PL(pl), S(slab.d + shell.d), DOT(mark)],
    duotone: [M(shell.d), PL(mark), SO(plate(slab.segs) + mark)],
    fill: [SO(pl + counterOn(polyContour([[2, 14], [5, 4], [19, 4], [22, 14]], [0, 4, 4, 0]), slab) + mark)],
  };
});

/**
 * A headset visor 20 x 10 on centre: round ends of 5 and a flat brow; the
 * underside leaves each end's foot in an S of two r=3 arcs, so the nose rises
 * 6(1 - cos(asin 5/6)) = 2.68, a quarter of the height, across the middle half.
 * Sharp keeps the ends (the shape) and squares the S on its own tangents.
 */
set('vision-pro', [1, 6, 23, 18], (sharp) => {
  const sn = 5 / 6, cs = Math.sqrt(1 - sn * sn), deg = (Math.asin(sn) * 180) / Math.PI;
  const yN = 14 + 6 * cs, apex = yN - 3;
  const p = new Path().M([7, 7]).L([17, 7]);
  p.A([17, 12], -90, 90, 1);
  if (sharp) {
    const t = (3 - 3 * cs) / sn;
    const Pr = [17 - 3 * sn, 14 + 3 * cs], Pl = [7 + 3 * sn, 14 + 3 * cs];
    p.L([Pr[0] + t * cs, 17]).L([Pr[0] - t * cs, apex]).L([Pl[0] + t * cs, apex]).L([Pl[0] - t * cs, 17]).L([7, 17]);
  } else {
    p.A([17, 14], 90, 90 + deg, 1);
    p.A([12, yN], deg - 90, -90 - deg, -1);
    p.A([7, 14], 90 - deg, 90, 1);
  }
  p.A([7, 12], 90, 270, 1);
  p.Z();
  const pl = plate(p.segs);
  return { stroke: [S(p.d)], 'two-tone': [PL(pl), S(p.d)], duotone: [S(p.d)], fill: [SO(pl)] };
});

/** A film camera: body, a lens landing on its wall, two reels 9 apart. */
set('video', [1, 2, 23, 22], (sharp) => {
  const body = polyContour([[2, 12], [16, 12], [16, 21], [2, 21]], sq([3, 3, 3, 3], sharp));
  const lens = run([[16, 15], [22, 12], [22, 21], [16, 18]], [0, 1, 1, 0], { sharp }).d;
  const reels = discD([5.5, 5.5], 2.5) + discD([14.5, 5.5], 2.5);
  const sil = polyContour([[2, 12], [16, 12], [16, 15], [22, 12], [22, 21], [16, 18], [16, 21], [2, 21]], sq([3, 3, 0, 1, 1, 0, 3, 3], sharp));
  const pl = plate(sil.segs), discs = discD([5.5, 5.5], 3.5) + discD([14.5, 5.5], 3.5);
  return {
    stroke: [S(body.d + lens + reels)],
    'two-tone': [PL(pl + discs), S(body.d + lens + reels)],
    duotone: [M(reels), SO(pl)],
    fill: [SO(pl + discs)],
  };
});

/** Two plugs on an S of cable, runs on 4, 12 and 20 with r=4 bends; each head 6 along the cable and 4 across, a tip of 2 out of its far wall. */
set('cable', [1, 1, 23, 23], (sharp) => {
  const box = [1, 1, 23, 23];
  const p = new Path().M([14, 4]).L([6, 4]); p.A([6, 8], -90, -270, -1); p.L([18, 12]); p.A([18, 16], -90, 90, 1); p.L([10, 20]);
  const plugs = [polyContour([[14, 2], [20, 2], [20, 6], [14, 6]], sq([1, 1, 1, 1], sharp)), polyContour([[4, 18], [10, 18], [10, 22], [4, 22]], sq([1, 1, 1, 1], sharp))];
  const prongs = run([[20, 4], [22, 4]], [], { sharp, free: [false, true], box }).d + run([[4, 20], [2, 20]], [], { sharp, free: [false, true], box }).d;
  const plugD = plugs.map((q) => q.d).join(''), pl = plugs.map((q) => plate(q.segs)).join('');
  return {
    stroke: [S(p.d + plugD + prongs)],
    'two-tone': [PL(pl), S(p.d + plugD + prongs)],
    duotone: [M(p.d), SO(pl), S(prongs)],
    fill: [S(p.d + prongs), SO(pl)],
  };
});

/* ============================================================ compounds */

/**
 * Cut the small crossed loop an outward offset leaves at a reflex cusp (a
 * heart's cleft): find the first two non-adjacent pieces that cross, keep each
 * up to the crossing, and drop what lay between. The cubic offsetter trims no
 * reflex join, which its own notes say; this is the trim, done on the output.
 */
function trimLoops(d) {
  const segs = [];
  let cur = null;
  for (const m of expandHV(d).matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const v = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
    if (m[1] === 'M') cur = [v[0], v[1]];
    else if (m[1] === 'L') { segs.push({ t: 'L', a: cur, b: [v[0], v[1]] }); cur = [v[0], v[1]]; }
    else if (m[1] === 'C') { segs.push({ t: 'C', a: cur, c1: [v[0], v[1]], c2: [v[2], v[3]], b: [v[4], v[5]] }); cur = [v[4], v[5]]; }
  }
  const at = (g, t) => (g.t === 'L' ? add(g.a, mul(sub(g.b, g.a), t)) : [0, 1].map((k) => (1 - t) ** 3 * g.a[k] + 3 * (1 - t) ** 2 * t * g.c1[k] + 3 * (1 - t) * t * t * g.c2[k] + t ** 3 * g.b[k]));
  const split = (g, t0, t1) => {
    if (g.t === 'L') return { t: 'L', a: at(g, t0), b: at(g, t1) };
    const sp = (p0, p1, p2, p3, t) => { const l = (u, w) => add(u, mul(sub(w, u), t)); const a = l(p0, p1), b = l(p1, p2), c = l(p2, p3), e = l(a, b), f = l(b, c), q = l(e, f); return [[p0, a, e, q], [q, f, c, p3]]; };
    const right = sp(g.a, g.c1, g.c2, g.b, t0)[1];
    const left = sp(...right, t0 >= 1 ? 0 : (t1 - t0) / (1 - t0))[0];
    return { t: 'C', a: left[0], c1: left[1], c2: left[2], b: left[3] };
  };
  const N = 60, n = segs.length;
  const cross2 = (p, q, r, u) => { const d1 = sub(q, p), d2 = sub(u, r), den = d1[0] * d2[1] - d1[1] * d2[0]; if (Math.abs(den) < 1e-12) return null; const w = sub(r, p); const s1 = (w[0] * d2[1] - w[1] * d2[0]) / den, s2 = (w[0] * d1[1] - w[1] * d1[0]) / den; return s1 >= 0 && s1 <= 1 && s2 >= 0 && s2 <= 1 ? [s1, s2] : null; };
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
      const hit = cross2(at(segs[i], a / N), at(segs[i], (a + 1) / N), at(segs[j], b / N), at(segs[j], (b + 1) / N));
      if (!hit) continue;
      const ti = (a + hit[0]) / N, tj = (b + hit[1]) / N;
      const kept = [...segs.slice(0, i), split(segs[i], 0, ti), split(segs[j], tj, 1), ...segs.slice(j + 1)];
      kept[i].b = kept[i + 1].a;                 // meet exactly at the crossing
      let out = `M${P2(kept[0].a)}`;
      for (const g of kept) out += g.t === 'L' ? `L${P2(g.b)}` : `C${P2(g.c1)} ${P2(g.c2)} ${P2(g.b)}`;
      return trimLoops(out + 'Z');
    }
  }
  return d;
}

/** Walk an M/L/C path, keep what `clear` allows, cubics split exactly; sharp cut ends take a unit stub. A closed subpath's run across its own start stays one run. */
function clipCubicPath(d, clear, { sharp = false, box = [1, 1, 23, 23] } = {}) {
  const subs = [];
  let cur = null, start = null, segs = null;
  for (const m of expandHV(d).matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const v = m[2].trim() ? m[2].trim().split(/[\s,]+/).map(Number) : [];
    if (m[1] === 'M') { cur = [v[0], v[1]]; start = cur; segs = []; subs.push({ segs, closed: false }); }
    else if (m[1] === 'L') { segs.push({ t: 'L', a: cur, b: [v[0], v[1]] }); cur = [v[0], v[1]]; }
    else if (m[1] === 'C') { segs.push({ t: 'C', a: cur, c1: [v[0], v[1]], c2: [v[2], v[3]], b: [v[4], v[5]] }); cur = [v[4], v[5]]; }
    else { if (len(sub(cur, start)) > 1e-9) segs.push({ t: 'L', a: cur, b: start }); cur = start; subs[subs.length - 1].closed = true; }
  }
  const at = (g, t) => (g.t === 'L' ? add(g.a, mul(sub(g.b, g.a), t)) : [0, 1].map((k) => (1 - t) ** 3 * g.a[k] + 3 * (1 - t) ** 2 * t * g.c1[k] + 3 * (1 - t) * t * t * g.c2[k] + t ** 3 * g.b[k]));
  const tan = (g, t) => (g.t === 'L' ? unit(sub(g.b, g.a)) : unit([0, 1].map((k) => 3 * (1 - t) ** 2 * (g.c1[k] - g.a[k]) + 6 * (1 - t) * t * (g.c2[k] - g.c1[k]) + 3 * t * t * (g.b[k] - g.c2[k]))));
  const part = (g, t0, t1) => {
    if (g.t === 'L') return { t: 'L', a: at(g, t0), b: at(g, t1) };
    const split = (p0, p1, p2, p3, t) => { const l = (u, w) => add(u, mul(sub(w, u), t)); const a = l(p0, p1), b = l(p1, p2), c = l(p2, p3), e = l(a, b), f = l(b, c), q = l(e, f); return [[p0, a, e, q], [q, f, c, p3]]; };
    const right = split(g.a, g.c1, g.c2, g.b, t0)[1];
    const left = split(...right, t0 >= 1 ? 0 : (t1 - t0) / (1 - t0))[0];
    return { t: 'C', a: left[0], c1: left[1], c2: left[2], b: left[3] };
  };
  let out = '';
  for (const { segs, closed } of subs) {
    const n = segs.length;
    const loc = (T) => { const i = Math.min(n - 1, Math.floor(T * n)); return { i, t: Math.min(1, T * n - i) }; };
    const pieces = (T0, T1) => {
      const A = loc(T0), B = T1 >= 1 ? { i: n - 1, t: 1 } : loc(T1), res = [];
      for (let i = A.i; i <= B.i; i++) { const t0 = i === A.i ? A.t : 0, t1 = i === B.i ? B.t : 1; if (t1 - t0 > 1e-7) res.push({ g: segs[i], t0, t1 }); }
      return res;
    };
    const ranges = keepRanges((T) => { const { i, t } = loc(T); return clear(at(segs[i], t)); }, 400 * n);
    const runs = [];
    if (closed && ranges.length >= 2 && ranges[0][0] < 1e-9 && ranges[ranges.length - 1][1] > 1 - 1e-9) {
      const first = ranges.shift(), last = ranges.pop();
      runs.push({ list: [...pieces(last[0], 1), ...pieces(0, first[1])], free: [true, true] });
    }
    for (const [T0, T1] of ranges) runs.push({ list: pieces(T0, T1), free: [!(closed && T0 < 1e-9 && T1 > 1 - 1e-9) && (T0 > 1e-9 || !closed ? T0 > 1e-9 : false), T1 < 1 - 1e-9] });
    for (const { list, free } of runs) {
      if (!list.length) continue;
      const q0 = part(list[0].g, list[0].t0, list[0].t1);
      if (sharp && free[0]) { const dir = mul(tan(list[0].g, list[0].t0), -1); const k = list[0].g.t === 'L' ? sharpEndIn(q0.a, dir, box) : arcStub(q0.a, dir, box); out += `M${P2(add(q0.a, mul(dir, k)))}L${P2(q0.a)}`; }
      else out += `M${P2(q0.a)}`;
      let last = null;
      for (const { g, t0, t1 } of list) { const q = part(g, t0, t1); out += q.t === 'L' ? `L${P2(q.b)}` : `C${P2(q.c1)} ${P2(q.c2)} ${P2(q.b)}`; last = { g, t1, b: q.b }; }
      const whole = closed && list.length === n && list[0].t0 < 1e-9 && last.t1 > 1 - 1e-9 && !free[0] && !free[1];
      if (whole) out += 'Z';
      else if (sharp && free[1]) { const dir = tan(last.g, last.t1); const k = last.g.t === 'L' ? sharpEndIn(last.b, dir, box) : arcStub(last.b, dir, box); out += `L${P2(add(last.b, mul(dir, k)))}`; }
    }
  }
  return out;
}
const corners = (sharp) => (sharp ? 'sharp' : 'regular');
const inBox = (x0, y0, x1, y1) => (q) => q[0] >= x0 && q[0] <= x1 && q[1] >= y0 && q[1] <= y1;

/** file-check's body and plate with folder-search's lens moved (-1, +2) where the check was. */
set('file-search', [3, 1, 21, 23], (sharp) => {
  const box = [3, 1, 21, 23], k = corners(sharp);
  const noCheck = (d) => dropSubpaths(d, inBox(12.5, 15, 21.5, 22.5));
  const c = [16.5, 18.5];
  const glyph = discD(c, 2.5) + run([sharp ? onArc(c, 2.5, 45) : [18.5, 20.5], [20, 22]], [], { sharp, free: [false, true], box }).d;
  return {
    stroke: [S(noCheck(layerOf('file-check', 'stroke', k, 'stroke')) + glyph)],
    'two-tone': [PL(layerOf('file-check', 'two-tone', k, 'plate')), S(noCheck(layerOf('file-check', 'two-tone', k, 'stroke')) + glyph)],
    duotone: [PL(layerOf('file-check', 'duotone', k, 'plate')), S(noCheck(layerOf('file-check', 'duotone', k, 'stroke')) + glyph)],
    fill: [SO(layerOf('file-check', 'fill', k, 'solid')), S(glyph)],
  };
});

/** send behind a clock of R=6.5 on (15.5,15.5), cut 2 clear of it; hands 2.5. */
set('send-clock', [1, 1, 23, 23], (sharp) => {
  const box = [1, 1, 23, 23], k = corners(sharp);
  const c = [15.5, 15.5];
  const ring = discD(c, 6.5);
  const hands = run([[15.5, 13], [15.5, 15.5], [18, 15.5]], [], { sharp, free: [true, true], box });
  const plane = clipCubicPath(layerOf('send', 'stroke', k, 'stroke'), behind(ring), { sharp, box });
  const disc = discD(c, 7.5);
  return {
    stroke: [S(plane + ring + hands.d)],
    'two-tone': [PL(disc), S(plane + ring + hands.d)],
    duotone: [M(plane), S(ring + hands.d)],
    fill: [S(plane), SO(disc + capsule(hands.segs, sharp))],
  };
});

/** message-plus's bubble and plate with a four-point sparkle, waist 0.3 of its reach, solved to clear by 2. */
function sparkle(c, T, sharp) {
  const I = 0.3 * T, rt = 0.5, rw = 1;
  const half = Math.atan2(I, T - I);            // half-angle at a tip, between the axis and a flank
  const Ts = sharp ? T - rt * (1 / Math.sin(half) - 1) : T;
  const pts = [[0, -Ts], [I, -I], [Ts, 0], [I, I], [0, Ts], [-I, I], [-Ts, 0], [-I, -I]].map((q) => add(c, q));
  return polyContour(pts, sharp ? pts.map(() => 0) : [rt, rw, rt, rw, rt, rw, rt, rw]);
}
const SPARKLE_T = (() => {
  const bubble = field(layerOf('message-plus', 'stroke', 'regular', 'stroke').split(/(?=M)/)[0]);
  let lo = 3, hi = 8;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (flatOutlines(sparkle([12, 11], m, false).d, 48).flat().every((q) => Math.abs(bubble(q)) >= 4)) lo = m; else hi = m; }
  return Math.floor(lo * 100) / 100;
})();
set('message-sparkle', [1, 2, 23, 22], (sharp) => {
  const k = corners(sharp);
  const noPlus = (d) => dropSubpaths(d, inBox(7.5, 6.5, 16.5, 15.5));
  const sp = sparkle([12, 11], SPARKLE_T, sharp);
  const outer = contourPath(offsetContour(sp.segs.map((g) => ({ ...g })), 1));
  const plateD = layerOf('message-plus', 'two-tone', k, 'plate');
  return {
    stroke: [S(noPlus(layerOf('message-plus', 'stroke', k, 'stroke')) + sp.d)],
    'two-tone': [PL(plateD), S(noPlus(layerOf('message-plus', 'two-tone', k, 'stroke')) + sp.d)],
    duotone: [PL(plateD), S(sp.d)],
    fill: [SO(plateD + outer)],
  };
});

/** message-square-plus's bubble and plate with the same sparkle, on the square bubble's centre (12,10), solved to clear by 2. */
const SPARKLE_T_SQUARE = (() => {
  const bubble = field(layerOf('message-square-plus', 'stroke', 'regular', 'stroke').split(/(?=M)/)[0]);
  let lo = 3, hi = 8;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (flatOutlines(sparkle([12, 10], m, false).d, 48).flat().every((q) => Math.abs(bubble(q)) >= 4)) lo = m; else hi = m; }
  return Math.floor(lo * 100) / 100;
})();
set('message-square-sparkle', [2, 2, 22, 22], (sharp) => {
  const k = corners(sharp);
  const noPlus = (d) => dropSubpaths(d, inBox(7.5, 5.5, 16.5, 14.5));
  const sp = sparkle([12, 10], Math.min(SPARKLE_T, SPARKLE_T_SQUARE), sharp);
  const outer = contourPath(offsetContour(sp.segs.map((g) => ({ ...g })), 1));
  const plateD = layerOf('message-square-plus', 'two-tone', k, 'plate');
  return {
    stroke: [S(noPlus(layerOf('message-square-plus', 'stroke', k, 'stroke')) + sp.d)],
    'two-tone': [PL(plateD), S(noPlus(layerOf('message-square-plus', 'two-tone', k, 'stroke')) + sp.d)],
    duotone: [PL(plateD), S(sp.d)],
    fill: [SO(plateD + outer)],
  };
});

/** user-check's bust moved right a unit, two waves from the head where its check was. */
set('user-voice', [2, 2, 22, 22], (sharp) => {
  const box = [2, 2, 22, 22], k = corners(sharp);
  const noCheck = (d) => dropSubpaths(d, inBox(15, 3.5, 23, 11));
  const bust = shift(noCheck(layerOf('user-check', 'stroke', k, 'stroke')), 1, 0);
  const bodyD = shift(layerOf('user-check', 'stroke', 'regular', 'stroke').split(/(?=M)/).find((sp) => /^M8 14/.test(sp)), 1, 0);
  const clear = (q) => behind(bodyD)(q) && q[1] >= 3 - 1e-9 && q[0] <= 21 + 1e-9;
  const head = [10, 7];
  const sharpBody = shift(layerOf('user-check', 'stroke', k, 'stroke').split(/(?=M)/).find((sp) => /^M8 14/.test(sp)) || '', 1, 0);
  const bodyField = field(sharp ? sharpBody : bodyD);
  const guard = (q) => Math.abs(bodyField(q)) >= 3 - 1e-9;
  const waves = [7, 11].map((r) => joined(clipLoop([{ type: 'A', c: head, r, a0: -30, a1: 30 }], clear, { sharp, box, open: true, minLen: 1.5, guard }))).join('');
  return {
    stroke: [S(bust + waves)],
    'two-tone': [PL(shift(layerOf('user-check', 'two-tone', k, 'plate'), 1, 0)), S(bust + waves)],
    duotone: [PL(shift(layerOf('user-check', 'duotone', k, 'plate'), 1, 0)), S(waves)],
    fill: [SO(shift(layerOf('user-check', 'fill', k, 'solid'), 1, 0)), S(waves)],
  };
});

/** audio-lines cut 2 clear of folder-search's lens moved (-1, +1). */
set('audio-lines-search', [3, 2, 21, 22], (sharp) => {
  const box = [3, 2, 21, 22];
  const c = [16.5, 17.5];
  const glyph = discD(c, 2.5) + run([sharp ? onArc(c, 2.5, 45) : [18.5, 19.5], [20, 21]], [], { sharp, free: [false, true], box }).d;
  const clear = behind(discD(c, 2.5), 'M18.5 19.5L20 21');
  const bars = [[4, 10, 14], [8, 6, 18], [12, 3, 21], [16, 7, 17], [20, 10, 14]].map(([x, y0, y1]) => joined(clipLoop([{ type: 'L', p0: [x, y0], p1: [x, y1] }], clear, { sharp, box, open: true, minLen: 1 }))).join('');
  return {
    stroke: [S(bars + glyph)],
    'two-tone': [M(bars), S(glyph)],
    duotone: [M(bars), S(glyph)],
    fill: [S(bars + glyph)],
  };
});

/** A contact card: gallery-vertical-end's rail over a card with a bust standing on its floor. */
set('contacts', [2, 2, 22, 22], (sharp) => {
  const box = [2, 2, 22, 22];
  const card = polyContour([[3, 7], [21, 7], [21, 21], [3, 21]], sq([3, 3, 3, 3], sharp));
  const rail = run([[5, 3], [19, 3]], [], { sharp, free: [true, true], box });
  const head = discD([12, 13], 2);
  const shoulders = run([[8, 21], [8, 19], [16, 19], [16, 21]], [0, 2, 2, 0], { sharp });
  // duotone has no card line: an anchored line runs to the plate edge, a sharp butt end by its corner
  const shouldersDu = sharp ? run([[8, 22], [8, 19], [16, 19], [16, 22]], [0, 2, 2, 0], { sharp }) : shoulders;
  const pl = plate(card.segs);
  const region = sharp ? polyD([[7, 20], [7, 18], [17, 18], [17, 20]]) : (() => {
    const x = Math.sqrt(8), p = new Path().M([10 - x, 20]);
    p.A([10, 21], (Math.atan2(-1, -x) * 180) / Math.PI, -90, 1); p.L([14, 18]); p.A([14, 21], -90, (Math.atan2(-1, x) * 180) / Math.PI, 1);
    return p.Z().d;
  })();
  return {
    stroke: [S(card.d + rail.d + head + shoulders.d)],
    'two-tone': [PL(pl), S(card.d + rail.d + head + shoulders.d)],
    duotone: [PL(pl), S(rail.d + head + shouldersDu.d)],
    fill: [SO(pl + discD([12, 13], 3) + region), S(rail.d)],
  };
});

/**
 * credit-card-2's card with a bust on its floor and two lines. Shoulders r=4
 * about (9, 20), their left foot on the floor at the corner tangent (5, 20), so
 * they are twice the head's width as user's are; the head r=2 on (9, 10) sits 2
 * above them and 2 below the card's top. The lines 15..18 on 10 and 14 are
 * centred in the card, 4 from its top and bottom edges, and between the head and
 * the right wall, 2 from each.
 */
set('id-card', [1, 3, 23, 21], (sharp) => {
  const box = [1, 3, 23, 21];
  const card = polyContour([[2, 4], [22, 4], [22, 20], [2, 20]], sq([3, 3, 3, 3], sharp));
  const head = discD([9, 10], 2);
  const shoulders = arcRun([9, 20], 4, 180, 360, { sharp, free: [false, false], box });
  const shouldersDu = sharp ? arcRun([9, 20], 4, 180, 360, { sharp, free: [true, true], box }) : shoulders;
  const l1 = run([[15, 10], [18, 10]], [], { sharp, free: [true, true], box }), l2 = run([[15, 14], [18, 14]], [], { sharp, free: [true, true], box });
  const pl = plate(card.segs);
  const x = Math.sqrt(24);
  const region = (() => { const p = new Path().M([9 - x, 19]); p.A([9, 20], (Math.atan2(-1, -x) * 180) / Math.PI, (Math.atan2(-1, x) * 180) / Math.PI, 1); return p.Z().d; })();
  const detail = head + shoulders.d + l1.d + l2.d;
  return {
    stroke: [S(card.d + detail)],
    'two-tone': [PL(pl), S(card.d + detail)],
    duotone: [PL(pl), S(head + shouldersDu.d + l1.d + l2.d)],
    fill: [SO(pl + discD([9, 10], 3) + region + capsule(l1.segs, sharp) + capsule(l2.segs, sharp))],
  };
});

/**
 * Two pills 16 x 8 on the vertical size, each knob the ring of its pill's own
 * round end (the only knob two pills stacked in 24 leave room for), top knob
 * left, bottom right. Duotone and fill take toggle-on's knob: a grey disc of 3
 * in a black pill, a hole of 3 in a solid one. Sharp squares the pills to
 * toggle-on's 0.5 and squares the knob as toggle-on does (his call): on the
 * pill's end it is a divider on x 12, and its hole a 6 x 6 square.
 */
set('toggles', [3, 1, 21, 23], (sharp) => {
  const r = sharp ? 0.5 : 4;
  const kt = [8, 6], kb = [16, 18];
  const top = polyContour([[4, 2], [20, 2], [20, 10], [4, 10]], [r, r, r, r]);
  const bot = polyContour([[4, 14], [20, 14], [20, 22], [4, 22]], [r, r, r, r]);
  const lines = sharp
    ? top.d + bot.d + run([[12, 2], [12, 10]], [], { sharp }).d + run([[12, 14], [12, 22]], [], { sharp }).d
    : new Path().M([8, 2]).L([16, 2]).A([16, 6], -90, 90, 1).L([8, 10]).d + new Path().M([16, 22]).L([8, 22]).A([8, 18], 90, 270, 1).L([16, 14]).d;
  const knobs = sharp ? '' : discD(kt, 4) + discD(kb, 4);
  const holes = sharp ? rect(5, 3, 11, 9) + rect(13, 15, 19, 21) : discD(kt, 3) + discD(kb, 3);
  const pl = plate(top.segs) + plate(bot.segs);
  return {
    stroke: [S(lines + knobs)],
    'two-tone': [PL(pl), S(lines + knobs)],
    duotone: [PL(holes), SO(pl + holes)],
    fill: [SO(pl + holes)],
  };
});

/** map-pin with the shipped heart, scaled 0.399 on (12,11.25), where the hole was. */
set('map-pin-heart', [3, 1, 21, 23], (sharp) => {
  const k = corners(sharp);
  const noHole = (d) => dropSubpaths(d, inBox(7.5, 5.5, 16.5, 14.5));
  const heart = scaleAbout(layerOf('heart', 'stroke', k, 'stroke'), 0.399, 12, 12, 12, 11.25);
  const outer = trimLoops(offsetCubic(heart, 1));
  const plateD = layerOf('map-pin', 'two-tone', k, 'plate');
  return {
    stroke: [S(noHole(layerOf('map-pin', 'stroke', k, 'stroke')) + heart)],
    'two-tone': [PL(plateD), S(noHole(layerOf('map-pin', 'two-tone', k, 'stroke')) + heart)],
    duotone: [PL(plateD), S(heart)],
    fill: [SO(plateD + outer)],
  };
});

/** shield-check's shield and plate with a key where the check was. */
set('shield-key', [3, 1, 21, 23], (sharp) => {
  const box = [3, 1, 21, 23], k = corners(sharp);
  const noCheck = (d) => dropSubpaths(d, inBox(7, 8, 17, 16));
  const bow = discD([12, 9.5], 2);
  const shaft = run([[12, 11.5], [12, 17.5]], [], { sharp, free: [false, true], box });
  const tooth = run([[12, 15.5], [14, 15.5]], [], { sharp, free: [false, true], box });
  const key = bow + shaft.d + tooth.d;
  const y0 = 9.5 + Math.sqrt(8), a0 = (Math.atan2(y0 - 9.5, -1) * 180) / Math.PI, a1 = (Math.atan2(y0 - 9.5, 1) * 180) / Math.PI + 360;
  const ko = new Path().M([13, y0]).L([13, 14.5]);
  if (sharp) ko.L([15, 14.5]).L([15, 16.5]).L([13, 16.5]).L([13, 18.5]).L([11, 18.5]);
  else { ko.L([14, 14.5]); ko.A([14, 15.5], -90, 90, 1); ko.L([13, 16.5]).L([13, 17.5]); ko.A([12, 17.5], 0, 180, 1); }
  ko.L([11, y0]); ko.A([12, 9.5], a0, a1, 1); ko.Z();
  return {
    stroke: [S(noCheck(layerOf('shield-check', 'stroke', k, 'stroke')) + key)],
    'two-tone': [PL(layerOf('shield-check', 'two-tone', k, 'plate')), S(noCheck(layerOf('shield-check', 'two-tone', k, 'stroke')) + key)],
    duotone: [PL(layerOf('shield-check', 'duotone', k, 'plate')), S(key)],
    fill: [SO(layerOf('shield-check', 'two-tone', k, 'plate') + ko.d + discD([12, 9.5], 1))],
  };
});

/** rotate-cw with circle-plus's plus inside. */
set('rotate-cw-plus', [2, 2, 22, 22], (sharp) => {
  const box = [2, 2, 22, 22], k = corners(sharp);
  const rot = layerOf('rotate-cw', 'stroke', k, 'stroke');
  const plus = run([[8, 12], [16, 12]], [], { sharp, free: [true, true], box }).d + run([[12, 8], [12, 16]], [], { sharp, free: [true, true], box }).d;
  return { stroke: [S(rot + plus)], 'two-tone': [M(rot), S(plus)], duotone: [M(rot), S(plus)], fill: [S(rot + plus)] };
});

/** A beacon: dome r=5 standing on a base, three rays 9..10 about the dome's centre. Fill, his call: the dome solid, the base drawn with its counter open (5..19 x 18..20). */
set('siren', [3, 2, 21, 22], (sharp) => {
  const box = [3, 2, 21, 22];
  const c = [12, 13];
  const dome = new Path().M([7, 17]).L([7, 13]); dome.A(c, 180, 360, 1); dome.L([17, 17]);
  const rb = sharp ? 0 : 1;
  const base = polyContour([[4, 17], [20, 17], [20, 21], [4, 21]], [rb, rb, rb, rb]);
  const rays = [-135, -90, -45].map((a) => run([onArc(c, 9, a), onArc(c, 10, a)], [], { sharp, free: [true, true], box }).d).join('');
  const sil = new Path().M([7, 17]).L([7, 13]); sil.A(c, 180, 360, 1); sil.L([17, 17]);
  sil.corner([20, 17], [20, 21], rb); sil.corner([20, 21], [4, 21], rb); sil.corner([4, 21], [4, 17], rb); sil.corner([4, 17], [7, 17], rb); sil.Z();
  const domeRegion = new Path().M([6, 16]).L([6, 13]); domeRegion.A(c, 180, 360, 1); domeRegion.L([18, 16]); domeRegion.Z();
  const pl = plate(sil.segs);
  return {
    stroke: [S(dome.d + base.d + rays)],
    'two-tone': [PL(pl), S(dome.d + base.d + rays)],
    duotone: [PL(pl), SO(domeRegion.d), S(rays)],
    fill: [SO(pl + rect(5, 18, 19, 20)), S(rays)],
  };
});

/** A basket with a slanted handle; the rim vertex is solved so each treatment paints 1. */
set('shopping-basket', [1, 2, 23, 22], (sharp) => {
  const radii = sq([1, 1, 2, 2], sharp);
  const mk = (x0) => polyContour([[x0, 10], [24 - x0, 10], [19, 21], [5, 21]], radii);
  const x0 = solve((v) => exactInk(mk(v).d, sharp)[0], 1, 0, 3);
  const basket = mk(x0);
  const handle = run([[9, 10], [10, 3], [16, 3], [15, 10]], [0, 1, 1, 0], { sharp }).d;
  const pl = plate(basket.segs);
  return {
    stroke: [S(basket.d + handle)],
    'two-tone': [PL(pl), S(basket.d + handle)],
    duotone: [M(handle), SO(pl)],
    fill: [S(handle), SO(pl)],
  };
});

/** podcast's grammar on a mast (drawn as radio-tower, renamed broadcast on his word): a mark on (12,9), waves r=4 and r=8 both sides. */
set('broadcast', [3, 2, 21, 22], (sharp) => {
  const box = [3, 2, 21, 22];
  const c = [12, 9], ti = 35, to = (Math.asin(0.75) * 180) / Math.PI;
  const arcs = (r, t) => arcRun(c, r, 180 - t, 180 + t, { sharp, box }).d + arcRun(c, r, -t, t, { sharp, box }).d;
  const mast = run([[12, 14], [12, 21]], [], { sharp, free: [true, true], box }).d;
  const mark = discD(c, 1);
  return {
    stroke: [S(arcs(4, ti) + arcs(8, to) + mast), DOT(mark)],
    'two-tone': [M(arcs(8, to)), S(arcs(4, ti) + mast), DOT(mark)],
    duotone: [M(arcs(8, to)), S(arcs(4, ti) + mast), DOT(mark)],
    fill: [S(arcs(4, ti) + arcs(8, to) + mast), DOT(mark)],
  };
});

/**
 * A dial on the circle size: a hub of 2 on centre, a needle of 5 straight up,
 * and a scale of four marks on radius 6 at 180, 225, 315 and 360, the needle
 * standing in the fifth place; every mark 2 clear of the ring, the hub and the
 * needle.
 */
set('gauge', [1, 1, 23, 23], (sharp) => {
  const box = [1, 1, 23, 23];
  const c = [12, 12], tip = [12, 7];
  const needle = run([c, tip], [], { sharp, free: [false, true], box });
  const hub = discD(c, 2);
  const ticks = [180, 225, 315, 360].map((a) => discD(onArc(c, 6, a), 1)).join('');
  const h = Math.sqrt(3);
  const ko = new Path().M([13, 12 - h]);
  if (sharp) { const e = 7 - sharpEndIn(tip, [0, -1], box); ko.L([13, e]).L([11, e]); }
  else { ko.L([13, 7]); ko.A([12, 7], 0, -180, -1); }
  ko.L([11, 12 - h]); ko.A(c, -120, -420, -1); ko.Z();
  return {
    stroke: [S(discD(c, 10) + needle.d), DOT(hub + ticks)],
    'two-tone': [PL(discD(c, 11)), S(discD(c, 10) + needle.d), DOT(hub + ticks)],
    duotone: [PL(discD(c, 11)), S(needle.d), DOT(hub + ticks)],
    fill: [SO(discD(c, 11) + ko.d + ticks)],
  };
});

/**
 * A key pointing left with an x; the tip is solved so each treatment paints 1.
 * The x is centred by its clearances, not on the rectangle: on (14, 12) it is 3
 * from the right wall, the top and the bottom, and 2.86 from the flanks.
 */
set('delete', [1, 3, 23, 21], (sharp) => {
  const box = [1, 3, 23, 21];
  const radii = sq([1, 2, 3, 3, 2], sharp);
  const mk = (tx) => polyContour([[tx, 12], [9, 4], [22, 4], [22, 20], [9, 20]], radii);
  const tx = solve((v) => exactInk(mk(v).d, sharp)[0], 1, -2, 4);
  const body = mk(tx);
  const x1 = run([[11, 9], [17, 15]], [], { sharp, free: [true, true], box }), x2 = run([[17, 9], [11, 15]], [], { sharp, free: [true, true], box });
  const pl = plate(body.segs);
  return {
    stroke: [S(body.d + x1.d + x2.d)],
    'two-tone': [PL(pl), S(body.d + x1.d + x2.d)],
    duotone: [PL(pl), S(x1.d + x2.d)],
    fill: [SO(pl + inkUnion([x1.segs, x2.segs], sharp))],
  };
});

/**
 * His accessibility (refs/accessibility.svg, 17 Sep): a ring r=10 with a figure
 * whose head is a bead of 1.5 on (12, 6.5), 2 inside the ring. His arms on 10
 * came 1 under that head, and a 3-across head cannot clear both the ring and
 * arms at 10 by 2, so arms, spine and hips drop one: arms 8..16 on 11, spine
 * 11..13, legs from (12, 13) to his feet on (10, 17) and (14, 17), 2.6 inside.
 */
set('accessibility', [1, 1, 23, 23], (sharp) => {
  const box = [1, 1, 23, 23];
  const arms = run([[8, 11], [16, 11]], [], { sharp, free: [true, true], box });
  const spine = run([[12, 11], [12, 13]], [], { sharp });
  const legs = run([[10, 17], [12, 13], [14, 17]], [0, 0, 0], { sharp, free: [true, true], box });
  const head = discD([12, 6.5], 1.5);
  const figure = arms.d + spine.d + legs.d;
  const koSpine = run([[12, 11.5], [12, 14]], [], { sharp });
  return {
    stroke: [S(discD([12, 12], 10) + figure), DOT(head)],
    'two-tone': [PL(discD([12, 12], 11)), S(discD([12, 12], 10) + figure), DOT(head)],
    duotone: [PL(discD([12, 12], 11)), S(figure), DOT(head)],
    fill: [SO(discD([12, 12], 11) + inkUnion([arms.segs, koSpine.segs, legs.segs], sharp) + head)],
  };
});

/* ------------------------------------------------------------- the write */

/**
 * What a 2-unit stroke actually paints: every flattened piece's rectangle, a
 * disc at every interior vertex (the round join), and at the two ends of an
 * open subpath a disc for a round cap or nothing past the face for a butt one.
 * strokedBBox approximates a butt end by the stadium inside it, which reads a
 * slanted sharp end up to 0.414 short.
 */
function exactInk(d, sharp) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  const put = (p) => { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); };
  for (const sp of expandHV(d).split(/(?=M)/).filter(Boolean)) {
    const closed = /Z\s*$/.test(sp);
    const pts = subpathPts(sp.replace(/Z\s*$/, '')).filter((p, i, a) => i === 0 || len(sub(p, a[i - 1])) > 1e-9);
    if (closed && len(sub(pts[0], pts[pts.length - 1])) > 1e-9) pts.push(pts[0]);
    for (let i = 0; i + 1 < pts.length; i++) {
      const u = unit(sub(pts[i + 1], pts[i])), nrm = [-u[1], u[0]];
      for (const p of [pts[i], pts[i + 1]]) { put(add(p, nrm)); put(sub(p, nrm)); }
    }
    pts.forEach((p, i) => {
      const end = !closed && (i === 0 || i === pts.length - 1);
      if (!end || !sharp) { put([p[0] - 1, p[1] - 1]); put([p[0] + 1, p[1] + 1]); }
    });
  }
  return b;
}
function inkOf(layers, sharp) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const l of layers) {
    if (!l.d) continue;
    const q = l.kind === 'stroke' || l.kind === 'muted' ? exactInk(l.d, sharp) : strokedBBox(l.d, 0, 'butt');
    b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[2]); b[3] = Math.max(b[3], q[3]);
  }
  return b;
}
function deadPieces(d) {
  const bad = [];
  for (const m of d.matchAll(/C(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+)/g)) {
    const v = m.slice(1).map(Number);
    if (Math.abs(v[0] - v[4]) < 1e-3 && Math.abs(v[1] - v[5]) < 1e-3 && Math.abs(v[2] - v[4]) < 1e-3 && Math.abs(v[3] - v[5]) < 1e-3) bad.push(m[0]);
  }
  for (const m of d.matchAll(/([\d.-]+) ([\d.-]+)L([\d.-]+) ([\d.-]+)(?=[MLCZ]|$)/g)) if (Math.hypot(m[1] - m[3], m[2] - m[4]) < 1e-3) bad.push(m[0]);
  return bad;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const outArg = args.find((a) => a.startsWith('--out='));
  const OUT = outArg ? resolve(outArg.slice(6)) : ROOT;
  const want = args.filter((a) => !a.startsWith('--'));
  let failed = 0;
  for (const [name, build] of Object.entries(SETS)) {
    if (want.length && !want.includes(name)) continue;
    const dir = join(OUT, 'raw', name);
    mkdirSync(dir, { recursive: true });
    const notes = [];
    for (const corners of ['regular', 'sharp']) {
      const sharp = corners === 'sharp';
      const styles = build(sharp);
      for (const style of ['stroke', 'two-tone', 'duotone', 'fill']) {
        const layers = styles[style];
        const b = inkOf(layers, sharp);
        const off = Math.max(...b.map((v, i) => Math.abs(v - build.box[i])));
        if (off > 0.003) notes.push(`${style} ${corners} ink ${b.map((v) => v.toFixed(3)).join(',')}`);
        for (const l of layers) for (const x of deadPieces(l.d || '')) notes.push(`${style} ${corners} dead ${x}`);
        writeFileSync(join(dir, `Container=regular, Style=${style}, Corners=${corners}.svg`), doc(layers, sharp));
      }
    }
    if (notes.length) failed++;
    console.log(name.padEnd(22), 'box', build.box.join(','), notes.length ? '\n  ' + notes.join('\n  ') : 'ok');
  }
  if (failed) process.exitCode = 1;
}

export { SETS };
