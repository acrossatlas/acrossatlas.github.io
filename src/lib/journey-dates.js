export function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getJourneyDayCount(journey) {
  const start = dateFromKey(journey.startsOn);
  const end = dateFromKey(journey.endsOn);
  return Math.round((end - start) / 86400000) + 1;
}

export function createJourneyDates(journey) {
  const start = dateFromKey(journey.startsOn);

  return Array.from({ length: getJourneyDayCount(journey) }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);

    return {
      key: date.toISOString().slice(0, 10),
      label: `${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`,
    };
  });
}

// A named section runs up to the next named or unnamed divider; the final
// section includes the last travel day. Dates before the first section stay unnamed.
export function getJourneySections(journey) {
  const dates = createJourneyDates(journey);
  const labels = journey.sectionLabels ?? {};
  const boundaries = new Set([...Object.keys(labels), ...(journey.sectionDividers ?? [])]);
  const sections = dates.flatMap((day, index) => boundaries.has(day.key) ? [{ index, name: labels[day.key]?.trim() }] : []);
  return sections.flatMap((section, index) => section.name ? [{
    name: section.name,
    startsOn: dates[section.index].key,
    endsOn: dates[(sections[index + 1]?.index ?? dates.length) - 1].key,
  }] : []);
}

export function resolveJourneyDayIndex(dates, dateKey, fallback = 0) {
  const index = dates.findIndex(date => date.key === dateKey);
  return index >= 0 ? index : fallback;
}
