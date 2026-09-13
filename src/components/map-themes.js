// Country-specific colors and public overview locations, independent of itinerary stops.
function paint({ land, green, urban, water, river, building }) {
  return [
    ['background', 'background-color', land],
    ...['landcover', 'park_national_park', 'park_nature_reserve', 'landuse'].map(id => [id, 'fill-color', green]),
    ['landuse_residential', 'fill-color', urban],
    ['water', 'fill-color', water],
    ['waterway', 'line-color', river],
    ['building', 'fill-color', building],
    ['building-top', 'fill-color', building],
    ['building-top', 'fill-outline-color', urban],
  ];
}
export const countryThemes = {
  NL: {
    name: 'amsterdam', road: '#faf6ee', text: '#665b55', halo: '#eee7dd', route: '#cc6839', optional: '#a49589',
    paint: paint({ land: '#e9e3da', green: '#c3c9b1', urban: '#e2d8cc', water: '#9fbfc2', river: '#89afb6', building: '#c7afa0' }),
  },
  NO: {
    name: 'fjords', road: '#f5f8fa', text: '#334b5c', halo: '#edf4f7', route: '#ff6257', optional: '#94a7b4',
    paint: paint({ land: '#747f89', green: '#949fa8', urban: '#c6cfd5', water: '#eaf5fa', river: '#d5eaf4', building: '#aab7c1' }),
  },
};
const views = {
  NL: { center: [4.895, 52.371], zoom: 12.2 },
  IS: { center: [-21.1, 64.2], zoom: 7 },
  lofoten: { center: [13.75, 68.15], zoom: 7.4 },
  tromso: { center: [18.95, 69.65], zoom: 8.3 },
  oslo: { center: [10.75, 59.92], zoom: 10 },
  world: { center: [0, 25], zoom: 1 },
};
export function overviewForDay(date, country) {
  if (country === 'NO') {
    if (date >= '2026-10-06') return views.oslo;
    if (date >= '2026-10-04') return views.tromso;
    return views.lofoten;
  }
  return views[country] || views.world;
}

// Iceland palette: volcanic ash land, tundra vegetation, and glacier-blue water.
export const basemapPaint = [
  ['background', 'background-color', '#eef0ed'],
  ['landcover', 'fill-color', '#d5decf'],
  ['park_national_park', 'fill-color', '#d5decf'],
  ['park_nature_reserve', 'fill-color', '#d5decf'],
  ['landuse', 'fill-color', '#dde4d7'],
  ['landuse_residential', 'fill-color', '#e5e8e3'],
  ['water', 'fill-color', '#bfdce7'],
  ['waterway', 'line-color', '#aacddb'],
];
export const volcanicPaint = [
  ['background', 'background-color', '#30322f'],
  ['landcover', 'fill-color', '#536048'],
  ['park_national_park', 'fill-color', '#536048'],
  ['park_nature_reserve', 'fill-color', '#536048'],
  ['landuse', 'fill-color', '#41493a'],
  ['landuse_residential', 'fill-color', '#393b36'],
  ['water', 'fill-color', '#1e292c'],
  ['waterway', 'line-color', '#283b3e'],
  ['building', 'fill-color', '#464940'],
  ['building-top', 'fill-color', '#4d5048'],
];
