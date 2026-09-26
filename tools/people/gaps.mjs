import * as G from './geo.mjs';
// named runs; prints painted gap (centreline distance - 2) for each pair that does not touch
export function gaps(parts, only) {
  const S = Object.fromEntries(Object.entries(parts).map(([k, d]) => [k, G.parse(d).flatMap((s) => G.samples(s.segs, 0.03))]));
  const out = [];
  const ks = Object.keys(S);
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    if (only && !only.some(([a, b]) => (a === ks[i] && b === ks[j]) || (a === ks[j] && b === ks[i]))) continue;
    let m = Infinity, at = null;
    for (const p of S[ks[i]]) for (const q of S[ks[j]]) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < m) { m = d; at = p; } }
    out.push(`${ks[i]}~${ks[j]}: ${(m - 2).toFixed(2)} near ${at.map((v) => v.toFixed(1))}`);
  }
  return out;
}
if (process.argv[1].endsWith('gaps.mjs')) {
  const boy = { fringe: 'M4 10.5C6 10.5 6.6 9 7.6 7.6C8.9 8.9 11.2 9.5 13 9C15 8.5 16.2 7.4 17.4 6.6C17.9 8 18.5 10 20 10.5', eyeL: 'M9 12.4V13.4', eyeR: 'M15 12.4V13.4', mouth: 'M10.5 17.45C11 17.8 11.5 17.95 12 17.95C12.5 17.95 13 17.8 13.5 17.45', chin: 'M20 15.5V15.738C20 17.3 19 18.9 17.45 20.1C15.9 21.3 13.94 22 12 22C10.06 22 8.1 21.3 6.55 20.1C5 18.9 4 17.3 4 15.738V15.5' };
  console.log('boy', gaps(boy, [['fringe','eyeL'],['fringe','eyeR'],['mouth','chin'],['eyeL','mouth'],['eyeR','mouth']]));
  const girl = { part: 'M4.59571 9.6C9 9.6 11 5.8 12 3.5C13 5.8 15 9.6 19.9043 9.6', eyeL: 'M9 12.4V13.4', eyeR: 'M15 12.4V13.4', mouth: 'M10.5 17.45C11 17.8 11.5 17.95 12 17.95C12.5 17.95 13 17.8 13.5 17.45', chin: 'M19.5 15.5C19.5 19.6 15.6 22 12 22C8.4 22 4.5 19.6 4.5 15.5', dome: 'M4 11C4 6 7.6 2 12 2C16.4 2 20 6 20 11', pigL: 'M4.5 15.5C4.1 17.6 4.4 19.2 3.2 20.4C2.4 19.4 2 18 2 16.4C2 14.4 2.6 12.4 4 11' };
  console.log('girl', gaps(girl, [['part','eyeL'],['part','eyeR'],['mouth','chin'],['eyeL','mouth'],['eyeL','pigL'],['eyeL','chin']]));
  // is the part's end on the dome?
  const dome = G.run(girl.dome); console.log('part end to dome', G.distToRun([4.59571, 9.6], G.refine(dome)).toFixed(4), G.distToRun([19.9043, 9.6], G.refine(dome)).toFixed(4));
  const cap = G.run('M4 10.5V10V7.5C4 4 6.8 1.9 11.5 2C14.4 2.1 16.5 3.5 19.4 2'.replace(/V([\d.]+)/g, 'L4 $1'));
  let ymin = 9; for (const p of G.samples(cap, 0.01)) ymin = Math.min(ymin, p[1]); console.log('cap top centreline', ymin.toFixed(4));
}
