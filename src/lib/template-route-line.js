// Sea/air connections are schematic; ground routes require supplied road/trail geometry.
export function templateRouteLine({ mode, geometry, from, to }) {
  if (['flight', 'ferry', '航班', '航空', '海运', '渡轮'].includes(mode)) {
    return from && to ? { coordinates: [from, to], dashArray: [3, 3] } : null;
  }
  if (geometry?.type !== 'LineString' || geometry.coordinates?.length < 2) return null;
  return { coordinates: geometry.coordinates };
}
