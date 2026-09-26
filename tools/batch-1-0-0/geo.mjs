// Exact-ish stroke geometry for free cubic runs: offsets, joins, loop removal,
// capsules, and a band clipped to a silhouette's inner ink. Segments are
// {t:'L', p:[a,b]} or {t:'C', p:[a,b,c,d]}.
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
export const len = (a) => Math.hypot(a[0], a[1]), unit = (a) => mul(a, 1 / (len(a) || 1));
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const left = (t) => [t[1], -t[0]];
const f = (v) => { const r = Math.round(v * 1e4) / 1e4; return String(Object.is(r, -0) ? 0 : r); };
const P = (p) => `${f(p[0])} ${f(p[1])}`;

export function parse(d) {
  const t = d.match(/[MLCZHV]|-?\d*\.?\d+(?:e-?\d+)?/gi) || []; let i = 0, cmd, cur = null, st = null; const subs = [];
  while (i < t.length) {
    if (/[MLCZHV]/i.test(t[i])) cmd = t[i++].toUpperCase();
    if (cmd === 'H' || cmd === 'V') { const v = +t[i++]; const q = cmd === 'H' ? [v, cur[1]] : [cur[0], v]; if (len(sub(q, cur)) > 1e-9) subs.at(-1).segs.push({ t: 'L', p: [cur, q] }); cur = q; continue; }
    if (cmd === 'M') { cur = [+t[i++], +t[i++]]; st = cur; subs.push({ segs: [], closed: false }); cmd = 'L'; continue; }
    const s = subs.at(-1);
    if (cmd === 'L') { const q = [+t[i++], +t[i++]]; if (len(sub(q, cur)) > 1e-9) s.segs.push({ t: 'L', p: [cur, q] }); cur = q; }
    else if (cmd === 'C') { const q = [cur, [+t[i++], +t[i++]], [+t[i++], +t[i++]], [+t[i++], +t[i++]]]; s.segs.push({ t: 'C', p: q }); cur = q[3]; }
    else if (cmd === 'Z') { if (len(sub(cur, st)) > 1e-9) s.segs.push({ t: 'L', p: [cur, st] }); s.closed = true; cur = st; }
  }
  return subs;
}
export const run = (d) => parse(d)[0].segs;
export const p0 = (s) => s.p[0], p1 = (s) => s.p.at(-1);
export function at(s, t) {
  if (s.t === 'L') return add(s.p[0], mul(sub(s.p[1], s.p[0]), t));
  const [a, b, c, d] = s.p, u = 1 - t;
  return [0, 1].map((i) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]);
}
export function der(s, t) {
  if (s.t === 'L') return sub(s.p[1], s.p[0]);
  const [a, b, c, d] = s.p, u = 1 - t;
  return [0, 1].map((i) => 3 * u * u * (b[i] - a[i]) + 6 * u * t * (c[i] - b[i]) + 3 * t * t * (d[i] - c[i]));
}
export function tan(s, t) {
  const v = der(s, t); if (len(v) > 1e-9) return unit(v);
  const e = 1e-4; return unit(t < 0.5 ? sub(at(s, e), at(s, 0)) : sub(at(s, 1), at(s, 1 - e)));
}
export function split(s, t) {
  if (s.t === 'L') { const m = at(s, t); return [{ t: 'L', p: [s.p[0], m] }, { t: 'L', p: [m, s.p[1]] }]; }
  const L = (a, b) => add(a, mul(sub(b, a), t)); const [a, b, c, d] = s.p;
  const ab = L(a, b), bc = L(b, c), cd = L(c, d), abc = L(ab, bc), bcd = L(bc, cd), m = L(abc, bcd);
  return [{ t: 'C', p: [a, ab, abc, m] }, { t: 'C', p: [m, bcd, cd, d] }];
}
export const rev = (s) => ({ t: s.t, p: [...s.p].reverse() });
export const revRun = (r) => r.map(rev).reverse();
export const segLen = (s) => (s.t === 'L' ? len(sub(s.p[1], s.p[0])) : Array.from({ length: 16 }, (_, i) => len(sub(at(s, (i + 1) / 16), at(s, i / 16)))).reduce((a, b) => a + b, 0));

