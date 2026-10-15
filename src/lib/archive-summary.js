export function getArchiveSummary(records, countries, additionalVisits = []) {
  const completed = records.filter(journey => journey.status === 'completed');
  const countryCodes = new Set();
  const continents = new Set();
  let northernmost = null;
  let southernmost = null;

  const visits = [
    ...completed.flatMap(journey => journey.visits.map(visit => ({ visit, journey }))),
    ...additionalVisits.map(visit => ({ visit, journey: null })),
  ];
  for (const { visit, journey } of visits) {
    countryCodes.add(visit.country);
    const country = countries.find(item => item.code === visit.country);
    if (country?.continent) continents.add(country.continent);

    for (const region of visit.regions) {
      const latitude = region.coordinates?.[1];
      if (!country || !Number.isFinite(latitude)) continue;
      const place = {
        name: region.name,
        latitude,
        country,
        date: region.firstDate ?? null,
        journeyId: journey?.id ?? null,
      };
      if (!northernmost || latitude > northernmost.latitude) northernmost = place;
      if (!southernmost || latitude < southernmost.latitude) southernmost = place;
    }
  }

  return {
    countryCount: countryCodes.size,
    continents: [...continents].sort(),
    continentCount: continents.size,
    tripCount: completed.length,
    northernmost,
    southernmost,
  };
}
