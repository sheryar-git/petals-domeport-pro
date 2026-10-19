// Reads measure.mjs output: frame pacing per window, white-frame vs beep offset.
// usage: node analyze.mjs run.json [loopSeconds]
import fs from 'node:fs';
const { uploads, beeps } = JSON.parse(fs.readFileSync(process.argv[2]));
const LOOP = Number(process.argv[3] || 210.27);
if (!uploads.length) { console.log('no frame uploads'); process.exit(0); }

// The luma plane is the largest upload that repeats.
const sizes = {}; for (const [, n] of uploads) sizes[n] = (sizes[n] || 0) + 1;
const ySize = Number(Object.entries(sizes).sort((a, b) => b[0] - a[0]).find(([, c]) => c > 10)?.[0]);
const frames = uploads.filter(u => u[1] === ySize);
const t0 = frames[0][0];
const rel = t => (t - t0) / 1000;
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

function pacing(from, to) {
  const f = frames.filter(([t]) => rel(t) >= from && rel(t) < to);
  if (f.length < 2) return `${from}-${to}s: no frames`;
  const dt = f.slice(1).map((x, i) => x[0] - f[i][0]);
  const secs = (f.at(-1)[0] - f[0][0]) / 1000;
  const stalls = dt.filter(d => d > 50).length;
  return `${from}-${to}s: ${(f.length / secs).toFixed(1)} fps delivered of 30, dropped ~${Math.max(0, Math.round(secs * 30 - f.length))}, ` +
    `frame time p50 ${q(dt, .5).toFixed(0)} ms p95 ${q(dt, .95).toFixed(0)} ms max ${Math.max(...dt).toFixed(0)} ms, gaps >50 ms: ${stalls}`;
}

const flashes = frames.filter(([, , m]) => m > 150).map(([t]) => t);
function offsets(from, to) {
  const o = flashes.filter(t => rel(t) >= from && rel(t) < to).map(t => {
    const near = beeps.reduce((best, b) => Math.abs(b - t) < Math.abs(best - t) ? b : best, Infinity);
    return t - near;
  }).filter(d => Math.abs(d) < 500);
  if (!o.length) return `${from}-${to}s: no white frames paired`;
  return `${from}-${to}s: picture minus sound ${q(o, .5).toFixed(0)} ms median (min ${Math.min(...o).toFixed(0)}, max ${Math.max(...o).toFixed(0)}, n ${o.length})`;
}

const end = rel(frames.at(-1)[0]);
console.log(`luma plane ${ySize} bytes, ${frames.length} frames over ${end.toFixed(0)} s, ${flashes.length} white frames, ${beeps.length} beeps`);
console.log('pacing ' + pacing(10, 70));
if (end > LOOP + 5) console.log('pacing ' + pacing(LOOP - 15, LOOP + 15) + '  (across the loop)');
console.log('a/v ' + offsets(0, 15));
console.log('a/v ' + offsets(95, 115));
if (end > LOOP + 5) console.log('a/v ' + offsets(LOOP + 1, end) + '  (after the loop)');
