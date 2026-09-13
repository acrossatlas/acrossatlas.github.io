export function adjacentVisitLegs(routes, activeRoute, selected, stops) {
  if (!selected) return [];
  const stop = stops.find(stop => stop.id === selected);
  const route = stop?.option || activeRoute;
  return (routes?.[route] || []).filter(leg => leg.from === selected || leg.to === selected);
}

export function pointAlongLeg(path, fraction = .5) {
  if (path.length < 2) return { coordinates: path[0], rotation: 0 };
  const lengths = path.slice(1).map((p, i) => Math.hypot((p[0] - path[i][0]) * Math.cos(p[1] * Math.PI / 180), p[1] - path[i][1]));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * fraction;
  let index = 0;
  while (index < lengths.length - 1 && remaining > lengths[index]) remaining -= lengths[index++];
  const from = path[index], to = path[index + 1], t = lengths[index] ? remaining / lengths[index] : 0;
  return {
    coordinates: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t],
    rotation: -Math.atan2(to[1] - from[1], (to[0] - from[0]) * Math.cos(from[1] * Math.PI / 180)) * 180 / Math.PI,
  };
}