export function refine(r, max = 1) {
  const out = [];
  for (const s of r) {
    if (s.t === 'L') { out.push(s); continue; }
    const n = Math.max(1, Math.ceil(segLen(s) / max)); let k = s;
    for (let j = n; j > 1; j--) { const [a, b] = split(k, 1 / j); out.push(a); k = b; }
    out.push(k);
  }
  return out;
}

export function emit(r, closed = false) {
  let d = `M${P(r[0].p[0])}`;
  for (const s of r) d += s.t === 'L' ? `L${P(s.p[1])}` : `C${P(s.p[1])} ${P(s.p[2])} ${P(s.p[3])}`;
  return closed ? d + 'Z' : d;
}

/** Arc about c from point A to point B, sweeping `sweep` radians (sign = direction in atan2 terms). */
export function arc(c, r, a0, sweep) {
  const n = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2) - 1e-9)), out = [];
  for (let i = 0; i < n; i++) {
    const t0 = a0 + (sweep * i) / n, t1 = a0 + (sweep * (i + 1)) / n, k = (4 / 3) * Math.tan((t1 - t0) / 4) * r;
    const s0 = [c[0] + r * Math.cos(t0), c[1] + r * Math.sin(t0)], s1 = [c[0] + r * Math.cos(t1), c[1] + r * Math.sin(t1)];
    out.push({ t: 'C', p: [s0, [s0[0] - k * Math.sin(t0), s0[1] + k * Math.cos(t0)], [s1[0] + k * Math.sin(t1), s1[1] - k * Math.cos(t1)], s1] });
  }
  return out;
}
const angOf = (v) => Math.atan2(v[1], v[0]);

function offsetCubic(s, d) {
  const k = s.p, t0 = tan(s, 0), t1 = tan(s, 1);
  const q0 = add(k[0], mul(left(t0), d)), q3 = add(k[3], mul(left(t1), d));
  const m = add(at(s, 0.5), mul(left(tan(s, 0.5)), d));
  const v = mul(sub(m, mul(add(q0, q3), 0.5)), 8 / 3), nt1 = mul(t1, -1), det = cross(t0, nt1);
  if (Math.abs(det) < 1e-9) return { t: 'C', p: [q0, add(q0, mul(sub(q3, q0), 1 / 3)), add(q0, mul(sub(q3, q0), 2 / 3)), q3] };
  return { t: 'C', p: [q0, add(q0, mul(t0, cross(v, nt1) / det)), sub(q3, mul(t1, cross(t0, v) / det)), q3] };
}
function offsetSegs(s, d, depth = 0) {
  if (s.t === 'L') { const n = mul(left(tan(s, 0)), d); return [{ t: 'L', p: [add(s.p[0], n), add(s.p[1], n)] }]; }
  const o = offsetCubic(s, d);
  let err = 0;
  for (let i = 1; i < 8; i++) { const u = i / 8, want = add(at(s, u), mul(left(tan(s, u)), d)); err = Math.max(err, distToSeg(want, o)); }
  if (err < 0.002 || depth > 6) return [o];
  const [a, b] = split(s, 0.5); return [...offsetSegs(a, d, depth + 1), ...offsetSegs(b, d, depth + 1)];
}

/* distance helpers */
export function samples(r, step = 0.02) {
  const pts = [];
  for (const s of r) { const n = Math.max(2, Math.ceil(segLen(s) / step)); for (let i = 0; i <= n; i++) pts.push(at(s, i / n)); }
  return pts;
}
function distToSeg(p, s) {
  let best = Infinity, bt = 0;
  for (let i = 0; i <= 32; i++) { const q = at(s, i / 32), dd = len(sub(q, p)); if (dd < best) { best = dd; bt = i / 32; } }
  let lo = Math.max(0, bt - 1 / 32), hi = Math.min(1, bt + 1 / 32);
  for (let k = 0; k < 30; k++) { const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3; if (len(sub(at(s, a), p)) < len(sub(at(s, b), p))) hi = b; else lo = a; }
  return len(sub(at(s, (lo + hi) / 2), p));
}
export const distToRun = (p, r) => Math.min(...r.map((s) => distToSeg(p, s)));

