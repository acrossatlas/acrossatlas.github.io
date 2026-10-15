import { autumnJourney } from './journeys/autumn-2026.js';

// Journey records supply both the trip archive and the country index.
export const journeys = [autumnJourney].sort((a, b) => b.startsOn.localeCompare(a.startsOn));

export const archiveCountries = [
  { code: 'NL', slug: 'netherlands', name: 'Netherlands', label: '荷兰', continent: 'Europe', color: '#cc6839', overviewBounds: [[3.2, 50.7], [7.3, 53.7]] },
  { code: 'IS', slug: 'iceland', name: 'Iceland', label: '冰岛', continent: 'Europe', color: '#2865bd', overviewBounds: [[-24.6, 63.3], [-13.4, 66.6]] },
  { code: 'NO', slug: 'norway', name: 'Norway', label: '挪威', continent: 'Europe', color: '#e76c59', overviewBounds: [[4.4, 57.8], [31.4, 71.4]] },
  { code: 'SG', slug: 'singapore', name: 'Singapore', label: '新加坡', continent: 'Asia', color: '#ef3340', overviewBounds: [[103.6, 1.2], [104.1, 1.5]] },
  { code: 'TH', slug: 'thailand', name: 'Thailand', label: '泰国', continent: 'Asia', color: '#2d2a4a', overviewBounds: [[97.3, 5.6], [105.7, 20.5]] },
];

// These destinations have confirmed dates; detailed itineraries remain unspecified.
// They do not create trips or change the countries in an existing journey.
export const countryOnlyVisits = [
  { country: 'SG', startsOn: '2026-06-19', endsOn: '2026-06-22', regions: [{ id: 'singapore', name: 'Singapore', coordinates: [103.82, 1.35], firstDate: '2026-06-19' }] },
  { country: 'TH', startsOn: '2026-08-18', endsOn: '2026-08-22', regions: [] },
];

export function findJourney(id) {
  return journeys.find(journey => journey.id === id);
}

export function tripUrl(journey, date) {
  const path = `/trips/${journey.id}`;
  return date ? `${path}?date=${encodeURIComponent(date)}` : path;
}

export function countryVisits(code, records = journeys, additionalVisits = []) {
  const visits = records.filter(journey => journey.status === 'completed').flatMap(journey => (
    journey.visits.filter(visit => visit.country === code).map(visit => ({ ...visit, journey }))
  ));
  return [...visits, ...additionalVisits.filter(visit => visit.country === code)]
    .sort((a, b) => (b.startsOn ?? '').localeCompare(a.startsOn ?? ''));
}

export function countryRegions(code, records = journeys) {
  const unique = new Map();
  for (const visit of countryVisits(code, records)) {
    for (const region of visit.regions) {
      // Keep one map marker per region when the same country is revisited.
      if (!unique.has(region.id)) unique.set(region.id, { ...region, journey: visit.journey });
    }
  }
  return [...unique.values()];
}

export function countryItineraryDays(code, records = journeys) {
  const days = new Map();
  for (const visit of countryVisits(code, records)) {
    for (const day of visit.journey.dates) {
      if (day.key < visit.startsOn || day.key > visit.endsOn) continue;
      const events = (visit.journey.dayEvents[day.key] ?? []).filter(event => event.country === undefined || event.country === code);
      if (!events.length) continue;
      const id = `${visit.journey.id}:${day.key}`;
      if (!days.has(id)) days.set(id, {
        id,
        day,
        journey: visit.journey,
        events,
      });
    }
  }
  return [...days.values()].sort((a, b) => a.day.key.localeCompare(b.day.key) || a.id.localeCompare(b.id));
}

export function archiveDateRange(startsOn, endsOn) {
  return `${startsOn.replaceAll('-', '.')}-${endsOn.replaceAll('-', '.')}`;
}
