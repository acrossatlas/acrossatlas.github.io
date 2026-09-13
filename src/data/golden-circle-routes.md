# Golden Circle route data

The 2026-09-28 map follows the existing itinerary event IDs in App.jsx.

- Components: https://www.mapcn.dev/r/map.json, downloaded 2026-09-13; MIT license in ../components/ui/map.LICENSE. The only source adaptation is the local utils import.
- Map style: mapcn's default CARTO Positron, using OpenStreetMap data. Attribution remains visible on the map.
- Road geometry: OSRM public routing service, retrieved 2026-09-13 using `/route/v1/driving/{coordinates}?overview=full&geometries=geojson`. Static snapshots avoid a routing request on every visit. These are route previews, not live traffic or road-closure guidance.
- Coordinates use `[longitude, latitude]`. Reykjavík uses a public city-center reference, not an accommodation address. Attraction pins refer to approximate access/parking locations. Geysir lunch and sightseeing share an arrival location.
- Route order: Reykjavík → Þingvellir Hakið P1 → Geysir Centre → Gullfoss parking → optional Kerið or Secret Lagoon → Reykjavík. `direct` skips both optional stops.
- Distance values are meters; duration values are seconds. Per-leg driving estimates in golden-circle-durations.json were retrieved on 2026-09-13 from routing.openstreetmap.de (OSRM). Labels show rounded minutes, not live traffic; they use the same public city reference as the map, not the accommodation. Label coordinates lie on each road leg. Actual driving time and access depend on navigation and current conditions.

The basemap requires network access. Cached geometry is bundled with the application. The main route is blue; both optional stops and alternative road sections are gray. Details open from map markers, with the existing itinerary cards below the map. Other dates show a world map with an explicit empty state until their locations are added.
