import transitRoutes from './amsterdam-transit-routes.json';
import walkingRoutes from './amsterdam-walking-routes.json';
// Public place coordinates checked with Photon / OpenStreetMap, 2026-09-16.
// District/street pins are area anchors, not a booked café, restaurant or cruise berth.
export const amsterdamPlaces = {
  airport: [4.764, 52.309],
  museumplein: [4.8834415, 52.3587124],
  nieuwmarkt: [4.9003449, 52.3725948],
  hotel: [4.79388, 52.3250454],
  nineStreets: [4.8829642, 52.3704248],
  begijnhof: [4.8900431, 52.3694314],
  flowers: [4.8907645, 52.3669308],
  vanGogh: [4.88109, 52.3583673],
  rijksmuseum: [4.8850395, 52.3598431],
  market: [4.8861236, 52.3796336],
  haarlemmerstraat: [4.8918561, 52.3803058],
  centraal: [4.9005805, 52.378901],
  damrak: [4.8987017, 52.3768599],
  // Flagship's official Central Station departure map, checked 2026-09-18.
  cruise: [4.8977774, 52.378305],
  dam: [4.8923511, 52.3731162],
  oudeKerk: [4.8980733, 52.3743621],
};
function stop(id, number, name, eventIds, address) {
  return { id, number: String(number), name, coordinates: amsterdamPlaces[id], eventIds, ...(address ? { address } : {}) };
}
function day(stops, bounds) {
  return { stops, bounds, overviewBounds: [[4.75, 52.30], [4.915, 52.40]], routes: { direct: { coordinates: [] } }, legs: [] };
}
export const amsterdamMapDays = {
  '2026-09-25': day([
    stop('hotel', 0, 'ibis Schiphol Amsterdam Airport', ['sep25-arrival', 'sep25-amsterdam-stay', 'sep25-night-bus']),
    stop('nineStreets', 1, '九街 · Berenstraat', ['sep25-coffee', 'sep25-nine-streets']),
    stop('begijnhof', 2, 'Begijnhof 贝居安会院', ['sep25-begijnhof']),
    stop('flowers', 3, 'Bloemenmarkt 花市', ['sep25-flower-market']),
    stop('museumplein', 4, 'Museumplein 博物馆区', ['sep25-dinner'], 'Museumplein, Amsterdam'),
    stop('vanGogh', 5, 'Van Gogh Museum 梵高博物馆', ['sep25-van-gogh']),
  ], [[4.875, 52.353], [4.9, 52.376]]),
  '2026-09-26': day([
    stop('market', 1, 'Noordermarkt 农夫集市', ['sep26-market', 'sep26-lunch']),
    stop('haarlemmerstraat', 2, 'Haarlemmerstraat', ['sep26-jordaan'], 'Haarlemmerstraat, Amsterdam'),
    stop('centraal', 3, 'Amsterdam Centraal 中央站', [], 'Stationsplein, Amsterdam'),
    stop('damrak', 4, 'Damrak', ['sep26-damrak']),
    stop('dam', 5, 'Dam 广场', ['sep26-dam', 'sep26-coffee-break']),
    stop('cruise', 6, 'Flagship 中央站码头', ['sep26-cruise']),
    stop('nieuwmarkt', 7, 'Nieuwmarkt', ['sep26-dinner']),
    stop('oudeKerk', 8, 'Oude Kerk · De Wallen', ['sep26-de-wallen']),
    stop('hotel', 0, 'ibis Schiphol Amsterdam Airport', ['sep26-amsterdam-stay']),
  ], [[4.881, 52.368], [4.909, 52.385]]),
};

// Scheduled public transport paths and times come from OVapi GTFS feed 9581.
// Walking access uses OSM foot routing; private ibis shuttle has no published geometry.
function connection(from, to, mode) {
  const key = `${from}-${to}`;
  if (mode === 'walking') {
    const route = walkingRoutes.routes[key];
    return { from, to, mode, ...route, estimated: true,
      durationLabel: `步行约 ${Math.ceil(route.seconds / 60)} 分钟`,
      travelNote: `约 ${Math.round(route.meters)} 米；不含逛店、拍照与休息` };
  }
  const route = transitRoutes.routes[key];
  return { from, to, mode, ...route, color: '#cc6839', schematic: false };

}
export const amsterdamVisitRoutes = {
  '2026-09-27': { direct: [
    connection('hotel', 'rijksmuseum', 'transit'),
    connection('rijksmuseum', 'hotel', 'transit'),
  ] },
  '2026-09-25': { direct: [
    connection('hotel', 'nineStreets', 'transit'),
    connection('nineStreets', 'begijnhof', 'walking'),
    connection('begijnhof', 'flowers', 'walking'),
    connection('flowers', 'hotel', 'transit'),
    connection('hotel', 'museumplein', 'transit'),
    connection('museumplein', 'vanGogh', 'walking'),
    connection('vanGogh', 'hotel', 'transit'),
  ] },
  '2026-09-26': { direct: [
    connection('hotel', 'market', 'transit'),
    connection('market', 'haarlemmerstraat', 'walking'),
    connection('haarlemmerstraat', 'centraal', 'walking'),
    connection('centraal', 'damrak', 'walking'),
    connection('damrak', 'dam', 'walking'),
    connection('dam', 'damrak', 'walking'),
    // The cruise itself is not drawn until its operator and route are known.
    connection('damrak', 'nieuwmarkt', 'walking'),
    connection('nieuwmarkt', 'oudeKerk', 'walking'),
    connection('oudeKerk', 'centraal', 'walking'),
    connection('centraal', 'airport', 'transit'),
  ] },
};
