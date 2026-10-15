import { readFile, writeFile } from 'node:fs/promises';

// Records each country's extent in travel-country-dots.svg so cards can crop
// the dotted world map to the countries a trip visited.
const svg = await readFile(new URL('../src/assets/travel-country-dots.svg', import.meta.url), 'utf8');
const bounds = {};
for (const [, code, body] of svg.matchAll(/<g id="dots-country-([A-Z]+)">(.*?)<\/g>/gs)) {
  const points = [...body.matchAll(/cx="([\d.]+)" cy="([\d.]+)"/g)].map(([, x, y]) => [Number(x), Number(y)]);
  if (!points.length) continue;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  bounds[code] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(value => Math.round(value * 10) / 10);
}
const sorted = Object.fromEntries(Object.entries(bounds).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(new URL('../src/data/country-dot-bounds.json', import.meta.url), `${JSON.stringify(sorted)}\n`);
console.log(`${Object.keys(sorted).length} countries`);
