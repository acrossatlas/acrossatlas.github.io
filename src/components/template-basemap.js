// Inline styles avoid separate style, sprite, font and vector-source requests.
export const templateBasemap = {
  version: 8,
  sources: { streets: { type: 'raster', tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© <a href="https://carto.com/attributions">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } },
  layers: [{ id: 'streets', type: 'raster', source: 'streets' }],
};
export const templateFallbackBasemap = {
  version: 8,
  sources: { streets: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' } },
  layers: [{ id: 'streets', type: 'raster', source: 'streets' }],
};
