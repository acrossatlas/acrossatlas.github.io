import { coordinatesFromAddress, placeKey, validCoordinates } from './itinerary-map.js';

const storageKey = 'across-map-cache-v1';
const memory = new Map();
let loaded = false;
function loadCache() {
  if (loaded) return;
  loaded = true;
  try { for (const [key, value] of JSON.parse(localStorage.getItem(storageKey) || '[]')) memory.set(key, value); } catch { /* Cache storage is optional. */ }
}
function cached(key) { loadCache(); return memory.get(key); }
function remember(key, value) {
  loadCache(); memory.delete(key); memory.set(key, value);
  while (memory.size > 300) memory.delete(memory.keys().next().value);
  try { localStorage.setItem(storageKey, JSON.stringify([...memory])); } catch { /* Full storage must not prevent editing or mapping. */ }
  return value;
}

const queues = new Map(), lastRequest = new Map();
async function requestJSON(url, service, signal) {
  const previous = queues.get(service) || Promise.resolve();
  const request = previous.catch(() => {}).then(async () => {
    signal?.throwIfAborted();
    const delay = Math.max(0, 1100 - (Date.now() - (lastRequest.get(service) || 0)));
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    signal?.throwIfAborted();
    lastRequest.set(service, Date.now());
    const controller = new AbortController(), cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(cancel, 8000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error('地图服务暂不可用');
      return await response.json();
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', cancel); }
  });
  queues.set(service, request);
  return request;
}

function featurePlace(feature) {
  if (feature?.geometry?.type !== 'Point' || !validCoordinates(feature.geometry.coordinates)) return null;
  const properties = feature.properties || {};
  return { coordinates: feature.geometry.coordinates, name: properties.name || properties.street || '', street: properties.street, housenumber: properties.housenumber, country: properties.countrycode?.toUpperCase(),
    address: [properties.name, [properties.street, properties.housenumber].filter(Boolean).join(' '), properties.city, properties.country].filter(Boolean).join(', '),
  };
}

// Ambiguous names remain unplaced. A complete street address or a unique name
// match is sufficient; a chain's unrelated first result is not.
export function choosePlace(query, features, country) {
  const places = features.map(featurePlace).filter(Boolean).filter(place => !country || place.country === country);
  const key = placeKey(query);
  const named = places.filter(place => {
    const name = placeKey(place.name);
    return name.length >= 3 && (key === name || key.startsWith(`${name} `));
  });
  if (named.length === 1) return named[0];
  // Photon may return the building instead of its venue name for full addresses.
  const addressed = places.filter(place => place.street && place.housenumber && key.includes(placeKey(place.street)) && key.split(' ').includes(placeKey(place.housenumber)));
  if (addressed.length === 1) return addressed[0];
  return null;
}

export async function locateMapPoint(point, signal) {
  const direct = coordinatesFromAddress(point.query);
  if (direct) return { coordinates: direct, name: point.name };
  const key = `place:${point.locationKey}`, saved = cached(key);
  if (saved && validCoordinates(saved.coordinates)) return saved;
  if (!point.query || point.query.length < 3 || /^(?:https?:\/\/|行程$|午餐$|晚餐$|早餐$|住宿$|休息$)/i.test(point.query)) return null;
  const url = new URL(import.meta.env?.VITE_GEOCODER_URL || 'https://photon.komoot.io/api/');
  url.searchParams.set('q', point.query); url.searchParams.set('limit', '5');
  if (point.country) url.searchParams.set('countrycode', point.country);
  if (validCoordinates(point.center)) { url.searchParams.set('lon', point.center[0]); url.searchParams.set('lat', point.center[1]); }
  const result = await requestJSON(url, 'geocoding', signal);
  const place = choosePlace(point.query, Array.isArray(result.features) ? result.features : [], point.country);
  return place ? remember(key, place) : null;
}

export async function routeMapLeg(leg, signal) {
  if (!leg.profile || !validCoordinates(leg.from.coordinates) || !validCoordinates(leg.to.coordinates)) return null;
  const key = `route:${leg.routeKey}`, saved = cached(key);
  if (saved?.coordinates?.length > 1 && saved.coordinates.every(validCoordinates)) return saved;
  const base = import.meta.env?.VITE_ROUTER_URL || (leg.profile === 'foot' ? 'https://routing.openstreetmap.de/routed-foot' : 'https://router.project-osrm.org');
  const url = new URL(`${base.replace(/\/$/, '')}/route/v1/driving/${leg.from.coordinates.join(',')};${leg.to.coordinates.join(',')}`);
  url.searchParams.set('overview', 'full'); url.searchParams.set('geometries', 'geojson'); url.searchParams.set('radiuses', '500;500');
  const data = await requestJSON(url, 'routing', signal), route = data.routes?.[0];
  if (data.code !== 'Ok' || route?.geometry?.type !== 'LineString' || route.geometry.coordinates.length < 2 || !route.geometry.coordinates.every(validCoordinates)) return null;
  return remember(key, { coordinates: route.geometry.coordinates, seconds: route.duration, meters: route.distance });
}