/* intersections */
function segHits(A, B) {
  const n = A.t === 'L' ? 1 : 40, m = B.t === 'L' ? 1 : 40, hits = [];
  const pa = Array.from({ length: n + 1 }, (_, i) => at(A, i / n)), pb = Array.from({ length: m + 1 }, (_, i) => at(B, i / m));
  const bb = (q) => [Math.min(...q.map((x) => x[0])), Math.min(...q.map((x) => x[1])), Math.max(...q.map((x) => x[0])), Math.max(...q.map((x) => x[1]))];
  const ba = bb(pa), bB = bb(pb);
  if (ba[0] > bB[2] + 1e-6 || bB[0] > ba[2] + 1e-6 || ba[1] > bB[3] + 1e-6 || bB[1] > ba[3] + 1e-6) return hits;
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const a = pa[i], b = pa[i + 1], c = pb[j], e = pb[j + 1];
    const r = sub(b, a), s = sub(e, c), den = cross(r, s); if (Math.abs(den) < 1e-12) continue;
    const u = cross(sub(c, a), s) / den, v = cross(sub(c, a), r) / den;
    if (u < -1e-9 || u > 1 + 1e-9 || v < -1e-9 || v > 1 + 1e-9) continue;
    let ta = (i + u) / n, tb = (j + v) / m;
    for (let k = 0; k < 8; k++) {
      const F = sub(at(A, ta), at(B, tb)), da = der(A, ta), db = mul(der(B, tb), -1), D = cross(da, db);
      if (Math.abs(D) < 1e-12) break;
      ta -= cross(F, db) / D; tb -= cross(da, F) / D;
    }
    ta = Math.min(1, Math.max(0, ta)); tb = Math.min(1, Math.max(0, tb));
    if (!hits.some((h) => Math.abs(h.ta - ta) < 1e-6 && Math.abs(h.tb - tb) < 1e-6)) hits.push({ ta, tb, p: at(A, ta) });
  }
  return hits;
}
export function runHits(RA, RB) {
  const out = [];
  RA.forEach((A, i) => RB.forEach((B, j) => segHits(A, B).forEach((h) => out.push({ i, ta: h.ta, j, tb: h.tb, p: h.p }))));
  return out;
}
/** Cut a run at position (i,t): returns [head, tail]. */
export function cutAt(r, i, t) {
  const head = r.slice(0, i), tail = r.slice(i + 1);
  if (t <= 1e-9) return [head, [r[i], ...tail]];
  if (t >= 1 - 1e-9) return [[...head, r[i]], tail];
  const [a, b] = split(r[i], t); return [[...head, a], [b, ...tail]];
}
export const piece = (r, i0, t0, i1, t1) => {
  // same-run portion from (i0,t0) to (i1,t1), i0<=i1
  if (i0 === i1) { const [, b] = cutAt([r[i0]], 0, t0); const tt = (t1 - t0) / (1 - t0 || 1); return cutAt(b, 0, tt)[0]; }
  const [, tail] = cutAt(r, i0, t0), ii = i1 - i0; return cutAt(tail, ii - (t0 >= 1 - 1e-9 ? 1 : 0), t1)[0];
};

/** Offset an open or closed run by d (left of travel), joins arced outside and trimmed inside. */
export function offsetRun(r0, d, closed = false) {
  const r = refine(r0, 1);
  const parts = r.map((s) => offsetSegs(s, d));
  const out = [];
  const nJ = closed ? r.length : r.length - 1;
  for (let i = 0; i < r.length; i++) {
    out.push(...parts[i]);
    if (i >= nJ) break;
    const nx = (i + 1) % r.length, A = p1(parts[i].at(-1)), B = p0(parts[nx][0]);
    if (len(sub(A, B)) < 1e-6) continue;
    const t1 = tan(r[i], 1), t2 = tan(r[nx], 0), v = p1(r[i]);
    if (cross(t1, t2) * d > 0) { // outer: arc about the vertex
      let a0 = angOf(sub(A, v)), a1 = angOf(sub(B, v)), sw = a1 - a0;
      while (sw > Math.PI) sw -= 2 * Math.PI; while (sw < -Math.PI) sw += 2 * Math.PI;
      const arcs = arc(v, Math.abs(d), a0, sw); arcs[0].p[0] = A; arcs.at(-1).p[3] = B; out.push(...arcs);
    } else { out.push({ t: 'L', p: [A, v] }, { t: 'L', p: [v, B] }); } // inner: through the vertex, loop removed below
  }
  return removeLoops(out, r, Math.abs(d), closed);
}

