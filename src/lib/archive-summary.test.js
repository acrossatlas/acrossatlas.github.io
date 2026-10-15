import assert from 'node:assert/strict';
import test from 'node:test';
import { archiveCountries, countryOnlyVisits, journeys } from '../data/archive.js';
import { getArchiveSummary } from './archive-summary.js';

test('the current archive counts destinations without counting flight connections', () => {
  const result = getArchiveSummary(journeys, archiveCountries);
  assert.equal(result.countryCount, 3);
  assert.deepEqual(result.continents, ['Europe']);
  assert.equal(result.continentCount, 1);
  assert.equal(result.tripCount, 1);
  assert.equal(result.northernmost.name, 'Tromsø');
  assert.equal(result.northernmost.date, '2026-10-04');
  assert.equal(result.southernmost.name, 'Amsterdam');
  assert.equal(result.southernmost.date, '2026-09-25');
});

test('repeat countries and ongoing journeys do not inflate totals', () => {
  const records = [
    { id: 'first', status: 'completed', startsOn: '2025-12-30', endsOn: '2026-01-02', visits: [
      { country: 'NL', regions: [] }, { country: 'NO', regions: [] },
    ] },
    { id: 'second', status: 'completed', startsOn: '2026-01-02', endsOn: '2026-01-04', visits: [
      { country: 'NL', regions: [] }, { country: 'JP', regions: [] },
    ] },
    { id: 'future', status: 'ongoing', startsOn: '2027-03-01', endsOn: '2027-03-20', visits: [
      { country: 'AU', regions: [{ name: 'Future north', coordinates: [0, 89] }, { name: 'Future south', coordinates: [0, -89] }] },
    ] },
  ];
  const countries = [...archiveCountries, { code: 'JP', continent: 'Asia' }, { code: 'AU', continent: 'Oceania' }];
  const result = getArchiveSummary(records, countries);
  assert.equal(result.countryCount, 3);
  assert.deepEqual(result.continents, ['Asia', 'Europe']);
  assert.equal(result.tripCount, 2);
  assert.equal(result.northernmost, null);
  assert.equal(result.southernmost, null);
});

test('latitude extremes compare signed coordinates, including journeys in the southern hemisphere', () => {
  const country = { code: 'NZ', name: 'New Zealand', slug: 'new-zealand', continent: 'Oceania' };
  const record = { id: 'nz', status: 'completed', startsOn: '2026-01-01', endsOn: '2026-01-05', visits: [{ country: 'NZ', regions: [
    { name: 'South', coordinates: [168, -45], firstDate: '2026-01-01' },
    { name: 'Unknown coordinates', coordinates: [168, null], firstDate: '2026-01-02' },
    { name: 'North', coordinates: [174, -36], firstDate: '2026-01-03' },
  ] }] };
  const result = getArchiveSummary([record], [country]);
  assert.deepEqual(result.northernmost, { name: 'North', latitude: -36, country, date: '2026-01-03', journeyId: 'nz' });
  assert.deepEqual(result.southernmost, { name: 'South', latitude: -45, country, date: '2026-01-01', journeyId: 'nz' });
});

test('an empty archive has zero counts and no highlighted continents or footprint', () => {
  assert.deepEqual(getArchiveSummary([], archiveCountries), {
    countryCount: 0, continents: [], continentCount: 0, tripCount: 0, northernmost: null, southernmost: null,
  });
});

test('dated country-only records add destinations without inventing trips', () => {
  const result = getArchiveSummary(journeys, archiveCountries, countryOnlyVisits);
  assert.equal(result.countryCount, 5);
  assert.deepEqual(result.continents, ['Asia', 'Europe']);
  assert.equal(result.tripCount, 1);
  assert.equal(result.southernmost.name, 'Singapore');
  assert.equal(result.southernmost.date, '2026-06-19');
  assert.equal(result.southernmost.journeyId, null);
  assert.equal(result.northernmost.name, 'Tromsø');
  assert.ok(countryOnlyVisits.every(visit => visit.startsOn && visit.endsOn));
});
