// Stops are stored in itinerary order. Preview state never affects saved numbering.
export function numberPlannedStops(stops, activeRoute) {
  if (!stops.some(stop => stop.option)) return stops;
  let nextNumber = 0;
  return stops.map(stop => ({
    ...stop,
    number: stop.option && stop.option !== activeRoute ? '+' : String(nextNumber++),
  }));
}