/** Excise self-crossing loops whose ink sits nearer the source than the offset distance. */
export function removeLoops(r, src, dist, closed) {
  for (let guard = 0; guard < 200; guard++) {
    let done = true;
    outer: for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
      if (j === i + 1 && len(sub(p1(r[i]), p0(r[j]))) < 1e-6) {
        // adjacent: only a real crossing away from the shared end counts
        const hs = segHits(r[i], r[j]).filter((h) => h.ta < 1 - 1e-5 || h.tb > 1e-5); if (!hs.length) continue;
      }
      if (closed && i === 0 && j === r.length - 1) { const hs = segHits(r[i], r[j]).filter((h) => h.ta > 1e-5 || h.tb < 1 - 1e-5); if (!hs.length) continue; }
      const hs = segHits(r[i], r[j]).filter((h) => !(j === i + 1 && h.ta > 1 - 1e-5 && h.tb < 1e-5) && !(closed && i === 0 && j === r.length - 1 && h.ta < 1e-5 && h.tb > 1 - 1e-5));
      for (const h of hs) {
        const mid = piece(r, i, h.ta, j, h.tb);
        if (!mid.length) continue;
        const L = mid.reduce((a, s) => a + segLen(s), 0); if (L < 1e-6) continue;
        const pts = samples(mid, Math.max(L / 12, 0.01)).slice(1, -1);
        const inside = pts.length && pts.filter((q) => distToRun(q, src) < dist - 0.01).length > pts.length / 2;
        if (inside) {
          const [head] = cutAt(r, i, h.ta), [, tail] = cutAt(r, j, h.tb);
          head.at(-1).p[head.at(-1).p.length - 1] = h.p; tail[0].p[0] = h.p;
          r = [...head, ...tail]; done = false; break outer;
        }
        if (closed) {
          const [, t2] = cutAt(r, j, h.tb), [h2] = cutAt(r, i, h.ta), wrap = [...t2, ...h2];
          const L2 = wrap.reduce((a, s) => a + segLen(s), 0);
          const pts2 = samples(wrap, Math.max(L2 / 24, 0.01)).slice(1, -1);
          if (pts2.length && pts2.filter((q) => distToRun(q, src) < dist - 0.01).length > pts2.length / 2) {
            const m = piece(r, i, h.ta, j, h.tb); m[0].p[0] = h.p; m.at(-1).p[m.at(-1).p.length - 1] = h.p;
            r = m; done = false; break outer;
          }
        }
      }
    }
    if (done) break;
  }
  // drop the slivers a trim leaves at a crossing; the next segment's own start closes the 1e-3 gap
  return r.filter((s) => segLen(s) > 1e-3);
}

/** The painted outline of a stroked open run, closed. */
export function capsule(r0, cap = 'round') {
  const r = refine(r0, 1), L = offsetRun(r, 1), R = offsetRun(r, -1);
  const out = [...L];
  const e = p1(r.at(-1)), te = tan(r.at(-1), 1), s = p0(r[0]), ts = tan(r[0], 0);
  const cA = p1(L.at(-1)), cB = p0(revRun(R)[0]);
  if (cap === 'round') { const a = arc(e, 1, angOf(left(te)), Math.PI); a[0].p[0] = cA; a.at(-1).p[3] = cB; out.push(...a); } else out.push({ t: 'L', p: [cA, cB] });
  out.push(...revRun(R));
  const sA = p1(out.at(-1)), sB = p0(L[0]);
  if (cap === 'round') { const a = arc(s, 1, angOf(mul(left(ts), -1)), Math.PI); a[0].p[0] = sA; a.at(-1).p[3] = sB; out.push(...a); } else out.push({ t: 'L', p: [sA, sB] });
  return removeLoops(out, r, 1, true);
}

