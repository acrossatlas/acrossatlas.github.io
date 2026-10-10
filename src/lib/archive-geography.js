// Keep country overviews on the mainland area relevant to this travel archive.
export function countryFeatures(collection, country) {
  const [[west, south], [east, north]] = country.overviewBounds;
  return collection.features.filter(feature => feature.properties.country === country.code).flatMap(feature => {
    const polygons = feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates : [feature.geometry.coordinates];
    const coordinates = polygons.filter(rings => rings[0].some(([lng, lat]) => (
      lng >= west && lng <= east && lat >= south && lat <= north
    )));
    return coordinates.length ? [{ ...feature, geometry: { type: 'MultiPolygon', coordinates } }] : [];
  });
}
