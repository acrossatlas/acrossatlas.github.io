import { Component, useEffect, useMemo, useState } from 'react';
import { Map, MapMarker, MarkerContent, MapRoute, useMap } from './ui/map';
import routes from '../data/golden-circle-routes.json';
import durations from '../data/golden-circle-durations.json';
import icelandDays from '../data/iceland-day-routes.json';
import norwayDays from '../data/norway-day-routes.json';
import { amsterdamMapDays, amsterdamVisitRoutes } from '../data/amsterdam-map';
import DayMapStop from './DayMapStop';
import { numberPlannedStops } from '../lib/route-stop-numbers';
import savedVisitRoutes from '../data/visit-route-legs.json';
import oct03Optional from '../data/oct03-optional-route.json';
import sep30Checkout from '../data/sep30-checkout-route.json';
import { adjacentVisitLegs, pointAlongLeg } from '../lib/visit-route-focus';
import { nodeFocusZoom } from '../lib/node-focus-zoom';
import CountryFlag, { countriesForDay } from './CountryFlag';
import MigrationMap, { airports, migrationDays, transferOverview } from './MigrationMap';
import { countryThemes, overviewForDay, basemapPaint, volcanicPaint } from './map-themes';
import { countryDayMaps } from '../data/country-day-maps';
import MapControls from './MapControls';
import { hasChangedRoute } from '../lib/notebook.js';
import { journeys } from '../data/archive.js';
import { buildMapPlan, createMapCatalog, validCoordinates } from '../lib/itinerary-map.js';
import { useLinkedMap } from '../lib/use-linked-map.js';

const visitRoutes = { ...savedVisitRoutes, '2026-10-03': oct03Optional.legs, '2026-09-30': sep30Checkout.legs };
const mapDaysByCountry = { NL: amsterdamMapDays, IS: icelandDays, NO: norwayDays };
const stops = [
  { id: 'city', number: '0', name: 'Reykjavík 雷克雅未克', subtitle: '出发 / 返回 · 市区示意', coordinates: [-21.9426, 64.1466], eventIds: ['sep29-reykjavik-stay'] },
  { id: 'thingvellir', number: '1', name: 'Þingvellir 辛格维利尔国家公园', subtitle: '国家公园 · Hakið P1', coordinates: [-21.129, 64.2558], eventIds: ['sep29-thingvellir'] },
  { id: 'geysir', number: '2', name: 'Geysir 盖锡尔间歇泉', subtitle: '午餐 / 间歇泉', coordinates: [-20.3024, 64.3093], eventIds: ['sep29-geysir-lunch', 'sep29-geysir'] },
  { id: 'gullfoss', number: '3', name: 'Gullfoss 黄金瀑布', subtitle: '黄金瀑布 · 停车场', coordinates: [-20.1364, 64.3266], eventIds: ['sep29-gullfoss'] },
  { id: 'kerid', number: '4', name: 'Kerið 凯瑞斯火山口', subtitle: '可选 · 火山口', coordinates: [-20.8853, 64.0413], eventIds: ['sep29-kerid-optional'], option: 'kerid' },
  { id: 'lagoon', number: '4', name: 'Secret Lagoon 秘密温泉', subtitle: '可选 · 秘密温泉', coordinates: [-20.3094, 64.1375], eventIds: ['sep29-secret-lagoon-optional'], option: 'lagoon' },
];
const bounds = [[-22.02, 63.97], [-19.96, 64.40]];
const fitOptions = { padding: { top: 95, bottom: 55, left: 55, right: 85 }, duration: 0 };

// Anchor branch labels to their own roads, before the return routes merge.
const labelTargets = {
  'gullfoss-lagoon': ['lagoon', [-20.31, 64.19]],
  'gullfoss-kerid': ['kerid', [-20.8, 64.1]],
  'kerid-city': ['kerid', [-20.96, 64.025]],
  'lagoon-city': ['lagoon', [-20.65, 64.02]],
};
function labelCoordinates(leg) {
  const target = labelTargets[`${leg.from}-${leg.to}`];
  if (!target) return leg.coordinates;
  const [route, point] = target;
  const distance = (p) => ((p[0] - point[0]) * 0.44) ** 2 + (p[1] - point[1]) ** 2;
  return routes[route].coordinates.reduce((best, p) => distance(p) < distance(best) ? p : best);
}
const visibleLegs = durations.legs.filter((leg) => !(leg.from === 'gullfoss' && leg.to === 'city'));
const travelModes = { transit: '交通', driving: '驾车', bus: '公交', train: '火车', walking: '步行', ferry: '渡轮', taxi: '出租车' };
const mapStops = stops.map((stop) => {
  const distance = (p) => ((p[0] - stop.coordinates[0]) * 0.44) ** 2 + (p[1] - stop.coordinates[1]) ** 2;
  const coordinates = routes[stop.option || 'direct'].coordinates.reduce((best, p) => distance(p) < distance(best) ? p : best);
  return { ...stop, coordinates };
});

