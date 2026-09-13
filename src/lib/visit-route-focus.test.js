import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adjacentVisitLegs, pointAlongLeg } from './visit-route-focus.js';
import { numberPlannedStops } from './route-stop-numbers.js';
const read = file => JSON.parse(readFileSync(new URL(`../data/${file}.json`, import.meta.url)));
const routes = read('visit-route-legs'), norway = read('norway-day-routes'), iceland = read('iceland-day-routes');
const pairs = legs => legs.map(leg => `${leg.from}>${leg.to}`);

test('Reine dinner is visit 7 and focuses Å → dinner → home, not visit 5', () => {
  const stops = norway['2026-10-02'].stops;
  const numbered = numberPlannedStops(stops, 'direct');
  assert.equal(numbered.find(stop => stop.id === 'reine').number, '5');
  assert.equal(numbered.find(stop => stop.id === 'reine-dinner').number, '7');
  assert.deepEqual(pairs(adjacentVisitLegs(routes['2026-10-02'], 'direct', 'reine-dinner', stops)), ['a>reine-dinner', 'reine-dinner>home']);
  assert.deepEqual(pairs(adjacentVisitLegs(routes['2026-10-02'], 'direct', 'reine', stops)), ['sakrisoy>reine', 'reine>a']);
});
test('optional preview uses its branch without changing saved numbering', () => {
  const stops = norway['2026-10-02'].stops;
  assert.deepEqual(pairs(adjacentVisitLegs(routes['2026-10-02'], 'direct', 'skagsanden', stops)), ['haukland>skagsanden', 'skagsanden>ramberg']);
  assert.equal(numberPlannedStops(stops, 'direct').find(stop => stop.id === 'skagsanden').number, '+');
  assert.deepEqual(adjacentVisitLegs(routes['2026-10-02'], 'skagsanden', null, stops), []);
});
test('all routed legs have a directed path, duration and existing visit IDs', () => {
  for (const [day, variants] of Object.entries(routes)) {
    const stops = norway[day]?.stops || iceland[day]?.stops;
    for (const legs of Object.values(variants)) for (const leg of legs) {
      assert.ok(leg.path.length > 1, `${day} ${leg.from}>${leg.to}`);
      assert.ok(leg.seconds > 0);
      assert.ok(leg.path.every(p => p.length === 2 && p.every(Number.isFinite)));
      if (stops) for (const id of [leg.from, leg.to]) assert.ok(stops.some(stop => stop.id === id), `${day}: ${id}`);
    }
  }
});
test('hotel luggage is a distinct visit before the airport; final stays have no invented return', () => {
  assert.deepEqual(pairs(adjacentVisitLegs(routes['2026-10-05'], 'direct', 'hotel-luggage', norway['2026-10-05'].stops)), ['square>hotel-luggage', 'hotel-luggage>airport']);
  assert.deepEqual(pairs(adjacentVisitLegs(routes['2026-10-04'], 'direct', 'hotel-night', norway['2026-10-04'].stops)), ['dinner>hotel-night']);
});
test('direction follows path orientation', () => {
  assert.equal(pointAlongLeg([[0, 0], [1, 0]]).rotation, -0);
  assert.equal(pointAlongLeg([[1, 0], [0, 0]]).rotation, -180);
});