export function area(r) { const q = samples(r, 0.05); let a = 0; for (let i = 0; i < q.length; i++) { const u = q[i], v = q[(i + 1) % q.length]; a += u[0] * v[1] - v[0] * u[1]; } return a / 2; }
export function inside(p, r) { const q = samples(r, 0.05); let w = false; for (let i = 0, j = q.length - 1; i < q.length; j = i++) { if ((q[i][1] > p[1]) !== (q[j][1] > p[1]) && p[0] < ((q[j][0] - q[i][0]) * (p[1] - q[i][1])) / (q[j][1] - q[i][1]) + q[i][0]) w = !w; } return w; }

/** The silhouette offset by +1 outward (plate) or inward (inner ink edge). */
export function offsetClosed(r, outward) {
  const s = area(r); // screen area > 0 means clockwise on screen; left of travel is outside then
  const d = (s > 0 ? 1 : -1) * (outward ? 1 : -1);
  return offsetRun(r, d, true);
}

/** Position along a closed run as a scalar i + t. */
const pos = (h, key) => h[key === 'a' ? 'i' : 'j'] + h[key === 'a' ? 'ta' : 'tb'];
function closedPiece(C, from, to) {
  // walk forward on closed run C from scalar position `from` to `to`
  const i0 = Math.floor(from), t0 = from - i0, i1 = Math.floor(to), t1 = to - i1;
  if (to >= from) return piece(C, Math.min(i0, C.length - 1), i0 >= C.length ? 1 : t0, Math.min(i1, C.length - 1), i1 >= C.length ? 1 : t1);
  const [, a] = cutAt(C, Math.min(i0, C.length - 1), t0), [b] = cutAt(C, Math.min(i1, C.length - 1), t1);
  return [...a, ...b];
}
const runLen = (r) => r.reduce((a, s) => a + segLen(s), 0);

/**
 * A stroke band knocked out of a solid, stopped at the silhouette's inner ink.
 * `r0` is the interior run; `inner` is the inner-ink contour (closed).
 */
export function bandInside(r0, inner) {
  const r = refine(r0, 1);
  const U = offsetRun(r, 1), D = offsetRun(r, -1);
  const clip = (E) => {
    const hs = runHits(E, inner).sort((a, b) => (a.i + a.ta) - (b.i + b.ta));
    if (hs.length < 2) throw new Error('band edge does not cross the inner ink twice');
    const h0 = hs[0], h1 = hs.at(-1);
    const seg = piece(E, h0.i, h0.ta, h1.i, h1.ta);
    seg[0].p[0] = h0.p; seg.at(-1).p[seg.at(-1).p.length - 1] = h1.p;
    return { seg, s: h0.j + h0.tb, e: h1.j + h1.tb, ps: h0.p, pe: h1.p };
  };
  const u = clip(U), dn = clip(D);
  const shorter = (a, b) => { const f1 = closedPiece(inner, a, b), f2 = revRun(closedPiece(inner, b, a)); return runLen(f1) <= runLen(f2) ? f1 : f2; };
  const endCap = shorter(u.e, dn.e), startCap = shorter(dn.s, u.s);
  endCap[0].p[0] = u.pe; endCap.at(-1).p[endCap.at(-1).p.length - 1] = dn.pe;
  startCap[0].p[0] = dn.ps; startCap.at(-1).p[startCap.at(-1).p.length - 1] = u.ps;
  return [...u.seg, ...endCap, ...revRun(dn.seg), ...startCap].filter((s) => segLen(s) > 1e-5);
}

/** Wind `hole` against `plate`. */
export const against = (plate, hole) => (Math.sign(area(plate)) === Math.sign(area(hole)) ? revRun(hole) : hole);