const mapCatalog = createMapCatalog([
  ...Object.entries(amsterdamMapDays).map(([date, config]) => ({ ...config, country: 'NL', visitRoutes: amsterdamVisitRoutes[date] })),
  ...Object.values(icelandDays).map(config => ({ ...config, country: 'IS' })),
  ...Object.values(norwayDays).map(config => ({ ...config, country: 'NO' })),
  ...Object.values(migrationDays),
  ...Object.entries(visitRoutes).map(([date, legs]) => ({ ...(date === '2026-09-30' ? sep30Checkout.day : date === '2026-10-03' ? oct03Optional.day : { stops: mapStops, country: 'IS' }), visitRoutes: legs })),
  ...Object.values(countryDayMaps).flatMap(days => Object.values(days)),
], journeys.flatMap(journey => Object.values(journey.dayEvents).flat()), airports);

class MapBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="daily-map__error">地图暂时无法显示，请查看下方行程卡片。</p> : this.props.children; }
}

function MapTools({ selected, focusedLegs, routeFocus, isGoldenCircle, isIceland, countryTheme, overview, onReset, onRouteClick, clickableLegs, mapStops, routes, bounds, overviewBounds, focusZoom = 8.7, controls = true }) {
  const { map, isLoaded } = useMap();
  const [error, setError] = useState(false);
  function resetView() {
    if (!map) return;
    onReset();
    map.stop();
    map.resize();
    if (isGoldenCircle) map.fitBounds(bounds, { ...fitOptions, bearing: 0, pitch: 0 });
    else map.jumpTo({ ...overview, bearing: 0, pitch: 0 });
  }
  useEffect(() => {
    if (!map || !isLoaded) return;
    const onBlankClick = (event) => {
      // DOM markers and controls are not blank canvas; route clicks keep their own action.
      if (event.originalEvent.target !== map.getCanvas()) return;
      const { x, y } = event.point;
      const hits = map.queryRenderedFeatures([[x - 10, y - 10], [x + 10, y + 10]]);
      // MapLibre returns topmost features first: handle an overlap once, not once per line.
      const hit = hits.find(feature => String(feature.layer?.source ?? '').startsWith('route-source-daily-segment-'));
      if (hit) {
        const index = Number(String(hit.layer.source).replace('route-source-daily-segment-', ''));
        if (clickableLegs[index]) onRouteClick(clickableLegs[index]);
        return;
      }
      // Dismiss the preview without moving the camera. Only the reset button fits the overview.
      map.stop();
      onReset();
    };
    map.on('click', onBlankClick);
    return () => map.off('click', onBlankClick);
  }, [map, isLoaded, isGoldenCircle, overview, onReset, clickableLegs, onRouteClick]);
  useEffect(() => {
    if (!map) return;
    const onError = () => setError(true);
    const onIdle = () => setError(false);
    map.on('error', onError);
    map.on('idle', onIdle);
    const observer = new ResizeObserver(() => { map.resize(); });
    observer.observe(map.getContainer());
    return () => { observer.disconnect(); map.off('error', onError); map.off('idle', onIdle); };
  }, [map]);
  useEffect(() => {
    if (!map || !isLoaded) return;
    for (const [layer, property, color] of (isIceland ? volcanicPaint : countryTheme?.paint || basemapPaint)) {
      if (map.getLayer(layer)) map.setPaintProperty(layer, property, color);
    }
    for (const layer of map.getStyle().layers) {
      if (layer.type === 'line' && (/^road_.*fill/.test(layer.id) || /^highway_(path|minor|.+_inner)$/.test(layer.id))) {
        map.setPaintProperty(layer.id, 'line-color', isIceland ? '#66695f' : countryTheme?.road || '#fafaf7');
      }
      if ((isIceland || countryTheme) && layer.type === 'symbol' && layer.layout?.['text-field']) {
        map.setPaintProperty(layer.id, 'text-color', isIceland ? '#b9beb1' : countryTheme.text);
        map.setPaintProperty(layer.id, 'text-halo-color', isIceland ? '#30322f' : countryTheme.halo);
      }
    }

  }, [map, isLoaded, isIceland, countryTheme]);
  useEffect(() => {
    if (!map || !isLoaded || !selected) return;
    const stop = mapStops.find((item) => item.id === selected);
    if (!stop) return;
    const ids = new Set([selected, ...focusedLegs.flatMap(leg => [leg.from, leg.to])]);
    const points = mapStops.filter(item => ids.has(item.id)).map(item => item.coordinates);
    const lngs = points.map(point => point[0]), lats = points.map(point => point[1]);
    if (new Set(points.map(point => point.join(','))).size > 1) {
      const { clientWidth: width, clientHeight: height } = map.getContainer();
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
        padding: { top: Math.min(140, height * .28), bottom: Math.min(70, height * .14), left: Math.min(85, width * .18), right: Math.min(120, width * .24) },
        maxZoom: Math.min(20, map.getMaxZoom()), bearing: 0, pitch: 0,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400,
      });
      return;
    }
    map.easeTo({ center: stop.coordinates, offset: [0, 70], bearing: 0, pitch: 0, zoom: nodeFocusZoom(stop, mapStops, map.getZoom(), map.getMaxZoom()), duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400 });
  }, [map, isLoaded, selected, mapStops, focusedLegs]);
  useEffect(() => {
    if (!map || !isLoaded || !routeFocus) return;
    const points = routeFocus.path;
    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: { top: 65, bottom: 45, left: 40, right: 40 },
      maxZoom: Math.min(20, map.getMaxZoom()), bearing: 0, pitch: 0,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400,
    });
  }, [map, isLoaded, routeFocus]);
  return <>
    {error && <p role="status" className="daily-map__error">底图加载失败，请检查网络后重试。下方行程仍可查看。</p>}
    {controls && <MapControls onReset={resetView} onShowAll={overviewBounds ? () => { onReset(); map?.fitBounds(overviewBounds, { ...fitOptions, bearing: 0, pitch: 0 }); } : undefined} />}
  </>;
}

