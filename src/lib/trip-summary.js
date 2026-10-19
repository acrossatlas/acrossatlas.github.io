import { travelSeasons, travelStyles } from '../data/travel-styles.js';

export function getTripSummary(records) {
  const completed = records.filter(journey => journey.status === 'completed');
  const years = new Map();
  const seasons = travelSeasons.map(season => ({ ...season, count: 0 }));
  const styles = travelStyles.map(style => ({ ...style, count: 0 }));
  let untaggedTrips = 0;

  for (const journey of completed) {
    // A journey crossing New Year is one departure, in its starting year and season.
    const year = Number(journey.startsOn.slice(0, 4));
    const month = Number(journey.startsOn.slice(5, 7));
    const yearSummary = years.get(year) ?? { year, count: 0, countries: new Map() };
    yearSummary.count++;
    // Each country is placed at its first visit date (or the departure date when visits are undated).
    const dated = journey.visits?.length ? journey.visits.map(visit => [visit.country, visit.startsOn ?? journey.startsOn])
      : (journey.countries ?? []).map(code => [code, journey.startsOn]);
    for (const [code, date] of dated) {
      if (!code) continue;
      const seen = yearSummary.countries.get(code);
      if (seen === undefined || date < seen) yearSummary.countries.set(code, date);
    }
    years.set(year, yearSummary);
    const season = seasons.find(item => item.months.includes(month));
    if (season) season.count++;

    const tagged = styles.filter(style => journey.travelStyles?.includes(style.id));
    if (!tagged.length) untaggedTrips++;
    for (const style of tagged) style.count++;
  }

  const peakSeason = Math.max(0, ...seasons.map(season => season.count));
  return {
    tripCount: completed.length,
    years: [...years.values()].map(({ year, count, countries }) => ({
      // Countries in the order they were visited; ties keep the order they were listed.
      year, count, countries: [...countries.entries()].map((entry, index) => [...entry, index])
        .sort((a, b) => a[1].localeCompare(b[1]) || a[2] - b[2]).map(([code]) => code),
    })).sort((a, b) => b.year - a.year),
    seasons,
    favouriteSeasons: seasons.filter(season => peakSeason > 0 && season.count === peakSeason),
    styles,
    untaggedTrips,
  };
}
