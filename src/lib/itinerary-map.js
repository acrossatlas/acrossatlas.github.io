// The notebook is the source of order and endpoints. Geographic results are
// keyed by the actual input, so an old lookup can never move a newly edited stop.
export function validCoordinates(point) {
  return Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
    && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90;
}

export const placeKey = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const equalPoint = (a, b) => validCoordinates(a) && validCoordinates(b) && Math.abs(a[0] - b[0]) < .00001 && Math.abs(a[1] - b[1]) < .00001;

export function coordinatesFromAddress(value) {
  const text = String(value ?? '').trim();
  const pair = text.match(/^(?:geo:)?(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)$/i);
  if (pair) { const point = [Number(pair[2]), Number(pair[1])]; return validCoordinates(point) ? point : null; }
  try {
    const url = new URL(text);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (/(^|\.)(google\.[a-z.]+|maps\.google\.[a-z.]+)$/.test(url.hostname)) {
      const data = url.pathname.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);
      if (data) { const point = [Number(data[2]), Number(data[1])]; return validCoordinates(point) ? point : null; }
      return coordinatesFromAddress(url.searchParams.get('query') || url.searchParams.get('q') || '');
    }
    if (/(^|\.)openstreetmap\.org$/.test(url.hostname)) {
      const lat = url.searchParams.get('mlat'), lon = url.searchParams.get('mlon');
      const point = [Number(lon), Number(lat)];
      return lat !== null && lon !== null && validCoordinates(point) ? point : null;
    }
  } catch { /* Ordinary place names are resolved below. */ }
  return null;
}

export function findKnownPlace(query, catalog, country, eventId) {
  const key = placeKey(query);
  if (!key) return null;
  const airport = catalog.find(place => place.airportCode && placeKey(place.airportCode) === key);
  if (airport) return airport;
  let matches = catalog.filter(place => (!country || !place.country || place.country === country)
    && place.aliases.some(alias => placeKey(alias) === key));
  const source = matches.filter(place => place.eventIds?.includes(eventId));
  if (source.length) matches = source;
  if (!matches.length || matches.some(place => !equalPoint(place.coordinates, matches[0].coordinates))) return null;
  return matches[0];
}

export function createMapCatalog(scenes, events, airports = {}) {
  const places = Object.entries(airports).map(([code, airport]) => ({ ...airport, airportCode: code, aliases: [code, airport.name] }));
  const legs = [];
  for (const scene of scenes) {
    for (const stop of scene.stops || []) {
      if (!validCoordinates(stop.coordinates)) continue;
      const related = (stop.eventIds || [stop.eventId]).map(id => events.find(event => event.id === id)).filter(Boolean);
      const singlePlace = related.filter(event => !event.flightLegs && !event.transport?.segments?.length
        && (scene.stops || []).filter(item => (item.eventIds || [item.eventId]).includes(event.id)).length === 1);
      places.push({ coordinates: stop.coordinates, name: stop.name, eventIds: singlePlace.map(event => event.id), country: stop.country || singlePlace[0]?.country || scene.country,
        aliases: [stop.name, stop.address, ...singlePlace.flatMap(event => [event.title, event.navigation])].filter(Boolean) });
    }
    for (const leg of Object.values(scene.visitRoutes || {}).flat()) {
      const start = scene.stops?.find(stop => stop.id === leg.from)?.coordinates;
      const end = scene.stops?.find(stop => stop.id === leg.to)?.coordinates;
      if (validCoordinates(start) && validCoordinates(end) && leg.path?.length > 1 && leg.path.every(validCoordinates)) legs.push({ ...leg, start, end });
    }
  }
  return { places, legs };
}

export function mapEventSignature(events) {
  return JSON.stringify(events.map(event => {
    const segments = event.type === '交通' ? event.transport?.segments?.length ? event.transport.segments : event.flightLegs : null;
    return [event.id, event.type, event.country, segments?.length
      ? segments.map(segment => [segment.id, segment.from, segment.to, segment.mode || event.transport?.mode || '航班', segment.fromLocation, segment.toLocation])
      : [event.navigation?.trim() || event.title, event.location]];
  }));
}

