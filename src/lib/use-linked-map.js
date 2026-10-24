import { useEffect, useMemo, useState } from 'react';
import { buildMapLegs, resolveMapPoints, validCoordinates } from './itinerary-map.js';
import { locateMapPoint, routeMapLeg } from './map-services.js';

export function useLinkedMap(plan, savedLegs, retry) {
  const key = JSON.stringify(plan.map(({ id, query, country, coordinates, mode, locationKey }) => [id, query, country, coordinates, mode, locationKey]));
  const [lookup, setLookup] = useState({ key, locations: {}, pending: false });
  const [routes, setRoutes] = useState({});
  const locations = lookup.key === key ? lookup.locations : {};
  const points = useMemo(() => resolveMapPoints(plan, locations), [plan, locations]);
  const legs = useMemo(() => buildMapLegs(points, savedLegs), [points, savedLegs]);
  const legKey = JSON.stringify(legs.map(leg => [leg.routeKey, leg.schematic]));

  useEffect(() => {
    const controller = new AbortController(), signal = controller.signal;
    const requests = [...new Map(plan.filter(point => !validCoordinates(point.coordinates)).map(point => [point.locationKey, point])).values()];
    setLookup({ key, locations: {}, pending: requests.length > 0 });
    (async () => {
      const locations = {};
      for (const point of requests) {
        try { const place = await locateMapPoint(point, signal); if (place) locations[point.locationKey] = place; }
        catch { /* Preserve known pins and expose a retry for missing places. */ }
        if (signal.aborted) return;
        setLookup({ key, locations: { ...locations }, pending: true });
      }
      if (!signal.aborted) setLookup({ key, locations, pending: false });
    })();
    return () => controller.abort();
  }, [key, retry]);

  useEffect(() => {
    const controller = new AbortController(), signal = controller.signal;
    (async () => {
      for (const leg of legs.filter(leg => leg.schematic && leg.profile)) {
        try {
          const route = await routeMapLeg(leg, signal);
          if (!signal.aborted && route) setRoutes(current => ({ ...current, [leg.routeKey]: route }));
        } catch { /* A failed road lookup remains an explicitly schematic line. */ }
        if (signal.aborted) return;
      }
    })();
    return () => controller.abort();
  }, [legKey, retry]);
  return { points, legs: legs.map(leg => routes[leg.routeKey] ? { ...leg, ...routes[leg.routeKey], schematic: false } : leg),
    pending: lookup.key !== key || lookup.pending, missing: points.filter(point => !validCoordinates(point.coordinates)),
  };
}
