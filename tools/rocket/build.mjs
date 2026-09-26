// rocket, rocket-2 and rocket-vertical, 15 Sep 2026.
//
// Learned from four samples he pasted, none of them copied: a flat base flaring
// slightly into a long forward arc and a small nose, so the body is widest near
// the rear; fins hung off that rear flank, trailing past the base; the corner
// behind it holding a flame or speed lines. Measured in an axis frame (u along the
// rocket from the base centre, v across) and rebuilt on our stroke, grid and ladder.
//
//   rocket           45 degrees, flame (our droplet's 11:7 proportion)
//   rocket-2         45 degrees, the same rocket at the same size, two speed lines
//   rocket-vertical  upright, no flame, so it keeps the 45's own proportions
//
// duotone  the silhouette and the flame, each grown by one, at 0.4
// fill     the body (base, flanks, nose) and the flame solid under the whole
//          stroke layer; the fins stay open, `package`'s pattern
// sharp    every fillet out, butt caps, the speed lines' free ends cut on their
//          dominant axis (0.414 at 45), and every vertex that would paint past the
//          rounded box slid back until it does not: the nose along the axis, the
//          flame's apex along the axis, the upright's fin tips on their own edges
//
//   node tools/rocket/build.mjs [--out=<dir>]     writes raw/<name>/ (all six files)
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { add, sub, mul, len, unit, pt } from '../v5/geom.mjs';
import { strokedBBox, outlines, minGap } from '../../pipeline/lib/geom.mjs';
import { contour, grow } from './contour.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? `${ROOT}/raw`;
const seg = (a, b) => `M${pt(a)}L${pt(b)}`;
const bisect = (f, lo, hi, n = 34) => { for (let i = 0; i < n; i++) { const m = (lo + hi) / 2; if (f(m)) lo = m; else hi = m; } return (lo + hi) / 2; };

/* ------------------------------------------------------------------ geometry */

const frame = (O, a) => {
  const d = [Math.cos(a), Math.sin(a)], nr = [-Math.sin(a), Math.cos(a)];
  return (u, v) => [O[0] + u * d[0] + v * nr[0], O[1] + u * d[1] + v * nr[1]];
};

/* the forward arc: tangent to the rear flank at J = (s, w), through the nose (un, 0) */
function forward({ b, s, w, un }) {
  const t = unit([s, w - b]), D = un - s;
  const R = (D * D + w * w) / (2 * (D * t[1] + w * t[0]));
  return { R, c: [s + R * t[1], w - R * t[0]] };
}

/* Everything in one pass. q carries lengths already scaled; rn and fr are the nose
   and fin-tip radii, fa the flame's apex radius. */
