import assert from 'node:assert/strict';
import test from 'node:test';
import { countryDayMaps } from '../data/country-day-maps.js';
import norwayArrival from '../data/oct01-driving-route.json' with { type: 'json' };

test('Norway arrival uses the saved local drive with matching stops, bounds and duration', () => {
  const day = countryDayMaps.NO['2026-10-01'];
  const leg = day.visitRoutes.direct[0];
  assert.equal(leg.path, norwayArrival.coordinates);
  assert.equal(leg.seconds, norwayArrival.seconds);
  assert.equal(leg.mode, 'driving');
  assert.equal(leg.dashArray, undefined);
  assert.deepEqual(day.stops.find(stop => stop.id === leg.from).coordinates, leg.path[0]);
  assert.deepEqual(day.stops.find(stop => stop.id === leg.to).coordinates, leg.path.at(-1));
  assert.ok(leg.path.length > 100);
  assert.ok(leg.path.every(([lng, lat]) => lng >= day.bounds[0][0] && lng <= day.bounds[1][0] && lat >= day.bounds[0][1] && lat <= day.bounds[1][1]));
});
