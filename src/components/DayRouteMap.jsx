import { Component, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Plus, Minus } from 'lucide-react';
import { Map, MapMarker, MarkerContent, MapRoute, useMap } from './ui/map';
import routes from '../data/golden-circle-routes.json';
import durations from '../data/golden-circle-durations.json';
import icelandDays from '../data/iceland-day-routes.json';
import norwayDays from '../data/norway-day-routes.json';
import DayMapStop from './DayMapStop';
import { numberPlannedStops } from '../lib/route-stop-numbers';
import savedVisitRoutes from '../data/visit-route-legs.json';
import oct03Optional from '../data/oct03-optional-route.json';
import sep30Checkout from '../data/sep30-checkout-route.json';
import { adjacentVisitLegs, pointAlongLeg } from '../lib/visit-route-focus';
import { nodeFocusZoom } from '../lib/node-focus-zoom';
import CountryFlag, { countriesForDay } from './CountryFlag';
import MigrationMap, { migrationDays } from './MigrationMap';
import { countryThemes, overviewForDay, basemapPaint, volcanicPaint } from './map-themes';

const visitRoutes = { ...savedVisitRoutes, '2026-10-03': oct03Optional.legs, '2026-09-30': sep30Checkout.legs };
const stops = [
  { id: 'city', number: '0', name: 'Reykjavík 雷克雅未克', subtitle: '出发 / 返回 · 市区示意', coordinates: [-21.9426, 64.1466], eventIds: ['sep28-reykjavik-stay'] },
  { id: 'thingvellir', number: '1', name: 'Þingvellir 辛格维利尔国家公园', subtitle: '国家公园 · Hakið P1', coordinates: [-21.129, 64.2558], eventIds: ['sep28-thingvellir'] },
  { id: 'geysir', number: '2', name: 'Geysir 盖锡尔间歇泉', subtitle: '午餐 / 间歇泉', coordinates: [-20.3024, 64.3093], eventIds: ['sep28-geysir-lunch', 'sep28-geysir'] },
  { id: 'gullfoss', number: '3', name: 'Gullfoss 黄金瀑布', subtitle: '黄金瀑布 · 停车场', coordinates: [-20.1364, 64.3266], eventIds: ['sep28-gullfoss'] },
  { id: 'kerid', number: '4', name: 'Kerið 凯瑞斯火山口', subtitle: '可选 · 火山口', coordinates: [-20.8853, 64.0413], eventIds: ['sep28-kerid-optional'], option: 'kerid' },
  { id: 'lagoon', number: '4', name: 'Secret Lagoon 秘密温泉', subtitle: '可选 · 秘密温泉', coordinates: [-20.3094, 64.1375], eventIds: ['sep28-secret-lagoon-optional'], option: 'lagoon' },
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
const travelModes = { driving: '驾车', bus: '公交', train: '火车', walking: '步行', ferry: '渡轮', taxi: '出租车' };
const mapStops = stops.map((stop) => {
  const distance = (p) => ((p[0] - stop.coordinates[0]) * 0.44) ** 2 + (p[1] - stop.coordinates[1]) ** 2;
  const coordinates = routes[stop.option || 'direct'].coordinates.reduce((best, p) => distance(p) < distance(best) ? p : best);
  return { ...stop, coordinates };
});

class MapBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="daily-map__error">地图暂时无法显示，请查看下方行程卡片。</p> : this.props.children; }
}

