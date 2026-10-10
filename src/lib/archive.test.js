import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { archiveCountries, archiveDateRange, countryRegions, countryVisits, journeys, tripUrl } from '../data/archive.js';
import { countryFeatures } from './archive-geography.js';
import { createJourneyDates, resolveJourneyDayIndex } from './journey-dates.js';

const region = (id, firstDate) => ({ id, firstDate });
const record = (id, status, startsOn, regions) => ({
  id, status, startsOn,
  visits: [{ country: 'NL', startsOn, endsOn: startsOn, regions }],
});

test('country archives exclude ongoing trips and sort completed visits by date', () => {
  const records = [
    record('older', 'completed', '2025-06-01', [region('amsterdam', '2025-06-01')]),
    record('future', 'ongoing', '2027-06-01', [region('rotterdam', '2027-06-01')]),
    record('newer', 'completed', '2026-09-25', [region('amsterdam', '2026-09-25')]),
  ];
  assert.deepEqual(countryVisits('NL', records).map(visit => visit.journey.id), ['newer', 'older']);
  assert.deepEqual(countryVisits('NO', records), []);
});

test('return visits share one region marker linked to the latest journey', () => {
  const records = [
    record('older', 'completed', '2025-06-01', [region('amsterdam', '2025-06-01'), region('utrecht', '2025-06-02')]),
    record('newer', 'completed', '2026-09-25', [region('amsterdam', '2026-09-25')]),
  ];
  const regions = countryRegions('NL', records);
  assert.deepEqual(regions.map(item => item.id), ['amsterdam', 'utrecht']);
  assert.equal(tripUrl(regions[0].journey, regions[0].firstDate), '/trips/newer?date=2026-09-25');
});

test('every archived region opens a real day in the shared itinerary', () => {
  for (const journey of journeys) {
    for (const visit of journey.visits) {
      assert.ok(journey.countries.includes(visit.country));
      assert.ok(visit.startsOn >= journey.startsOn && visit.endsOn <= journey.endsOn);
      for (const item of visit.regions) {
        assert.ok(journey.dates.some(day => day.key === item.firstDate), `${item.id} has a valid entry date`);
        assert.ok(item.dates.every(date => journey.dayEvents[date]?.length), `${item.id} has retained events`);
      }
    }
  }
});

test('day links survive reloads and invalid dates fall back to the first archived day', () => {
  const dates = createJourneyDates({ startsOn: '2026-09-30', endsOn: '2026-10-02' });
  assert.deepEqual(dates.map(day => day.label), ['09.30', '10.01', '10.02']);
  assert.equal(resolveJourneyDayIndex(dates, '2026-10-01'), 1);
  assert.equal(resolveJourneyDayIndex(dates, '2026-10-03'), 0);
  assert.equal(resolveJourneyDayIndex(dates, 'invalid'), 0);
  assert.equal(resolveJourneyDayIndex(dates, null, 2), 2);
  assert.equal(archiveDateRange('2026-12-30', '2027-01-02'), '2026.12.30 — 2027.01.02');
});

test('country covers omit distant territories while retaining the mainland', () => {
  const shapes = JSON.parse(readFileSync(new URL('../data/migration-countries.json', import.meta.url)));
  for (const code of ['NL', 'NO']) {
    const features = countryFeatures(shapes, archiveCountries.find(country => country.code === code));
    const points = features.flatMap(feature => feature.geometry.coordinates.flat(2));
    assert.ok(points.length > 0);
    assert.ok(points.every(([lng, lat]) => code === 'NL' ? lng > 0 && lat > 50 : lat < 72));
  }
});