function rocket(L, q, kind, sharp) {
  const { b, s, w, un, fo, ft } = q;
  const f = forward(q);
  const Cp = L(...f.c), Cm = L(f.c[0], -f.c[1]);
  const mid = L(s * 0.5, 0);
  const tipBack = [-ft, b + ft], lead0 = [s - fo, w + fo];
  const rn = sharp ? 0 : 1, fr = sharp ? 0 : 1;
  const fin = (g) => ({
    trail: { line: [L(0, g * b), L(tipBack[0], g * tipBack[1])], inside: L(-ft / 2 + 0.3, g * (b + ft / 2 + 0.3)) },
    outer: { line: [L(tipBack[0], g * tipBack[1]), L(lead0[0], g * lead0[1])], inside: L((tipBack[0] + lead0[0]) / 2, g * ((tipBack[1] + lead0[1]) / 2 - 0.3)) },
    lead: { line: [L(lead0[0], g * lead0[1]), L(s, g * w)], inside: L((lead0[0] + s) / 2 - 0.3, g * ((lead0[1] + w) / 2 - 0.3)) },
  });
  const P = fin(1), M = fin(-1);
  const arcP = { circle: [Cp, f.R], inside: mid }, arcM = { circle: [Cm, f.R], inside: mid };
  const base = { line: [L(0, -1), L(0, 1)], inside: L(1, 0) };
  const out = (g, du, dv) => L(du, g * dv);
  const silEdges = [base, P.trail, P.outer, P.lead, arcP, arcM, M.lead, M.outer, M.trail];
  const silCorners = [
    { r: 0, hint: L(0, b), I: L(-1, b + 2), reflex: true },
    { r: fr, hint: L(...tipBack), I: L(tipBack[0] + 1, tipBack[1] - 0.2) },
    { r: fr, hint: L(...lead0), I: L(lead0[0] - 0.3, lead0[1] - 0.6) },
    { r: 0, hint: L(s, w), I: out(1, s - 1, w + 2), reflex: true },
    { r: rn, hint: L(un, 0), I: L(un - 2, 0) },
    { r: 0, hint: L(s, -w), I: out(-1, s - 1, w + 2), reflex: true },
    { r: fr, hint: L(lead0[0], -lead0[1]), I: L(lead0[0] - 0.3, -(lead0[1] - 0.6)) },
    { r: fr, hint: L(tipBack[0], -tipBack[1]), I: L(tipBack[0] + 1, -(tipBack[1] - 0.2)) },
    { r: 0, hint: L(0, -b), I: L(-1, -(b + 2)), reflex: true },
  ];
  const sil = contour(silEdges, silCorners).d;
  const silPlate = grow(silEdges, silCorners).d;
  const sep = seg(L(0, b), L(s, w)) + seg(L(0, -b), L(s, -w));
  // the body alone, on the centre line, for the fill
  const flankP = { line: [L(0, b), L(s, w)], inside: mid }, flankM = { line: [L(s, -w), L(0, -b)], inside: mid };
  const body = contour([base, flankP, arcP, arcM, flankM], [
    { r: 0, hint: L(0, b), I: mid }, { r: 0, hint: L(s, w) }, { r: rn, hint: L(un, 0), I: L(un - 2, 0) }, { r: 0, hint: L(s, -w) }, { r: 0, hint: L(0, -b), I: mid },
  ]).d;

  const parts = { stroke: [sil, sep], plate: [silPlate], fill: [body] };
  if (kind === 'flame') {
    const r = q.fl, cu = -1 - q.gap - 1 - r, au = cu - q.fa * r;
    const C = L(cu, 0), A = L(au, 0), e = unit(sub(C, A)), dd = len(sub(C, A));
    const tl = Math.sqrt(dd * dd - r * r), phi = Math.asin(r / dd);
    const rot = (v, t) => [v[0] * Math.cos(t) - v[1] * Math.sin(t), v[0] * Math.sin(t) + v[1] * Math.cos(t)];
    const T1 = add(A, mul(rot(e, phi), tl)), T2 = add(A, mul(rot(e, -phi), tl));
    const edges = [
      { line: [A, T1], inside: C }, { circle: [C, r], inside: C }, { line: [T2, A], inside: C },
    ];
    const corners = [{ r: 0, hint: T1, I: C, tangent: true }, { r: 0, hint: T2, I: C, away: A, tangent: true }, { r: sharp ? 0 : 1, hint: A, I: C }];
    const drop = contour(edges, corners).d;
    parts.stroke.push(drop); parts.plate.push(grow(edges, corners).d); parts.fill.push(drop);
  }
  if (kind === 'lines') {
    // each line starts where its cap clears the rocket by 2 and runs back until its
    // ink reaches the padding the flame reached; the upper one starts a unit later
    const cut = sharp ? Math.SQRT2 - 1 : 0;      // the butt cap's dominant-axis extension
    const line = (g, late) => {
      const v = g * q.lv;
      const u0 = q.lines[g > 0 ? 0 : 1], u1 = q.lines[g > 0 ? 2 : 3];
      return seg(L(u0 - late + cut, v), L(u1 - cut, v));
    };
    parts.stroke.push(line(1, 0) + line(-1, 1));
  }
  return parts;
}

/* the drawing's painted box, stroke and plate together */
const box = (p, sharp) => {
  const d = p.stroke.join('');
  return strokedBBox(d, 1, sharp ? 'butt' : 'round', 64, 'round');
};
const pads = (bb) => [bb[0], bb[1], 24 - bb[2], 24 - bb[3]];

/* ----------------------------------------------------------------- the three */

const DIAG = -Math.PI / 4, UP = -Math.PI / 2;
// option 1 in its sample's units, then scaled by k; radii and gaps never scale
const Q = { b: 2.4, s: 7, w: 3.6, un: 17.5, fo: 3.2, ft: 1.8, fl: 2, fa: 11 / 7, gap: 2 };
const scaled = (q, k) => ({ ...q, b: q.b * k, s: q.s * k, w: q.w * k, un: q.un * k, fo: q.fo * k, ft: q.ft * k, fl: q.fl * k });

function centred(a, q, kind, sharp) {
  let O = [12, 12];
  for (let i = 0; i < 6; i++) {
    const p = pads(box(rocket(frame(O, a), q, kind, sharp), sharp));
    O = [O[0] + (p[2] - p[0]) / 2, O[1] + (p[3] - p[1]) / 2];
  }
  return O;
}

