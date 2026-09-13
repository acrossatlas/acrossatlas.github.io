import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { numberPlannedStops } from './route-stop-numbers.js';

const norway = JSON.parse(readFileSync(new URL('../data/norway-day-routes.json', import.meta.url)));
const iceland = JSON.parse(readFileSync(new URL('../data/iceland-day-routes.json', import.meta.url)));
const numbers = (stops, route) => numberPlannedStops(stops, route).map(stop => stop.number);

test('intermediate optional stop inserts a number and removal restores following numbers', () => {
  const stops = norway['2026-10-02'].stops;
  assert.deepEqual(numbers(stops, 'direct'), ['0', '1', '+', '2', '3', '4', '5', '6', '7']);
  assert.deepEqual(numbers(stops, 'skagsanden'), ['0', '1', '2', '3', '4', '5', '6', '7', '8']);
  assert.deepEqual(numbers(stops, 'direct'), ['0', '1', '+', '2', '3', '4', '5', '6', '7']);
});

test('golden circle alternatives only number the saved option', () => {
  const stops = [0, 1, 2, 3].map(number => ({ number: String(number) }));
  stops.push({ number: '4', option: 'kerid' }, { number: '4', option: 'lagoon' });
  assert.deepEqual(numbers(stops, 'direct'), ['0', '1', '2', '3', '+', '+']);
  assert.deepEqual(numbers(stops, 'kerid'), ['0', '1', '2', '3', '4', '+']);
  assert.deepEqual(numbers(stops, 'lagoon'), ['0', '1', '2', '3', '+', '4']);
  assert.equal(stops[4].number, '4');
});

test('library and shopping follow the same rule', () => {
  assert.deepEqual(numbers(norway['2026-10-05'].stops, 'direct'), ['0', '1', '2', '+', '3', '4', '5']);
  assert.deepEqual(numbers(norway['2026-10-05'].stops, 'library'), ['0', '1', '2', '3', '4', '5', '6']);
  assert.equal(numbers(iceland['2026-09-29'].stops, 'direct').at(-1), '+');
  assert.equal(numbers(iceland['2026-09-29'].stops, 'shopping').at(-1), '7');
});

test('days without optional stops keep existing location numbering', () => {
  const stops = iceland['2026-09-30'].stops;
  assert.equal(numberPlannedStops(stops, 'direct'), stops);
});
