# New York template routing preview

Retrieved 2026-09-18 from the OpenStreetMap routing service at https://routing.openstreetmap.de/.

`template-new-york-routes.json` contains separate `routed-car` and `routed-foot` snapshots. Each profile includes snapped waypoints and full leg geometries, assembled from returned step geometries. Generic template pins use these snapped waypoints. These are reusable map-layout examples, not an actual planned journey.

Regenerate with `node scripts/update-template-routes.mjs`. The source URL, retrieval date, distances and estimated durations are retained in the snapshot; no visitor-time routing requests are needed.

Rendering rule: ground transport follows supplied road/trail geometry as a solid line; missing geometry means no line. Sea and air connect the two endpoints directly with a dashed line. Never substitute car routing for train or bus geometry. City preview connections stay hidden. Country-level flight endpoints are overview anchors, not airport coordinates or recorded flight tracks.
