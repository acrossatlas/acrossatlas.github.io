// Public MapLibre styles without API keys: https://openfreemap.org/quick_start/
export const basemapStyles = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

// Keep a separate provider available when the vector basemap cannot load.
export const fallbackBasemap = {
  version: 8,
  sources: {
    streets: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: 'streets', type: 'raster', source: 'streets' }],
};
