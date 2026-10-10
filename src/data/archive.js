import { autumnJourney } from './journeys/autumn-2026.js';

// One itinerary record supplies both the trip archive and the country index.
export const journeys = [autumnJourney].sort((a, b) => b.startsOn.localeCompare(a.startsOn));

export const archiveCountries = [
  { code: 'NL', slug: 'netherlands', name: 'Netherlands', label: '荷兰', color: '#cc6839', overviewBounds: [[3.2, 50.7], [7.3, 53.7]] },
  { code: 'IS', slug: 'iceland', name: 'Iceland', label: '冰岛', color: '#2865bd', overviewBounds: [[-24.6, 63.3], [-13.4, 66.6]] },
  { code: 'NO', slug: 'norway', name: 'Norway', label: '挪威', color: '#e76c59', overviewBounds: [[4.4, 57.8], [31.4, 71.4]] },
];

export function findJourney(id) {
  return journeys.find(journey => journey.id === id);
}

export function tripUrl(journey, date) {
  const path = `/trips/${journey.id}`;
  return date ? `${path}?date=${encodeURIComponent(date)}` : path;
}

export function countryVisits(code, records = journeys) {
  return records.filter(journey => journey.status === 'completed').flatMap(journey => (
    journey.visits.filter(visit => visit.country === code).map(visit => ({ ...visit, journey }))
  )).sort((a, b) => b.startsOn.localeCompare(a.startsOn));
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

export function archiveDateRange(startsOn, endsOn) {
  const start = startsOn.replaceAll('-', '.');
  const end = startsOn.slice(0, 4) === endsOn.slice(0, 4)
    ? endsOn.slice(5).replace('-', '.') : endsOn.replaceAll('-', '.');
  return `${start} — ${end}`;
}
