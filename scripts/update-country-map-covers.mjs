import { readFile, writeFile } from 'node:fs/promises';
import { archiveCountries } from '../src/data/archive.js';

const baseUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const sources = ['ne_50m_admin_0_countries.geojson', 'ne_50m_lakes.geojson', 'ne_10m_admin_0_countries.geojson'];
const [countries, lakes, detailedCountries] = await Promise.all(sources.map(async (file, index) => {
  if (process.argv[index + 2]) return JSON.parse(await readFile(process.argv[index + 2], 'utf8'));
  const response = await fetch(`${baseUrl}${file}`);
  if (!response.ok) throw new Error(`${file}: ${response.status}`);
  return response.json();
}));

const width = 420, height = 328;
const mercator = latitude => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));
const longitude = degrees => degrees * Math.PI / 180;
const polygonsOf = feature => feature.geometry.type === 'MultiPolygon'
  ? feature.geometry.coordinates : [feature.geometry.coordinates];
const escapeXml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

// Clip each geographic ring before projection to keep neighboring-country paths small.
function clipRing(ring, bounds) {
  let points = ring.slice(0, -1);
  const [[west, south], [east, north]] = bounds;
  for (const [axis, edge, greater] of [[0, west, true], [0, east, false], [1, south, true], [1, north, false]]) {
    const input = points;
    points = [];
    if (!input.length) break;
    let previous = input.at(-1);
    let previousInside = greater ? previous[axis] >= edge : previous[axis] <= edge;
    for (const current of input) {
      const inside = greater ? current[axis] >= edge : current[axis] <= edge;
      if (inside !== previousInside) {
        const fraction = (edge - previous[axis]) / (current[axis] - previous[axis]);
        points.push(previous.map((value, index) => value + (current[index] - value) * fraction));
      }
      if (inside) points.push(current);
      previous = current;
      previousInside = inside;
    }
  }
  return points;
}

function createCover(country) {
  const [[west, south], [east, north]] = country.overviewBounds;
  const targetNorth = mercator(north), targetSouth = mercator(south);
  const centerX = longitude((west + east) / 2), centerY = (targetNorth + targetSouth) / 2;
  // Leave the lower fifth for the card caption, with the mainland above it.
  const scale = Math.min(width * .82 / longitude(east - west), height * .69 / (targetNorth - targetSouth));
  const project = ([lng, lat]) => [width / 2 + (longitude(lng) - centerX) * scale, height * .41 - (mercator(lat) - centerY) * scale];
  const inverseLatitude = value => (2 * Math.atan(Math.exp(value)) - Math.PI / 2) * 180 / Math.PI;
  const bounds = [
    [(centerX - width / 2 / scale) * 180 / Math.PI, inverseLatitude(centerY - height * .59 / scale)],
    [(centerX + width / 2 / scale) * 180 / Math.PI, inverseLatitude(centerY + height * .41 / scale)],
  ];
  const pathOf = feature => polygonsOf(feature).flatMap(rings => rings.map(ring => {
    const points = clipRing(ring, bounds).map(project);
    return points.length > 2 ? `${points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')}Z` : '';
  })).join('');
  // At city-state scale, the 1:50m coastline reduces Singapore to a polygon.
  const geography = country.code === 'SG' ? detailedCountries : countries;
  const paths = geography.features.map(feature => ({
    code: feature.properties.ISO_A2_EH,
    path: pathOf(feature),
    feature,
  })).filter(item => item.path);
  const water = lakes.features.map(pathOf).filter(Boolean).join('');
  const selected = paths.find(item => item.code === country.code);
  if (!selected) throw new Error(`No mainland geometry for ${country.code}`);

  const labels = paths.filter(item => item.code !== country.code).flatMap(({ feature }) => {
    const [x, y] = project([feature.properties.LABEL_X, feature.properties.LABEL_Y]);
    return x > 35 && x < width - 35 && y > 28 && y < height * .62
      ? [`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${escapeXml(feature.properties.NAME_EN ?? feature.properties.NAME)}</text>`] : [];
  });
  return `<g id="cover-${country.code}">
<rect width="${width}" height="${height}" fill="url(#cover-water)"/>
<g fill="url(#cover-land)" stroke="#f3fcf7" stroke-width=".7" fill-rule="evenodd">${paths.map(({ path }) => `<path d="${path}"/>`).join('')}</g>
<path d="${selected.path}" fill="#c4e3cf" fill-rule="evenodd"/>
<path d="${water}" fill="#b8dcec" fill-rule="evenodd"/>
<g font-family="Arial,sans-serif" font-size="8.5" text-anchor="middle" fill="#73998c" opacity=".7">${labels.join('')}</g>
</g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
<!-- Natural Earth country/lake geometry, public domain: 1:50m, with 1:10m countries for Singapore. Sources: ${sources.map(file => `${baseUrl}${file}`).join(' ')} -->
<defs>
<linearGradient id="cover-water" x2=".25" y2="1"><stop stop-color="#a9d8ec"/><stop offset="1" stop-color="#dff1f8"/></linearGradient>
<linearGradient id="cover-land" x2=".7" y2="1"><stop stop-color="#eaf5ee"/><stop offset="1" stop-color="#d8ecdf"/></linearGradient>
</defs>
${archiveCountries.map(createCover).join('\n')}
</svg>\n`;
await writeFile(new URL('../src/assets/country-map-covers.svg', import.meta.url), svg);
console.log(`Saved ${archiveCountries.length} country map covers (${Math.round(Buffer.byteLength(svg) / 1024)} KB).`);