export default function DayRouteMap(props) {
  if (props.genericMap || (props.originalEvents && hasChangedRoute(props.events, props.originalEvents))) {
    const sourceDayKey = props.genericMap ? journeys.flatMap(journey => Object.entries(journey.dayEvents)).map(([key, events]) => ({ key, count: events.filter(event => props.events.some(current => current.id === event.id)).length })).sort((a, b) => b.count - a.count).find(item => item.count)?.key : props.day.key;
    return <LinkedDayMap key={props.day.key} {...props} sourceDayKey={sourceDayKey} />;
  }
  return <DayRouteMapContent key={props.day.key} {...props} />;
}

function dayConfiguration(day, countryScope) {
  const dailyConfig = countryScope ? mapDaysByCountry[countryScope]?.[day.key] : amsterdamMapDays[day.key] || norwayDays[day.key] || icelandDays[day.key];
  return countryDayMaps[countryScope]?.[day.key] || (day.key === '2026-09-30' ? sep30Checkout.day : day.key === '2026-10-03' ? oct03Optional.day : dailyConfig);
}

function LinkedMapViewport({ points, overview }) {
  const { map, isLoaded } = useMap();
  const key = JSON.stringify(points.map(point => point.coordinates));
  const reset = () => {
    if (!map) return;
    const coordinates = points.map(point => point.coordinates).filter(validCoordinates);
    map.stop(); map.resize();
    if (!coordinates.length) { map.jumpTo({ ...overview, bearing: 0, pitch: 0 }); return; }
    // Unwrap across the date line to fit the short connection.
    const xs = coordinates.map(point => { let x = point[0]; while (x - coordinates[0][0] > 180) x -= 360; while (x - coordinates[0][0] < -180) x += 360; return x; });
    const ys = coordinates.map(point => point[1]);
    const { clientWidth: width, clientHeight: height } = map.getContainer();
    map.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], { padding: { top: Math.min(95, height * .2), bottom: Math.min(55, height * .14), left: Math.min(55, width * .12), right: Math.min(85, width * .18) }, maxZoom: 14, bearing: 0, pitch: 0, duration: 0 });
  };
  useEffect(() => { if (map && isLoaded) reset(); }, [map, isLoaded, key]);
  return <MapControls onReset={reset} />;
}

