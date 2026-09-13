import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { numberPlannedStops } from './route-stop-numbers.js';
import { adjacentVisitLegs } from './visit-route-focus.js';
const { day, legs } = JSON.parse(readFileSync(new URL('../data/oct03-optional-route.json', import.meta.url)));
test('Svinøya is skipped by default and can be added without renumbering stored data', () => {
  assert.ok(legs.direct.every(leg => leg.from !== 'svinoya' && leg.to !== 'svinoya'));
  assert.ok(legs.direct.some(leg => leg.from === 'center' && leg.to === 'hertz'));
  assert.equal(numberPlannedStops(day.stops, 'direct').find(stop => stop.id === 'svinoya').number, '+');
  assert.equal(numberPlannedStops(day.stops, 'svinoya').find(stop => stop.id === 'svinoya').number, '4');
  assert.deepEqual(adjacentVisitLegs(legs, 'direct', 'svinoya', day.stops).map(leg => [leg.from, leg.to]), [['center', 'svinoya'], ['svinoya', 'hertz']]);
});