function solve() {
  const res = {};
  // rocket: k until every pad is 1
  const kF = bisect((k) => { const q = scaled(Q, k); const O = centred(DIAG, q, 'flame', false); return Math.min(...pads(box(rocket(frame(O, DIAG), q, 'flame', false), false))) > 1; }, 0.8, 1.3);
  const qF = scaled(Q, kF), OF = centred(DIAG, qF, 'flame', false);
  res.rocket = { a: DIAG, O: OF, q: qF, kind: 'flame' };

  // rocket-2: the same rocket where it stands; lines at ±2 from where they clear the fins
  // by 2 back to the flame's padding
  const L = frame(OF, DIAG), base = rocket(L, qF, 'bare', false), ink = base.stroke.join('');
  const gapTo = (d) => { let g = Infinity; for (const a of outlines(ink)) for (const x of outlines(d)) g = Math.min(g, minGap(a, x)); return g - 2; };
  const lv = 2, lines = [];
  for (const g of [1, -1]) {
    const u0 = bisect((u) => gapTo(seg(L(u, g * lv), L(u - 0.01, g * lv))) >= 2, -12, 0);
    const u1 = bisect((u) => { const bb = strokedBBox(seg(L(u0, g * lv), L(u, g * lv)), 1, 'round'); return g > 0 ? 24 - bb[3] < 1 : bb[0] < 1; }, -20, u0);
    lines.push(u0, u1);
  }
  res['rocket-2'] = { a: DIAG, O: OF, q: { ...qF, lv, lines: [lines[0], lines[2], lines[1], lines[3]] }, kind: 'lines' };

  // rocket-vertical: k to a height of 22, the fin reach to a width of 16
  const vAt = (fo) => {
    const k = bisect((k) => { const q = scaled({ ...Q, fo }, k); const O = centred(UP, q, 'bare', false); return pads(box(rocket(frame(O, UP), q, 'bare', false), false))[1] > 1; }, 0.8, 1.4);
    const q = scaled({ ...Q, fo }, k);
    return { q, O: centred(UP, q, 'bare', false) };
  };
  const fo = bisect((fo) => { const v = vAt(fo); return pads(box(rocket(frame(v.O, UP), v.q, 'bare', false), false))[0] > 4; }, 2, 5, 24);
  const V = vAt(fo);
  res['rocket-vertical'] = { a: UP, O: V.O, q: V.q, kind: 'bare' };

  // sharp: the same O; slide what pokes past the rounded box back until it does not
  for (const r of Object.values(res)) {
    const target = pads(box(rocket(frame(r.O, r.a), r.q, r.kind, false), false));
    const qs = { ...r.q };
    const pad = (q) => pads(box(rocket(frame(r.O, r.a), q, r.kind, true), true));
    qs.un = bisect((un) => pad({ ...qs, un })[1] >= target[1] - 1e-6, r.q.un - 4, r.q.un + 0.001, 40);
    if (r.kind === 'flame') qs.fa = bisect((fa) => pad({ ...qs, fa })[0] >= target[0] - 1e-6, 0.8, r.q.fa + 0.001, 40);
    if (r.kind === 'bare') {
      qs.ft = bisect((ft) => pad({ ...qs, ft })[3] >= target[3] - 1e-6, 0, r.q.ft + 0.001, 40);
      qs.fo = bisect((fo) => pad({ ...qs, fo })[0] >= target[0] - 1e-6, 0, r.q.fo + 0.001, 40);
    }
    r.qs = qs;
  }
  return res;
}

/* -------------------------------------------------------------------- files */

const HEAD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
const strokeP = (d, sharp) => `<path d="${d}" stroke="black" stroke-width="2" stroke-linecap="${sharp ? 'butt' : 'round'}" stroke-linejoin="round"/>`;
const file = (paths) => `${HEAD}\n${paths.join('\n')}\n</svg>\n`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const res = solve();
  for (const [name, r] of Object.entries(res)) {
    for (const sharp of [false, true]) {
      const p = rocket(frame(r.O, r.a), sharp ? r.qs : r.q, r.kind, sharp);
      const st = strokeP(p.stroke.join(''), sharp);
      const files = {
        stroke: file([st]),
        duotone: file([`<path d="${p.plate.join('')}" fill="black" fill-opacity="0.4"/>`, st]),
        fill: file([`<path d="${p.fill.join('')}" fill="black"/>`, st]),
      };
      mkdirSync(`${OUT}/${name}`, { recursive: true });
      for (const [style, src] of Object.entries(files)) {
        // the ink box is asserted before anything is written
        const bb = strokedBBox(p.stroke.join(''), 1, sharp ? 'butt' : 'round', 64, 'round');
        if (bb[0] < 0.99 || bb[1] < 0.99 || bb[2] > 23.01 || bb[3] > 23.01) throw new Error(`${name} ${style} ${sharp} leaves the canvas: ${bb}`);
        if (/C([\d.-]+) ([\d.-]+) \1 \2 \1 \2/.test(src)) throw new Error(`${name} ${style}: zero-length cubic`);
        writeFileSync(`${OUT}/${name}/Container=regular, Style=${style}, Corners=${sharp ? 'sharp' : 'regular'}.svg`, src);
      }
      console.log(name, sharp ? 'sharp  ' : 'regular', 'pads', pads(box(p, sharp)).map((v) => v.toFixed(3)).join(' '));
    }
    const fmt = (q) => Object.entries(q).map(([k, v]) => `${k}=${Array.isArray(v) ? v.map((x) => x.toFixed(4)).join('/') : typeof v === 'number' ? v.toFixed(4) : v}`).join(' ');
    console.log('  O', r.O.map((v) => v.toFixed(4)).join(','), '\n  regular', fmt(r.q), '\n  sharp  ', fmt(r.qs));
  }
}
