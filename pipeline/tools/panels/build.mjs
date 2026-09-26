// The missing panel-* names, 14 Sep 2026, derived from the shipped family on origin/main:
//   panel-<side>-dashed        close-dashed without its chevron
//   panel-<side>-open-dashed   close-dashed with the chevron turned in its own slot
//   panel-<side>-close/-open   panel-<side> with that chevron; fill knocks it out
//   panels-left-bottom, panels-right-bottom, panels-top-left: two dividers meeting in a T
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as G from './geo.mjs';
const REPO = resolve(import.meta.dirname, '../..');
const OUT = process.env.OUT || join(import.meta.dirname, 'out');
const git = (p) => execFileSync('git', ['-C', REPO, 'show', `origin/main:raw/${p}`], { encoding: 'utf8' });
const read = (name, style, corners) => git(`${name}/Container=regular, Style=${style}, Corners=${corners}.svg`);
const paths = (svg) => [...svg.matchAll(/<path d="([^"]+)"([^>]*)\/>/g)].map((m) => ({ d: m[1], attrs: m[2] }));
const HEAD = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
const doc = (ps) => [HEAD, ...ps.map((p) => `<path d="${p.d}"${p.attrs}/>`), '</svg>', ''].join('\n');
const f4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return String(Object.is(r, -0) ? 0 : r); };
const write = (name, variants) => {
  mkdirSync(join(OUT, 'raw', name), { recursive: true });
  for (const [k, ps] of Object.entries(variants)) {
    const [style, corners] = k.split('.');
    writeFileSync(join(OUT, 'raw', name, `Container=regular, Style=${style}, Corners=${corners}.svg`), doc(ps));
  }
};
const KEYS = ['stroke.regular', 'duotone.regular', 'fill.regular', 'stroke.sharp', 'duotone.sharp', 'fill.sharp'];
const SIDES = ['left', 'right', 'top', 'bottom'];
// the regular chevron's own axis, so a turned chevron keeps its slot and sharp keeps its extended ends outside
const AXIS = { left: ['x', 14.5], right: ['x', 9.5], top: ['y', 14.5], bottom: ['y', 9.5] };
const isChevron = (d) => /^M[\d.]+ [\d.]+L[\d.]+ [\d.]+L[\d.]+ [\d.]+$/.test(d);
function turn(d, side) {
  const [ax, c] = AXIS[side];
  return d.replace(/([ML])([\d.]+) ([\d.]+)/g, (m, cmd, x, y) => (ax === 'x' ? `${cmd}${f4(2 * c - +x)} ${y}` : `${cmd}${x} ${f4(2 * c - +y)}`));
}
/**
 * The panel strip's plate: its stroke outline grown by 1. Corners on the icon's edge take r=4
 * (r=3 grown) or r=1 sharp; the two on the divider take r=1, the round join's own arc.
 */
function plate(side, sharp) {
  const box = { left: [2, 2, 10, 22], right: [14, 2, 22, 22], top: [2, 2, 22, 10], bottom: [2, 14, 22, 22] }[side];
  const [x0, y0, x1, y1] = box, o = sharp ? 1 : 4, i = 1;
  // radii clockwise from top-left: tl, tr, br, bl
  const r = { left: [o, i, i, o], right: [i, o, o, i], top: [o, o, i, i], bottom: [i, i, o, o] }[side];
  const k = 0.55228, n = (v) => f4(v);
  const [tl, tr, br, bl] = r;
  return `M${n(x0 + tl)} ${n(y0)}L${n(x1 - tr)} ${n(y0)}C${n(x1 - tr + tr * k)} ${n(y0)} ${n(x1)} ${n(y0 + tr - tr * k)} ${n(x1)} ${n(y0 + tr)}`
    + `L${n(x1)} ${n(y1 - br)}C${n(x1)} ${n(y1 - br + br * k)} ${n(x1 - br + br * k)} ${n(y1)} ${n(x1 - br)} ${n(y1)}`
    + `L${n(x0 + bl)} ${n(y1)}C${n(x0 + bl - bl * k)} ${n(y1)} ${n(x0)} ${n(y1 - bl + bl * k)} ${n(x0)} ${n(y1 - bl)}`
    + `L${n(x0)} ${n(y0 + tl)}C${n(x0)} ${n(y0 + tl - tl * k)} ${n(x0 + tl - tl * k)} ${n(y0)} ${n(x0 + tl)} ${n(y0)}Z`;
}
const STROKE = (cap) => ` stroke="black" stroke-width="2" stroke-linecap="${cap}" stroke-linejoin="round"`;

