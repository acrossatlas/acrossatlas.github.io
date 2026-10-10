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

export function resolveJourneyDayIndex(dates, dateKey, fallback = 0) {
  const index = dates.findIndex(date => date.key === dateKey);
  return index >= 0 ? index : fallback;
}