function MapTools({ selected, focusedLegs, routeFocus, isGoldenCircle, isIceland, countryTheme, overview, onReset, onRouteClick, clickableLegs, mapStops, routes, bounds, focusZoom = 8.7 }) {
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
      if (layer.type === 'line' && /^road_.*fill/.test(layer.id)) {
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
    <div className="daily-map__controls" aria-label="地图控制">
      <div className="daily-map__zoom">
      <button type="button" aria-label="放大地图" onClick={() => map?.zoomIn()}><Plus size={16} strokeWidth={1.8} aria-hidden="true" /></button>
      <button type="button" aria-label="缩小地图" onClick={() => map?.zoomOut()}><Minus size={16} strokeWidth={1.8} aria-hidden="true" /></button>
      </div>
      <button className="daily-map__reset" type="button" aria-label="恢复默认位置" title="恢复默认位置" onClick={resetView}><RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" /></button>
    </div>
  </>;
}

export default function DayRouteMap(props) {
  return <DayRouteMapContent key={props.day.key} {...props} />;
}

function DayRouteMapContent({ day, events }) {
  const config = day.key === '2026-09-30' ? sep30Checkout.day : day.key === '2026-10-03' ? oct03Optional.day : norwayDays[day.key] || icelandDays[day.key];
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
  const focusedLegs = useMemo(() => routeFocus ? [routeFocus] : adjacentVisitLegs(visitRoutes[day.key], activeRoute, selected, dayStops), [day.key, activeRoute, selected, dayStops, routeFocus]);
  const isFocused = Boolean(selected || routeFocus);
  const focusNodeIds = new Set([selected, ...focusedLegs.flatMap(leg => [leg.from, leg.to])]);
  const shownLegs = isFocused ? focusedLegs.map(leg => ({ ...leg, coordinates: pointAlongLeg(leg.path).coordinates })) : dayLegs;
  const clickableLegs = useMemo(() => Object.keys(visitRoutes[day.key] || {}).sort((a, b) => Number(a === activeRoute) - Number(b === activeRoute)).flatMap(route => visitRoutes[day.key][route].map(leg => ({ ...leg, route }))), [day.key, activeRoute]);
  function focusSegment(leg) {
    setSelected(null);
    setPreviewRoute(null);
    setRouteFocus({ ...leg });
  }
  function matchingSegment(leg) {
    return clickableLegs.find(item => item.route === activeRoute && item.from === leg.from && item.to === leg.to && item.mode === leg.mode)
      || clickableLegs.find(item => item.from === leg.from && item.to === leg.to && item.mode === leg.mode);
  }
  const segmentLabel = leg => `${numberedStops.find(stop => stop.id === leg.from)?.number ?? '?'} → ${numberedStops.find(stop => stop.id === leg.to)?.number ?? '?'} · ${travelModes[leg.mode]} ${Math.max(1, Math.round(leg.seconds / 60))} 分钟`;
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
  const isGoldenCircle = day.key === '2026-09-28' || Boolean(config);
  const countries = countriesForDay(day.key);
  // On a travel day the destination determines the basemap; both flags remain visible.
  const country = countries.at(-1);
  const isIceland = country === 'IS';
  const countryTheme = countryThemes[country];
  const routeColor = countryTheme?.route || '#ef9155';
  const optionalColor = countryTheme?.optional || '#929b81';
  const overview = overviewForDay(day.key, country);
  if (migrationDays[day.key]) return <MapBoundary><MigrationMap day={day} events={events} /></MapBoundary>;
  return <figure className={`day-map daily-map${isIceland ? ' daily-map--volcanic' : countryTheme ? ` daily-map--${countryTheme.name}` : ''}`}  aria-label={`${day.label} 每日地图`}>
    <div className="daily-map__surface">
      <MapBoundary>
        <Map theme={isIceland ? "dark" : "light"} bounds={isGoldenCircle ? dayBounds : undefined} center={overview.center} zoom={overview.zoom} fitBoundsOptions={fitOptions} scrollZoom={true} touchZoomRotate={true} dragPan={true} attributionControl={false}>
          {isGoldenCircle && <>
            {clickableLegs.map((leg, index) => <MapRoute key={`${activeRoute}-${index}`} id={`daily-segment-${index}`} coordinates={leg.path} color={leg.route === activeRoute ? routeColor : optionalColor} width={leg.route === activeRoute ? 4 : 3} opacity={isFocused ? .18 : leg.route === activeRoute ? .95 : .65} />)}
            {focusedLegs.map((leg, index) => <MapRoute key={`focus-${leg.from}-${leg.to}`} coordinates={leg.path} color={routeColor} width={4} opacity={1} interactive={false} active />)}
            {shownLegs.map((leg, index) => <MapMarker key={`${leg.from}-${leg.to}-${leg.mode}`} longitude={(isFocused ? leg.coordinates : pointForLeg(leg))[0]} latitude={(isFocused ? leg.coordinates : pointForLeg(leg))[1]} offset={isFocused ? [0, index ? 14 : -14] : [0, 0]}>
              <MarkerContent>
                <button type="button" className="daily-map__duration daily-map__duration-trigger" aria-label={`聚焦 ${segmentLabel(leg)}`} disabled={!matchingSegment(leg)} onClick={event => { event.stopPropagation(); const segment = matchingSegment(leg); if (segment) focusSegment(segment); }} title={`${dayStops.find((s) => s.id === leg.from)?.name} → ${dayStops.find((s) => s.id === leg.to)?.name} · 点击聚焦路段`}>
                  {isFocused ? segmentLabel(leg) : `${travelModes[leg.mode]} ${Math.max(1, Math.round(leg.seconds / 60))} 分钟`}
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
              };
              return <DayMapStop key={stop.id} stop={stop} dimmed={isFocused && !focusNodeIds.has(stop.id)} expanded={expanded} previewed={previewed} activeRoute={activeRoute} onToggle={toggle} onTogglePlannedStop={togglePlannedStop} address={stop.address || event?.navigation} />;
            })}
          </>}
          <MapTools clickableLegs={clickableLegs} onRouteClick={focusSegment} focusedLegs={focusedLegs} focusZoom={config?.focusZoom} mapStops={dayStops} routes={dayRoutes} bounds={dayBounds} selected={selected} routeFocus={routeFocus} isGoldenCircle={isGoldenCircle} isIceland={isIceland} countryTheme={countryTheme} overview={overview} onReset={() => { setSelected(null); setRouteFocus(null); setPreviewRoute(null); }} />
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
