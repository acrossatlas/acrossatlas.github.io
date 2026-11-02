import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMapLegs, buildMapPlan, coordinatesFromAddress, createMapCatalog, findKnownPlace, mapEventSignature, resolveMapPoints, validCoordinates } from './itinerary-map.js';
import { choosePlace, locateMapPoint, routeMapLeg } from './map-services.js';

const places = [
  { name: 'Museum', country: 'NL', aliases: ['Museum', 'Museumplein 6, Amsterdam'], coordinates: [4.88, 52.35] },
  { name: 'Park', country: 'NL', aliases: ['Park'], coordinates: [4.86, 52.36] },
  { name: 'Station', country: 'NL', aliases: ['Station'], coordinates: [4.9, 52.38] },
];
const visit = (id, navigation, extra = {}) => ({ id, title: id, navigation, type: '行程', country: 'NL', ...extra });
const feature = (name, coordinates = [4.86, 52.36], extra = {}) => ({ type: 'Feature', geometry: { type: 'Point', coordinates }, properties: { name, countrycode: 'NL', ...extra } });

test('addresses accept coordinates and marker links, never a Google viewport or unrelated URL', () => {
  assert.deepEqual(coordinatesFromAddress('52.35, 4.88'), [4.88, 52.35]);
  assert.deepEqual(coordinatesFromAddress('https://www.google.com/maps/place/Park/data=!3d52.36!4d4.86'), [4.86, 52.36]);
  assert.deepEqual(coordinatesFromAddress('https://maps.google.com/?q=52.35,4.88'), [4.88, 52.35]);
  assert.deepEqual(coordinatesFromAddress('https://www.openstreetmap.org/?mlat=52.35&mlon=4.88'), [4.88, 52.35]);
  for (const address of ['https://www.google.com/maps/@52.35,4.88,14z', 'https://example.com/?q=52,4', '91,4', 'Park']) assert.equal(coordinatesFromAddress(address), null);
  for (const point of [[NaN, 52], [4, Infinity], [181, 0], ['4', 52], [4, 91]]) assert.equal(validCoordinates(point), false);
});

test('reordering, adding and deleting cards immediately changes pins and connected endpoints', () => {
  const events = [visit('a', 'Museum'), visit('b', 'Park')];
  const initial = resolveMapPoints(buildMapPlan(events, places));
  assert.deepEqual(initial.map(point => point.name), ['a', 'b']);
  const next = resolveMapPoints(buildMapPlan([events[1], visit('c', 'Station'), events[0]], places));
  assert.deepEqual(next.map(point => point.number), ['1', '2', '3']);
  assert.deepEqual(buildMapLegs(next).map(leg => [leg.from.query, leg.to.query]), [['Park', 'Station'], ['Station', 'Museum']]);
  const removed = resolveMapPoints(buildMapPlan([events[1]], places));
  assert.equal(removed.length, 1); assert.equal(buildMapLegs(removed).length, 0);
});

test('a changed address or AI-supplied location never reuses coordinates for the previous input', () => {
  const event = visit('a', 'Museum', { location: { query: 'Museum', coordinates: [4.88, 52.35] } });
  const previous = buildMapPlan([event], places)[0];
  const next = buildMapPlan([{ ...event, navigation: 'New place' }], places)[0];
  assert.equal(next.coordinates, undefined);
  assert.notEqual(previous.locationKey, next.locationKey);
  assert.equal(resolveMapPoints([next], { [previous.locationKey]: { coordinates: [4.88, 52.35] } })[0].coordinates, undefined);
  const supplied = buildMapPlan([{ ...event, navigation: 'New place', location: { query: 'New place', coordinates: [5, 53] } }], places)[0];
  assert.deepEqual(supplied.coordinates, [5, 53]);
});

test('unresolved intermediate locations keep a gap instead of connecting past them', () => {
  const points = resolveMapPoints(buildMapPlan([visit('a', 'Museum'), visit('unknown', 'Unknown'), visit('b', 'Park')], places));
  assert.equal(buildMapLegs(points).length, 0);
  const resolved = resolveMapPoints(buildMapPlan([visit('a', 'Museum'), visit('unknown', 'Unknown'), visit('b', 'Park')], places), { [points[1].locationKey]: { coordinates: [4.87, 52.355] } });
  assert.equal(buildMapLegs(resolved).length, 2);
});