function LinkedDayMap({ day, events, country: countryScope, genericMap, onEdit, sourceDayKey, onSelectEvent }) {
  const [selected, setSelected] = useState(null);
  const [retry, setRetry] = useState(0);
  const config = sourceDayKey ? dayConfiguration({ key: sourceDayKey }, countryScope) : null;
  const migration = !countryScope && migrationDays[sourceDayKey];
  const countries = countryScope ? [countryScope] : sourceDayKey ? countriesForDay(sourceDayKey) : [...new Set(events.map(event => event.country).filter(Boolean))];
  const country = countries.length === 1 ? countries[0] : undefined, overview = overviewForDay(day.key, country);
  const defaultMode = config?.legs?.[0]?.mode || (sourceDayKey === '2026-09-29' ? 'driving' : 'connection');
  const plan = useMemo(() => buildMapPlan(events, mapCatalog.places, { defaultMode, country, center: country ? overview.center : undefined }), [events, country, defaultMode]);
  const { points, legs, pending, missing } = useLinkedMap(plan, mapCatalog.legs, retry);
  const color = countryThemes[country]?.route || '#ef9155';
  const bounds = config?.bounds;
  const shown = points.filter(point => validCoordinates(point.coordinates));
  const transfer = migration || (!countryScope && legs.some(leg => leg.isFlight));
  if (transfer) {
    const codes = [...new Set(shown.map(point => ['HK', 'TW'].includes(point.country) ? 'CN' : point.country).filter(Boolean))];
    const overview = transferOverview(codes);
    const unchangedCountries = migration && JSON.stringify(codes) === JSON.stringify(migration.countries);
    const transferConfig = { ...migration, countriesOnly: migration?.countriesOnly ?? true, countries: codes,
      stops: shown.map(point => ({ ...point, eventId: point.eventId, country: ['HK', 'TW'].includes(point.country) ? 'CN' : point.country })),
      bounds: unchangedCountries ? migration.bounds : overview.bounds, linked: true,
    };
    return <MigrationMap day={day} events={events} config={transferConfig} linkedLegs={legs.filter(leg => !leg.schematic || leg.isFlight || ['渡轮', 'ferry'].includes(leg.mode))} onSelectEvent={onSelectEvent} />;
  }
  // Follow the template: cities show stops; roads/trails need real geometry.
  const shownLegs = legs.filter(leg => !leg.schematic || leg.isFlight || ['渡轮', 'ferry'].includes(leg.mode));
  return <figure className={`day-map daily-map${country === 'IS' ? ' daily-map--volcanic' : countryThemes[country] ? ` daily-map--${countryThemes[country].name}` : ''}`} aria-label={`${day.label} 每日地图`} data-linked-map data-map-points={shown.length} data-map-routes={legs.length}>
    <div className="daily-map__surface"><MapBoundary><Map theme={country === 'IS' ? 'dark' : 'light'} center={overview.center} zoom={overview.zoom} bounds={bounds} fitBoundsOptions={fitOptions} scrollZoom touchZoomRotate dragPan>
      {shownLegs.map(leg => <MapRoute key={leg.id} id={`notebook-${leg.id}`} coordinates={leg.coordinates} color={color} width={4} dashArray={leg.schematic ? [3, 3] : undefined} opacity={.95} interactive={false} />)}
      {shown.map(stop => <DayMapStop key={stop.id} stop={stop} expanded={selected === stop.id} previewed={selected === stop.id} onToggle={event => { event.stopPropagation(); setSelected(current => current === stop.id ? null : stop.id); onSelectEvent?.(selected === stop.id ? null : stop.eventId); }} address={stop.address} />)}
      <MapTools selected={selected} focusedLegs={[]} mapStops={shown} countryTheme={countryThemes[country]} isIceland={country === 'IS'} onReset={() => setSelected(null)} clickableLegs={[]} controls={false} />
      <LinkedMapViewport points={shown} overview={overview} />
    </Map></MapBoundary>
      <figcaption className="day-map__caption daily-map__caption"><div className="daily-map__countries">{countries.map(country => <CountryFlag key={country} country={country} />)}</div><span className="daily-map__date">{day.label}</span></figcaption>
      {pending && <p className="daily-map__load-status notebook-map-note" role="status">正在定位…</p>}
      {!pending && missing.length > 0 && <div className="daily-map__load-status notebook-map-note"><button className="notebook-text-action" type="button" onClick={() => { const event = events.find(event => event.id === missing[0].eventId); if (onEdit && event) onEdit(event); }} title={missing.map(point => point.name).join('、')}>{missing.length} 个地点未定位</button><button className="notebook-text-action" type="button" onClick={() => setRetry(value => value + 1)}>重试</button></div>}
    </div>
  </figure>;
}

