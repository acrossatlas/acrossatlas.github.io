// Choose a local view, keeping distinct nearby pins at least 180 CSS pixels apart.
// Coincident visits retain their separate marker offsets instead of forcing infinite zoom.
export function nodeFocusZoom(selected, stops, currentZoom = 0, maxZoom = 20) {
  const world = ([lng, lat]) => {
    const sine = Math.sin(Math.max(-85, Math.min(85, lat)) * Math.PI / 180);
    return [(lng + 180) / 360, .5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)];
  };
  const origin = world(selected.coordinates);
  let zoom = Math.max(15, currentZoom);
  for (const stop of stops) {
    if (stop.id === selected.id) continue;
    const point = world(stop.coordinates);
    const distance = Math.hypot(point[0] - origin[0], point[1] - origin[1]);
    if (distance < 1e-8) continue;
    zoom = Math.max(zoom, Math.log2(180 / (512 * distance)));
  }
  return Math.min(maxZoom, zoom);
}