export function buildMapPlan(events, catalog = [], { defaultMode = 'connection', country, center } = {}) {
  const points = [];
  function add(event, id, query, location, mode, endpoint = false, searchMode = mode) {
    query = query?.trim() ?? '';
    const pointCountry = endpoint && ['航班', '铁路', '渡轮'].includes(searchMode) ? undefined : event.country || country;
    const known = findKnownPlace(query, catalog, pointCountry, event.id);
    const supplied = location && placeKey(location.query) === placeKey(query) && validCoordinates(location.coordinates) ? location : null;
    const coordinates = supplied?.coordinates || coordinatesFromAddress(query) || known?.coordinates;
    points.push({ id, eventId: event.id, name: endpoint ? query || event.title : event.title, query,
      address: query, country: supplied?.country || known?.country || pointCountry, coordinates,
      mode, center, locationKey: JSON.stringify([query, pointCountry || '', center?.map(n => Number(n.toFixed(2)))]),
    });
  }
  for (const event of events) {
    const legacy = !event.transport?.segments?.length;
    const segments = event.type === '交通' ? legacy ? event.flightLegs : event.transport.segments : null;
    if (segments?.length) {
      segments.forEach((segment, index) => {
        const mode = segment.mode || event.transport?.mode || (legacy ? '航班' : 'connection');
        add(event, `${event.id}-${segment.id || index}-from`, segment.from, segment.fromLocation, defaultMode, true, mode);
        add(event, `${event.id}-${segment.id || index}-to`, segment.to, segment.toLocation, mode, true);
      });
    } else if (event.type === '交通' && (event.transport?.from || event.transport?.to)) {
      add(event, `${event.id}-from`, event.transport.from, event.transport.fromLocation, defaultMode, true);
      add(event, `${event.id}-to`, event.transport.to, event.transport.toLocation, event.transport.mode || defaultMode, true);
    } else add(event, event.id, event.navigation || event.title, event.location, defaultMode);
  }
  return points;
}

export function resolveMapPoints(plan, locations = {}) {
  const result = [];
  for (const point of plan) {
    const found = locations[point.locationKey];
    const next = { ...point, coordinates: point.coordinates || found?.coordinates, country: point.country || found?.country };
    const previous = result.at(-1);
    if (previous && equalPoint(previous.coordinates, next.coordinates)) {
      previous.eventIds.push(point.eventId);
      continue;
    }
    result.push({ ...next, eventIds: [point.eventId], number: String(result.filter(item => validCoordinates(item.coordinates)).length + 1) });
  }
  for (const [index, point] of result.entries()) {
    const previous = result.slice(0, index).find(item => equalPoint(item.coordinates, point.coordinates));
    if (previous) point.repeatOf = previous.id;
  }
  return result;
}

export function modeProfile(mode) {
  if (['driving', '自驾', 'taxi', '出租车'].includes(mode)) return 'car';
  if (['walking', '步行'].includes(mode)) return 'foot';
  return null;
}

export function buildMapLegs(points, savedLegs = []) {
  return points.slice(1).flatMap((to, index) => {
    const from = points[index];
    // Keep a gap while its intermediate place is unresolved; never skip over it.
    if (!validCoordinates(from.coordinates) || !validCoordinates(to.coordinates) || equalPoint(from.coordinates, to.coordinates)) return [];
    const mode = to.mode, profile = modeProfile(mode);
    const matches = savedLegs.filter(leg => (mode === 'connection' || mode === leg.mode || (profile && profile === modeProfile(leg.mode))) && equalPoint(from.coordinates, leg.start) && equalPoint(to.coordinates, leg.end));
    const saved = matches[0];
    const isFlight = ['flight', '航班', '航空'].includes(mode);
    return [{ id: `${from.id}-${to.id}`, from, to, mode, profile, isFlight,
      coordinates: saved?.path || [from.coordinates, to.coordinates],
      schematic: !saved, seconds: saved?.seconds,
      routeKey: JSON.stringify([profile, from.coordinates, to.coordinates]),
    }];
  });
}