for (const side of SIDES) {
  const cd = Object.fromEntries(KEYS.map((k) => [k, paths(read(`panel-${side}-close-dashed`, ...k.split('.')))]));
  const base = Object.fromEntries(KEYS.map((k) => [k, paths(read(`panel-${side}`, ...k.split('.')))]));
  for (const k of KEYS) {
    const last = cd[k].at(-1);
    if (!isChevron(last.d)) throw new Error(`panel-${side}-close-dashed ${k}: last layer is not the chevron: ${last.d}`);
  }
  // The shipped plate (and fill solid) squares the two corners where the panel meets the body, which
  // pokes 0.42 past the stroke's round join. Rebuild it as the panel's own outline offset by 1, so every
  // corner is the join's arc; the rest of it lands on the shipped plate.
  const fixPlate = (k) => plate(side, k.split('.')[1] === 'sharp');
  const dashedLayers = (k) => cd[k].slice(0, -1).map((l, i) => (i === 0 && !k.startsWith('stroke') ? { ...l, d: fixPlate(k) } : l));
  // dashed: the chevron layer dropped
  write(`panel-${side}-dashed`, Object.fromEntries(KEYS.map((k) => [k, dashedLayers(k)])));
  // open-dashed: the chevron turned
  write(`panel-${side}-open-dashed`, Object.fromEntries(KEYS.map((k) => [k, [...dashedLayers(k), { ...cd[k].at(-1), d: turn(cd[k].at(-1).d, side) }]])));
  // close / open on the solid panel
  for (const state of ['close', 'open']) {
    const v = {};
    for (const corners of ['regular', 'sharp']) {
      const cap = corners === 'sharp' ? 'butt' : 'round';
      let chev = cd[`stroke.${corners}`].at(-1).d;
      if (state === 'open') chev = turn(chev, side);
      const bs = base[`stroke.${corners}`][0], bd = base[`duotone.${corners}`], bf = base[`fill.${corners}`][0];
      v[`stroke.${corners}`] = [{ d: bs.d + chev, attrs: bs.attrs }];
      v[`duotone.${corners}`] = [bd[0], { d: bs.d + chev, attrs: bs.attrs }];
      // fill: the panel's own solid with the chevron's painted outline knocked out, wound against the outer ring
      const outer = G.parse(bf.d)[0].segs;
      const hole = G.against(outer, G.capsule(G.run(chev), cap));
      v[`fill.${corners}`] = [{ d: bf.d + G.emit(hole, true), attrs: bf.attrs }];
    }
    write(`panel-${side}-${state}`, v);
  }
}

// composites: the rectangle and two dividers meeting in a T; fill knocks the T out to the outline's inner edge
const COMP = {
  'panels-left-bottom': { lines: 'M9 3V21M9 15H21', slot: [[8, 4], [10, 4], [10, 14], [20, 14], [20, 16], [10, 16], [10, 20], [8, 20]] },
  'panels-right-bottom': { lines: 'M15 3V21M15 15H3', slot: [[14, 4], [16, 4], [16, 20], [14, 20], [14, 16], [4, 16], [4, 14], [14, 14]] },
  'panels-top-left': { lines: 'M3 9H21M9 9V21', slot: [[4, 8], [20, 8], [20, 10], [10, 10], [10, 20], [8, 20], [8, 10], [4, 10]] },
};
const left = Object.fromEntries(KEYS.map((k) => [k, paths(read('panel-left', ...k.split('.')))]));
for (const [name, { lines, slot }] of Object.entries(COMP)) {
  const v = {};
  for (const corners of ['regular', 'sharp']) {
    const s = left[`stroke.${corners}`][0];
    const rect = s.d.replace(/M9 3V21$|M9 3L9 21$/, '');
    if (rect === s.d) throw new Error('panel-left stroke did not end in its divider: ' + s.d);
    // sharp spells every segment as an absolute L, as panel-left's sharp file does
    const sharpLines = lines.replace(/M([\d.]+) ([\d.]+)([VH])([\d.]+)/g, (m, x, y, c, v) => (c === 'V' ? `M${x} ${y}L${x} ${v}` : `M${x} ${y}L${v} ${y}`));
    const strokeD = rect + (corners === 'sharp' ? sharpLines : lines);
    const fillOuter = left[`fill.${corners}`][0].d.replace(/M8 4L8 20L10 20L10 4L8 4Z$/, '');
    if (fillOuter === left[`fill.${corners}`][0].d) throw new Error('panel-left fill slot not found');
    const outer = G.parse(fillOuter)[0].segs;
    const holeSegs = slot.map((p, i) => ({ t: 'L', p: [p, slot[(i + 1) % slot.length]] }));
    const hole = G.against(outer, holeSegs);
    v[`stroke.${corners}`] = [{ d: strokeD, attrs: s.attrs }];
    v[`duotone.${corners}`] = [left[`duotone.${corners}`][0], { d: strokeD, attrs: s.attrs }];
    v[`fill.${corners}`] = [{ d: fillOuter + G.emit(hole, true), attrs: left[`fill.${corners}`][0].attrs }];
  }
  write(name, v);
}
console.log('written to', OUT);

// The shipped four panel-<side>-close-dashed, fixed on his word 14 Sep 2026: the same plate rebuild, nothing else
// touched. Written to OUT/fixed/raw so the redraw stays apart from the new names.
for (const side of SIDES) {
  const name = `panel-${side}-close-dashed`;
  const v = {};
  for (const k of KEYS) {
    const layers = paths(read(name, ...k.split('.')));
    v[k] = k.startsWith('stroke') ? layers : layers.map((l, i) => (i === 0 ? { ...l, d: plate(side, k.endsWith('sharp')) } : l));
  }
  const dir = join(OUT, 'fixed', 'raw', name);
  mkdirSync(dir, { recursive: true });
  for (const [k, ps] of Object.entries(v)) {
    const [style, corners] = k.split('.');
    writeFileSync(join(dir, `Container=regular, Style=${style}, Corners=${corners}.svg`), doc(ps));
  }
}