function DayRouteMapContent({ day, events, country: countryScope, onSelectEvent }) {
  const config = dayConfiguration(day, countryScope);
  const visitRouteOptions = config?.visitRoutes || visitRoutes[day.key];
  const dayRoutes = config?.routes || routes;
  const dayStops = config?.stops || mapStops;
  const dayLegs = config?.legs || visibleLegs;
  const dayBounds = config?.bounds || bounds;
  const pointForLeg = config ? (leg) => leg.coordinates : labelCoordinates;
  const [selected, setSelected] = useState(null);
  const storageKey = `acrossatlas:route-plan:v1:${day.key}`;
  const [activeRoute, setActiveRoute] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return Object.hasOwn(dayRoutes, saved) ? saved : 'direct';
    } catch { return 'direct'; }
  });
  const [saveError, setSaveError] = useState(false);
  const [routeFocus, setRouteFocus] = useState(null);
  const numberedStops = numberPlannedStops(dayStops, activeRoute);
  const focusedLegs = useMemo(() => routeFocus ? [routeFocus] : adjacentVisitLegs(visitRouteOptions, activeRoute, selected, dayStops), [visitRouteOptions, activeRoute, selected, dayStops, routeFocus]);
  const isFocused = Boolean(selected || routeFocus);
  const focusNodeIds = new Set([selected, ...focusedLegs.flatMap(leg => [leg.from, leg.to])]);
  const shownLegs = isFocused ? focusedLegs.map(leg => ({ ...leg, coordinates: pointAlongLeg(leg.path).coordinates })) : dayLegs;
  const clickableLegs = useMemo(() => Object.keys(visitRouteOptions || {}).sort((a, b) => Number(a === activeRoute) - Number(b === activeRoute)).flatMap(route => visitRouteOptions[route].map(leg => ({ ...leg, route }))), [visitRouteOptions, activeRoute]);
  function focusSegment(leg) {
    setSelected(null);
    setPreviewRoute(null);
    setRouteFocus({ ...leg });
  }
  function matchingSegment(leg) {
    return clickableLegs.find(item => item.route === activeRoute && item.from === leg.from && item.to === leg.to && item.mode === leg.mode)
      || clickableLegs.find(item => item.from === leg.from && item.to === leg.to && item.mode === leg.mode);
  }
  const segmentLabel = leg => `${numberedStops.find(stop => stop.id === leg.from)?.number ?? '?'} → ${numberedStops.find(stop => stop.id === leg.to)?.number ?? '?'} · ${leg.durationLabel || `${travelModes[leg.mode]} ${Math.max(1, Math.round(leg.seconds / 60))} 分钟`}`;
  const [previewRoute, setPreviewRoute] = useState(null);
  function togglePlannedStop(option) {
    const next = activeRoute === option ? 'direct' : option;
    setActiveRoute(next);
    setPreviewRoute(null);
    try {
      localStorage.setItem(storageKey, next);
      setSaveError(false);
    } catch { setSaveError(true); }
  }
  useEffect(() => {
    const syncPlan = (event) => {
      if (event.key !== storageKey && event.key !== null) return;
      const saved = event.newValue;
      setActiveRoute(Object.hasOwn(dayRoutes, saved) ? saved : 'direct');
    };
    window.addEventListener('storage', syncPlan);
    return () => window.removeEventListener('storage', syncPlan);
  }, [storageKey]);
  const isGoldenCircle = day.key === '2026-09-29' || Boolean(config);
  const countries = countryScope ? [countryScope] : countriesForDay(day.key);
  // On a travel day the destination determines the basemap; both flags remain visible.
  const country = countries.at(-1);
  const isIceland = country === 'IS';
  const countryTheme = countryThemes[country];
  const routeColor = countryTheme?.route || '#ef9155';
  const optionalColor = countryTheme?.optional || '#929b81';
  const overview = overviewForDay(day.key, country);
  if (!countryScope && migrationDays[day.key]) return <MapBoundary><MigrationMap day={day} events={events} onSelectEvent={onSelectEvent} /></MapBoundary>;
  return <figure className={`day-map daily-map${isIceland ? ' daily-map--volcanic' : countryTheme ? ` daily-map--${countryTheme.name}` : ''}`}  aria-label={`${day.label} 每日地图`}>
    <div className="daily-map__surface">
      <MapBoundary>
        <Map theme={isIceland ? "dark" : "light"} bounds={isGoldenCircle ? dayBounds : undefined} center={overview.center} zoom={overview.zoom} fitBoundsOptions={fitOptions} scrollZoom={true} touchZoomRotate={true} dragPan={true}>
          {isGoldenCircle && <>
            {clickableLegs.map((leg, index) => <MapRoute key={`${activeRoute}-${index}`} id={`daily-segment-${index}`} coordinates={leg.path} dashArray={leg.dashArray} color={leg.color || (leg.route === activeRoute ? routeColor : optionalColor)} width={leg.route === activeRoute ? 4 : 3} opacity={isFocused ? .18 : leg.route === activeRoute ? .95 : .65} />)}
            {focusedLegs.map((leg, index) => <MapRoute key={`focus-${leg.from}-${leg.to}`} coordinates={leg.path} dashArray={leg.dashArray} color={leg.color || routeColor} width={4} opacity={1} interactive={false} active />)}
            {shownLegs.map((leg, index) => <MapMarker key={`${leg.from}-${leg.to}-${leg.mode}`} longitude={(isFocused ? leg.coordinates : pointForLeg(leg))[0]} latitude={(isFocused ? leg.coordinates : pointForLeg(leg))[1]} offset={isFocused ? [0, index ? 14 : -14] : [0, 0]}>
              <MarkerContent>
                <button type="button" className="daily-map__duration daily-map__duration-trigger" aria-label={`聚焦 ${segmentLabel(leg)}`} disabled={!matchingSegment(leg)} onClick={event => { event.stopPropagation(); const segment = matchingSegment(leg); if (segment) focusSegment(segment); }} title={`${dayStops.find((s) => s.id === leg.from)?.name} → ${dayStops.find((s) => s.id === leg.to)?.name} · ${leg.travelNote ? `${leg.travelNote} · ` : ''}点击聚焦路段`}>
                  {isFocused ? segmentLabel(leg) : leg.durationLabel || `${travelModes[leg.mode]} ${Math.max(1, Math.round(leg.seconds / 60))} 分钟`}
                </button>
              </MarkerContent>
            </MapMarker>)}
            {numberedStops.map((stop) => {
              const event = [...stop.eventIds].reverse().map((id) => events.find((item) => item.id === id)).find(Boolean);
              const expanded = selected === stop.id;
              const previewed = expanded || (previewRoute && (!stop.option || stop.option === previewRoute));
              const toggle = (e) => {
                e.stopPropagation();
                setRouteFocus(null);
                setSelected(expanded ? null : stop.id);
                setPreviewRoute(expanded ? null : (stop.option || null));
                onSelectEvent?.(expanded ? null : event?.id);
              };
              return <DayMapStop key={stop.id} stop={stop} dimmed={isFocused && !focusNodeIds.has(stop.id)} expanded={expanded} previewed={previewed} activeRoute={activeRoute} onToggle={toggle} onTogglePlannedStop={togglePlannedStop} address={stop.address || event?.navigation} />;
            })}
          </>}
          <MapTools overviewBounds={config?.overviewBounds} clickableLegs={clickableLegs} onRouteClick={focusSegment} focusedLegs={focusedLegs} focusZoom={config?.focusZoom} mapStops={dayStops} routes={dayRoutes} bounds={dayBounds} selected={selected} routeFocus={routeFocus} isGoldenCircle={isGoldenCircle} isIceland={isIceland} countryTheme={countryTheme} overview={overview} onReset={() => { setSelected(null); setRouteFocus(null); setPreviewRoute(null); }} />
        </Map>
      </MapBoundary>
      <figcaption className="day-map__caption daily-map__caption">
        <div className="daily-map__countries">{countries.map((country, index) => <span className="daily-map__country-step" key={country}>{index > 0 && <span aria-label="前往">→</span>}<CountryFlag country={country} /></span>)}</div>
        <span className="daily-map__date">{day.label}</span>
      </figcaption>
      {saveError && <p className="daily-map__error" role="status">当前浏览器无法保存选择，刷新后可能丢失。</p>}
      {!isGoldenCircle && <p className="daily-map__empty">当天地点与路线待添加</p>}
    </div>
  </figure>;
}