test('flight segments preserve every transfer and merge only consecutive identical airports', () => {
  const airports = { HKG: { coordinates: [113.9173, 22.3126] }, TPE: { coordinates: [121.2346, 25.0793] }, AMS: { coordinates: [4.764, 52.309] } };
  const catalog = createMapCatalog([], [], airports).places;
  const event = { id: 'flight', type: '交通', title: 'HKG - AMS', country: 'NL', transport: { mode: '航班', segments: [{ id: 'one', from: 'HKG', to: 'TPE', mode: '航班' }, { id: 'two', from: 'TPE', to: 'AMS', mode: '航班' }] } };
  const points = resolveMapPoints(buildMapPlan([event], catalog));
  assert.deepEqual(points.map(point => point.query), ['HKG', 'TPE', 'AMS']);
  assert.equal(points[0].country, undefined, 'cross-country departure lookup is unrestricted');
  const legs = buildMapLegs(points);
  assert.equal(legs.length, 2); assert.ok(legs.every(leg => leg.isFlight && leg.schematic && !leg.profile));
  assert.ok(legs.every(leg => leg.coordinates.length === 2));
});

test('repeated visits keep their position in the route and show a return pin', () => {
  const points = resolveMapPoints(buildMapPlan([visit('a', 'Museum'), visit('b', 'Museum'), visit('c', 'Park'), visit('d', 'Museum')], places));
  assert.equal(points.length, 3); assert.deepEqual(points[0].eventIds, ['a', 'b']);
  assert.equal(points[2].repeatOf, points[0].id); assert.equal(buildMapLegs(points).length, 2);
});

test('verified geometry is reused only for its current endpoints and travel mode', () => {
  const points = resolveMapPoints(buildMapPlan([visit('a', 'Museum'), visit('b', 'Park')], places, { defaultMode: 'driving' }));
  const path = [[4.88, 52.35], [4.87, 52.35], [4.86, 52.36]];
  const saved = [{ start: points[0].coordinates, end: points[1].coordinates, path, mode: 'driving' }];
  assert.equal(buildMapLegs(points, saved)[0].schematic, false);
  assert.deepEqual(buildMapLegs(points, saved)[0].coordinates, path);
  assert.equal(buildMapLegs([...points].reverse(), saved)[0].schematic, true);
  assert.equal(buildMapLegs(points.map(point => ({ ...point, mode: '航班' })), saved)[0].schematic, true);
});

test('time, description, booking and display-name edits do not invalidate a known address', () => {
  const events = [visit('a', 'Museum')];
  assert.equal(mapEventSignature(events), mapEventSignature([{ ...events[0], title: 'A better display name', detail: 'New note', startsAt: '12:00', paymentStatus: '已付款' }]));
  assert.notEqual(mapEventSignature(events), mapEventSignature([{ ...events[0], navigation: 'Park' }]));
});

test('ambiguous same-name locations are not silently pinned in the wrong place', () => {
  assert.equal(findKnownPlace('Park', [...places, { aliases: ['Park'], coordinates: [0, 0] }]), null);
  assert.equal(choosePlace('Cafe', [feature('Cafe'), feature('Cafe', [4.9, 52.4])], 'NL'), null);
  assert.deepEqual(choosePlace('Vondelpark, Amsterdam', [feature('Vondelpark')], 'NL').coordinates, [4.86, 52.36]);
  assert.equal(choosePlace('Unknown road 12, Amsterdam', [feature('Amsterdam')], 'NL'), null);
  assert.equal(choosePlace('Vondelpark', [feature('Vondelpark', [4, 52], { countrycode: 'DE' })], 'NL'), null);
});

test('geocoding and routing cache successful lookups and never swap walking for driving', async t => {
  const urls = [];
  t.mock.method(globalThis, 'fetch', async url => {
    urls.push(String(url));
    if (String(url).includes('/api/')) return { ok: true, json: async () => ({ features: [feature('Vondelpark')] }) };
    return { ok: true, json: async () => ({ code: 'Ok', routes: [{ duration: 120, distance: 500, geometry: { type: 'LineString', coordinates: [[4.86, 52.36], [4.87, 52.37]] } }] }) };
  });
  const point = { query: 'Vondelpark Amsterdam', country: 'NL', locationKey: 'unit-vondelpark' };
  assert.ok((await locateMapPoint(point)).coordinates);
  await locateMapPoint(point);
  assert.equal(urls.length, 1);
  const leg = { profile: 'foot', from: { coordinates: [4.86, 52.36] }, to: { coordinates: [4.87, 52.37] }, routeKey: 'unit-foot' };
  assert.equal((await routeMapLeg(leg)).seconds, 120);
  await routeMapLeg(leg);
  assert.equal(urls.length, 2); assert.ok(urls[1].includes('routed-foot'));
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(locateMapPoint({ ...point, locationKey: 'unit-cancelled' }, cancelled.signal));
  assert.equal(urls.length, 2);
});
