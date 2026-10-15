import norwayArrival from './oct01-driving-route.json' with { type: 'json' };

// Reuse the saved domestic segment from the full transfer-day map.
const path = norwayArrival.coordinates;
const leg = {
  from: 'airport', to: 'home', mode: 'driving',
  path, seconds: norwayArrival.seconds, coordinates: norwayArrival.labelCoordinates,
};
const lngs = path.map(point => point[0]), lats = path.map(point => point[1]);

export const countryDayMaps = {
  NO: {
    '2026-10-01': {
      stops: [
        { id: 'airport', number: '0', name: 'Svolvær Airport · Hertz 取车', coordinates: path[0], eventIds: ['oct01-hertz-car'] },
        { id: 'home', number: '1', name: 'Henningsvær 罗弗敦住宿', coordinates: path.at(-1), eventIds: ['oct01-drive-henningsvaer', 'oct01-henningsvaer-stay'] },
      ],
      bounds: [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      routes: { direct: { coordinates: path } },
      legs: [leg],
      visitRoutes: { direct: [leg] },
    },
  },
};
