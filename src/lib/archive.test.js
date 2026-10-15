import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { archiveCountries, archiveDateRange, countryItineraryDays, countryRegions, countryVisits, journeys, tripUrl } from '../data/archive.js';
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

test('country pages retain original local events and omit days with only international travel', () => {
  for (const [code, startsOn, endsOn] of [
    ['NL', '2026-09-25', '2026-09-27'],
    ['IS', '2026-09-27', '2026-09-30'],
    ['NO', '2026-10-01', '2026-10-05'],
  ]) {
    const days = countryItineraryDays(code);
    assert.deepEqual(days.map(entry => entry.day.key), createJourneyDates({ startsOn, endsOn }).map(day => day.key));
    for (const entry of days) {
      assert.ok(entry.events.every(event => event.country === code));
      assert.ok(entry.events.every(event => entry.journey.dayEvents[entry.day.key].includes(event)));
      assert.ok(entry.events.length, `${code} ${entry.day.key} retains its itinerary`);
    }
  }
  assert.deepEqual(countryItineraryDays('unknown'), []);
});

test('shared travel dates split at country boundaries without altering the complete trip', () => {
  const journey = journeys[0];
  const localEvents = (country, date) => countryItineraryDays(country).find(entry => entry.day.key === date)?.events.map(event => event.id);
  assert.deepEqual(localEvents('NL', '2026-09-27'), ['sep27-checkout', 'sep27-rijksmuseum', 'sep27-hotel-luggage', 'sep27-airport-taxi']);
  assert.deepEqual(localEvents('IS', '2026-09-27'), ['sep27-lotus-car', 'sep27-reykjavik-stay']);
  assert.deepEqual(localEvents('NO', '2026-10-01'), ['oct01-hertz-car', 'oct01-drive-henningsvaer', 'oct01-henningsvaer-stay']);
  assert.equal(localEvents('IS', '2026-10-01'), undefined);
  assert.equal(localEvents('NO', '2026-10-06'), undefined);
  assert.ok(localEvents('NO', '2026-10-05').includes('oct05-tos-osl'), 'domestic flights remain in their country');
  assert.equal(journey.dayEvents['2026-09-27'].length, 7);
  assert.ok(journey.dayEvents['2026-09-27'].some(event => event.id === 'sep27-ams-kef'));
  assert.ok(journey.dayEvents['2026-10-01'].some(event => event.id === 'oct01-kef-svj'));
  assert.ok(journey.dayEvents['2026-10-06'].some(event => event.id === 'oct06-osl-bkk-hkg'));
});

test('country day tabs exclude other dates and ongoing trips and deduplicate overlapping visits', () => {
  const dates = createJourneyDates({ startsOn: '2025-06-01', endsOn: '2025-06-04' });
  const journey = {
    id: 'summer', status: 'completed', startsOn: '2025-06-01', dates,
    dayEvents: Object.fromEntries(dates.map(day => [day.key, [{ id: day.key }]])),
    visits: [
      { country: 'NL', startsOn: '2025-06-02', endsOn: '2025-06-03', regions: [] },
      { country: 'NL', startsOn: '2025-06-03', endsOn: '2025-06-04', regions: [] },
      { country: 'NO', startsOn: '2025-06-01', endsOn: '2025-06-01', regions: [] },
    ],
  };
  const records = [{ ...journey, id: 'future', status: 'ongoing' }, journey];
  const days = countryItineraryDays('NL', records);
  assert.deepEqual(days.map(entry => entry.day.key), ['2025-06-02', '2025-06-03', '2025-06-04']);
  assert.equal(new Set(days.map(entry => entry.id)).size, 3);
  assert.ok(days.every(entry => entry.journey === journey));
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
  assert.equal(archiveDateRange('2026-12-30', '2027-01-02'), '2026.12.30-2027.01.02');
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
