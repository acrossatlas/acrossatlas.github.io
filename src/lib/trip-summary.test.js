import assert from 'node:assert/strict';
import test from 'node:test';
import { journeys, tripLogRecords } from '../data/archive.js';
import { getTripSummary } from './trip-summary.js';

test('the current trip is an autumn departure with two overlapping travel styles', () => {
  const result = getTripSummary(journeys);
  assert.equal(result.tripCount, 1);
  assert.deepEqual(result.years, [{ year: 2026, count: 1, countries: ['NL', 'IS', 'NO'] }]);
  assert.deepEqual(result.favouriteSeasons.map(season => season.id), ['autumn']);
  assert.deepEqual(result.styles.map(style => [style.id, style.count]), [['road-trip', 1], ['city-walk', 1], ['hiking', 0]]);
  assert.equal(result.untaggedTrips, 0);
});

test('a New Year journey counts once by departure, and duplicate style tags count once per trip', () => {
  const result = getTripSummary([
    { status: 'completed', startsOn: '2025-12-30', endsOn: '2026-01-05', travelStyles: ['road-trip', 'road-trip', 'city-walk'] },
    { status: 'completed', startsOn: '2026-03-01', travelStyles: ['city-walk'] },
    { status: 'ongoing', startsOn: '2027-03-01', travelStyles: ['hiking'] },
  ]);
  assert.equal(result.tripCount, 2);
  assert.deepEqual(result.years, [{ year: 2026, count: 1, countries: [] }, { year: 2025, count: 1, countries: [] }]);
  assert.deepEqual(result.favouriteSeasons.map(season => season.id), ['spring', 'winter']);
  assert.deepEqual(result.styles.map(style => style.count), [1, 2, 0]);
});

test('missing and unknown styles remain unclassified instead of being inferred from itinerary text', () => {
  const result = getTripSummary([
    { status: 'completed', startsOn: '2026-09-01', dayEvents: { title: 'Hiking' } },
    { status: 'completed', startsOn: '2026-09-02', travelStyles: ['unknown'] },
  ]);
  assert.equal(result.untaggedTrips, 2);
  assert.ok(result.styles.every(style => style.count === 0));
});

test('an empty archive has no winning season, no invented years, and zero style counts', () => {
  const result = getTripSummary([]);
  assert.equal(result.tripCount, 0);
  assert.deepEqual(result.years, []);
  assert.deepEqual(result.favouriteSeasons, []);
  assert.equal(result.untaggedTrips, 0);
  assert.ok(result.styles.every(style => style.count === 0));
});

test('the Trip log counts Singapore and Thailand as trips and orders countries by visit date', () => {
  const result = getTripSummary(tripLogRecords);
  assert.equal(result.tripCount, 3);
  assert.deepEqual(result.years, [{ year: 2026, count: 3, countries: ['SG', 'TH', 'NL', 'IS', 'NO'] }]);
  assert.deepEqual(result.favouriteSeasons.map(season => season.id), ['summer']);
  assert.deepEqual(tripLogRecords.map(record => record.startsOn), ['2026-09-24', '2026-08-18', '2026-06-19']);
});

test('yearly dots represent distinct countries while every completed departure counts as a trip', () => {
  const result = getTripSummary([
    { status: 'completed', startsOn: '2026-04-01', countries: ['NL', 'NO', 'NL'] },
    { status: 'completed', startsOn: '2026-09-01', countries: ['IS', 'NO'] },
    { status: 'completed', startsOn: '2027-06-01', visits: [{ country: 'NO' }, { country: 'IS' }] },
    { status: 'ongoing', startsOn: '2027-09-01', countries: ['NL'] },
  ]);
  assert.deepEqual(result.years, [
    { year: 2027, count: 1, countries: ['NO', 'IS'] },
    { year: 2026, count: 2, countries: ['NL', 'NO', 'IS'] },
  ]);
});
