import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
const collection = process.argv[2]
  ? JSON.parse(await readFile(process.argv[2], 'utf8'))
  : await (async () => {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`World geometry request failed: ${response.status}`);
    return response.json();
  })();

const continents = ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
const groups = new Map(continents.map(continent => [continent, new Set()]));
const countryGroups = new Map();
const scaleAt = latitude => .84 + .16 * Math.cos(latitude * Math.PI / 180);
const circle = dot => `<circle cx="${dot.x.toFixed(1)}" cy="${dot.y.toFixed(1)}" r="1.7"/>`;
const dots = [];
for (let y = 18; y <= 426; y += 5.4) {
  const latitude = 90 - (y - 18) / 408 * 180;
  for (let x = 32; x <= 768; x += 5.4) {
    const longitude = (x - 400) / (368 * scaleAt(latitude)) * 180;
    if (longitude >= -180 && longitude <= 180) dots.push({ x, y, longitude, latitude });
  }
}

function insideRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

for (const feature of collection.features) {
  const code = feature.properties.ISO_A2_EH;
  const countryDots = countryGroups.get(code) ?? new Set();
  const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
  for (const rings of polygons) {
    const longitudes = rings[0].map(point => point[0]), latitudes = rings[0].map(point => point[1]);
    const west = Math.min(...longitudes), east = Math.max(...longitudes);
    const south = Math.min(...latitudes), north = Math.max(...latitudes);
    for (const dot of dots) {
      if (dot.longitude < west || dot.longitude > east || dot.latitude < south || dot.latitude > north) continue;
      const point = [dot.longitude, dot.latitude];
      if (!insideRing(point, rings[0]) || rings.slice(1).some(ring => insideRing(point, ring))) continue;
      let continent = feature.properties.CONTINENT;
      // Separate geographic landmasses where national territories cross continents.
      if (feature.properties.ISO_A2_EH === 'RU' && (dot.longitude > 60 || dot.longitude < -150)) continent = 'Asia';
      if (feature.properties.ISO_A2_EH === 'FR' && dot.longitude < -50) continent = 'South America';
      if (continent === 'Seven seas (open ocean)') continent = 'Antarctica';
      groups.get(continent)?.add(circle(dot));
      countryDots.add(circle(dot));
    }
  }
  // Keep small countries visible when the regular world grid misses their land.
  if (!countryDots.size && Number.isFinite(feature.properties.LABEL_X) && Number.isFinite(feature.properties.LABEL_Y)) {
    const latitude = feature.properties.LABEL_Y;
    countryDots.add(circle({ x: 400 + feature.properties.LABEL_X / 180 * 368 * scaleAt(latitude), y: 18 + (90 - latitude) / 180 * 408 }));
  }
  if (/^[A-Z]{2}$/.test(code)) countryGroups.set(code, countryDots);
}

const slug = continent => continent.replaceAll(' ', '-');
// Singapore is too small for the 1:110m country collection; retain its city-state position.
if (!countryGroups.get('SG')?.size) {
  const latitude = 1.35;
  countryGroups.set('SG', new Set([circle({ x: 400 + 103.82 / 180 * 368 * scaleAt(latitude), y: 18 + (90 - latitude) / 180 * 408 })]));
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 444">
<!-- Dotted continent artwork from public-domain Natural Earth 1:110m geometry. Source: ${source} -->
<defs>
${[...groups].map(([continent, circles]) => `<g id="dots-${slug(continent)}">${[...circles].join('')}</g>`).join('\n')}
</defs>
<g id="world-dots">${continents.map(continent => `<use href="#dots-${slug(continent)}"/>`).join('')}</g>
</svg>\n`;
const countrySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 444">
<!-- Country dots aligned with travel-world-dots.svg; public-domain Natural Earth 1:110m geometry. Source: ${source} -->
<defs>
${[...countryGroups].map(([code, circles]) => `<g id="dots-country-${code}">${[...circles].join('')}</g>`).join('\n')}
</defs>
</svg>\n`;

const directory = new URL('../src/assets/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('travel-world-dots.svg', directory), svg);
await writeFile(new URL('travel-country-dots.svg', directory), countrySvg);
console.log(`Saved dotted world map (${[...groups.values()].reduce((total, circles) => total + circles.size, 0)} dots, ${Buffer.byteLength(svg)} bytes).`);
