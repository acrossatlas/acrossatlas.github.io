import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { Map, MapMarker, MarkerContent, MapRoute, MapGeoJSON, useMap } from './ui/map';
import CountryFlag from './CountryFlag';
import DayMapStop from './DayMapStop';
import { countryThemes, volcanicPaint } from './map-themes';
import countryBase from '../data/migration-countries.json';
import longHaulCountries from '../data/long-haul-countries.json';
const countries = { type: 'FeatureCollection', features: [...countryBase.features, ...longHaulCountries.features] };
const countryNames = { CN: '中国', NL: '荷兰', NO: '挪威', TH: '泰国' };
import icelandDays from '../data/iceland-day-routes.json';
import { amsterdamPlaces } from '../data/amsterdam-map';
import oct01Drive from '../data/oct01-driving-route.json';

const airports = {
  HKG: { name: 'HKG 香港国际机场', country: 'HK', coordinates: [113.9173, 22.3126], offset: 480 },
  TPE: { name: 'TPE 台北桃园机场', country: 'TW', coordinates: [121.2346, 25.0793], offset: 480 },
  BKK: { name: 'BKK 曼谷素万那普机场', country: 'TH', coordinates: [100.75, 13.69], offset: 420 },
  AMS: { name: 'Amsterdam · AMS', country: 'NL', coordinates: [4.764, 52.309], offset: 120 },
  KEF: { name: 'Keflavík · KEF', country: 'IS', coordinates: [-22.6056, 63.985], offset: 0 },
  OSL: { name: 'Oslo · OSL', country: 'NO', coordinates: [11.1, 60.194], offset: 120 },
  BOO: { name: 'Bodø · BOO', country: 'NO', coordinates: [14.365, 67.269], offset: 120 },
  SVJ: { name: 'Svolvær · SVJ', country: 'NO', coordinates: [14.669, 68.243], offset: 120 },
};
export const migrationDays = {
  '2026-09-24': {
    countriesOnly: true, countries: ['CN', 'NL'], bounds: [[0, 15], [137, 59]], flightId: 'sep24-hkg-tpe-ams',
    stops: [
      { ...airports.HKG, address: 'Hong Kong International Airport' },
      { ...airports.TPE, address: 'Taiwan Taoyuan International Airport' },
      { ...airports.AMS, name: 'AMS 阿姆斯特丹史基浦机场', address: 'Amsterdam Airport Schiphol' },
    ],
  },
  '2026-10-06': {
    countriesOnly: true, countries: ['NO', 'TH', 'CN'], bounds: [[4, 4], [138, 73]], flightId: 'oct06-osl-bkk-hkg',
    stops: [
      { ...airports.OSL, name: 'OSL 奥斯陆机场', address: 'Oslo Airport Gardermoen' },
      { ...airports.BKK, address: 'Suvarnabhumi Airport, Bangkok' },
      { ...airports.HKG, address: 'Hong Kong International Airport' },
    ],
  },
  '2026-09-27': {
    countries: ['NL', 'IS'], bounds: [[-25, 50.5], [8, 67.5]], flightId: 'sep27-ams-kef',
    stops: [
      { number: 0, country: 'NL', name: 'ibis Schiphol Amsterdam Airport', coordinates: amsterdamPlaces.hotel, eventId: 'sep27-checkout' },
      { country: 'NL', name: 'Rijksmuseum 国立博物馆', coordinates: amsterdamPlaces.rijksmuseum, eventIds: ['sep27-hotel-luggage', 'sep27-rijksmuseum'] },
      { country: 'NL', name: 'Schiphol Airport', coordinates: airports.AMS.coordinates, eventIds: ['sep27-airport-taxi', 'sep27-ams-kef'] },
      { country: 'IS', name: 'Keflavík 凯夫拉维克机场', coordinates: [-22.6238642, 63.9950427], eventId: 'sep27-ams-kef' },
      { country: 'IS', name: 'Lotus 莲花租车', coordinates: [-22.578577, 63.9971773], eventId: 'sep27-lotus-car' },
      { country: 'IS', name: 'Kelduland 雷克雅未克住宿', coordinates: [-21.8621482, 64.120598], eventId: 'sep27-reykjavik-stay', note: 'Kelduland 街道落点' },
    ],
  },
  '2026-10-01': {
    countries: ['IS', 'NO'], bounds: [[-25, 57.5], [32, 72]], flightId: 'oct01-kef-svj',
    stops: [
      { country: 'IS', name: 'Keflavík 凯夫拉维克机场', coordinates: airports.KEF.coordinates, eventId: 'oct01-kef-svj' },
      { country: 'NO', name: 'Oslo Airport', coordinates: airports.OSL.coordinates, eventId: 'oct01-kef-svj' },
      { country: 'NO', name: 'Bodø Airport', coordinates: airports.BOO.coordinates, eventId: 'oct01-kef-svj' },
      { country: 'NO', name: 'Svolvær Airport', coordinates: airports.SVJ.coordinates, eventIds: ['oct01-kef-svj', 'oct01-hertz-car'] },
      { country: 'NO', name: 'Henningsvær', coordinates: [14.208, 68.154], eventIds: ['oct01-drive-henningsvaer', 'oct01-henningsvaer-stay'], note: '渔村中心示意' },
    ],
  },
};
const overviewPadding = { top: 85, bottom: 50, left: 42, right: 62 };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function duration(leg) {
  const minute = time => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
  const total = (minute(leg.arrive) - airports[leg.to].offset - minute(leg.depart) + airports[leg.from].offset + 1440) % 1440;
  return `${Math.floor(total / 60) ? `${Math.floor(total / 60)} 小时 ` : ''}${total % 60 ? `${total % 60} 分` : ''}`.trim();
}
// A schematic curved connector, not a recorded flight track.
function flightLine(from, to) {
  return Array.from({ length: 49 }, (_, i) => {
    const t = i / 48;
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * Math.min(Math.abs(to[0] - from[0]) * .09, 3)];
  });
}

function MigrationScene({ config, events, focus, setFocus }) {
  const { map, isLoaded } = useMap();
  const [selection, setSelection] = useState(null);
  const [previewLine, setPreviewLine] = useState(null);
  const [error, setError] = useState(false);
  const originalPaint = useRef(null);
  const overviewZoom = useRef(null);
  const zoomBefore = useRef(null);
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const flight = events.find(event => event.id === config.flightId);
  const legs = (config.countriesOnly ? [] : flight?.flightLegs || []).filter(leg => airports[leg.from] && airports[leg.to]);
  const features = useMemo(() => ({ type: 'FeatureCollection', features: countries.features.filter(feature => config.countries.includes(feature.properties.country)) }), [config]);
  const reset = () => {
    if (!map) return;
    setSelection(null);
    setPreviewLine(null);
    setFocus(null);
    map.stop();
    map.fitBounds(config.bounds, { padding: overviewPadding, bearing: 0, pitch: 0, duration: 0 });
    overviewZoom.current = map.getZoom();
  };
  function enterCountry(country) {
    if (!map || !isLoaded) return;
    const points = config.countriesOnly
      ? countries.features.filter(feature => feature.properties.country === country).flatMap(feature => feature.geometry.coordinates.flat(feature.geometry.type === 'MultiPolygon' ? 2 : 1))
      : config.stops.filter(stop => stop.country === country).map(stop => stop.coordinates);
    if (!points.length) return;
    setSelection(null);
    setPreviewLine(null);
    setFocus(country);
    const lngs = points.map(p => p[0]), lats = points.map(p => p[1]);
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: { top: 100, bottom: 65, left: 55, right: 90 }, maxZoom: points.length === 1 ? 11 : 10.5,
      bearing: 0, pitch: 0, duration: reducedMotion() ? 0 : 650,
    });
  }
  function selectRoute(coordinates, color, dashArray) {
    if (!map || !isLoaded) return;
    setSelection(null);
    setPreviewLine({ coordinates, color, dashArray });
    const lngs = coordinates.map(point => point[0]), lats = coordinates.map(point => point[1]);
    map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: { top: 65, bottom: 45, left: 40, right: 40 }, maxZoom: Math.max(map.getZoom(), 8.5), duration: reducedMotion() ? 0 : 400,
    });
  }
  useEffect(() => {
    if (!map || !isLoaded) return;
    const onBlankClick = event => {
      if (event.originalEvent.target !== map.getCanvas()) return;
      const hits = map.queryRenderedFeatures(event.point);
      if (hits.some(feature => String(feature.layer?.source ?? '').startsWith('route-source-') || feature.layer?.source === 'geojson-source-migration-countries')) return;
      map.stop();
      setSelection(null);
      setPreviewLine(null);
    };
    map.on('click', onBlankClick);
    return () => map.off('click', onBlankClick);
  }, [map, isLoaded, focus, config]);
  useEffect(() => {
    if (!map || !isLoaded || !selection) return;
    const stop = config.stops.find(stop => stop.name === selection);
    if (stop && config.airportsOnly) {
      const index = config.stops.indexOf(stop);
      const points = config.stops.slice(Math.max(0, index - 1), index + 2).map(item => item.coordinates);
      const lngs = points.map(p => p[0]), lats = points.map(p => p[1]);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: overviewPadding, maxZoom: 9, duration: reducedMotion() ? 0 : 400 });
    } else if (stop) map.easeTo({ center: stop.coordinates, offset: [0, 70], zoom: Math.max(map.getZoom(), 8.7), duration: reducedMotion() ? 0 : 400 });
  }, [map, isLoaded, selection, config]);
  useEffect(() => {
    if (!map || !isLoaded) return;
    if (overviewZoom.current === null) overviewZoom.current = map.getZoom();
    const onZoomStart = () => { zoomBefore.current = map.getZoom(); };
    const onZoomEnd = () => {
      // Only an outward zoom can leave a country; camera flights into it cannot.
      if (focusRef.current && map.getZoom() < zoomBefore.current && map.getZoom() <= overviewZoom.current + .7) {
        setFocus(null);
        setSelection(null);
        setPreviewLine(null);
      }
    };
    const onError = () => setError(true);
    const onIdle = () => setError(false);
    map.on('zoomstart', onZoomStart); map.on('zoomend', onZoomEnd);
    map.on('error', onError); map.on('idle', onIdle);
    const observer = new ResizeObserver(() => {
      map.resize();
      const camera = map.cameraForBounds(config.bounds, { padding: overviewPadding });
      if (camera) overviewZoom.current = camera.zoom;
    });
    observer.observe(map.getContainer());
    return () => { map.off('zoomstart', onZoomStart); map.off('zoomend', onZoomEnd); map.off('error', onError); map.off('idle', onIdle); observer.disconnect(); };
  }, [map, isLoaded, config, setFocus]);
  useEffect(() => {
    if (!map || !isLoaded) return;
    // Keep one map instance and restore its original grayscale paint on zoom-out.
    if (!originalPaint.current) {
      originalPaint.current = map.getStyle().layers.filter(layer => !layer.id.startsWith('migration') && !layer.id.includes('route-')).map(layer => ({ id: layer.id, type: layer.type, paint: structuredClone(layer.paint || {}), hasText: !!layer.layout?.['text-field'] }));
    }
    const theme = countryThemes[focus];
    for (const layer of originalPaint.current) {
      if (!map.getLayer(layer.id)) continue;
      for (const property of ['background-color', 'fill-color', 'fill-outline-color', 'line-color', 'text-color', 'text-halo-color']) {
        if (Object.hasOwn(layer.paint, property)) map.setPaintProperty(layer.id, property, layer.paint[property]);
      }
      if (focus && layer.type === 'line' && /^road_.*fill/.test(layer.id)) map.setPaintProperty(layer.id, 'line-color', focus === 'IS' ? '#66695f' : theme?.road || '#fafaf7');
      if (focus && layer.hasText) {
        map.setPaintProperty(layer.id, 'text-color', focus === 'IS' ? '#b9beb1' : theme?.text || '#425a60');
        map.setPaintProperty(layer.id, 'text-halo-color', focus === 'IS' ? '#30322f' : theme?.halo || '#eef0ed');
      }
    }
    for (const [layer, property, color] of (focus === 'IS' ? volcanicPaint : theme?.paint || [])) {
      if (map.getLayer(layer)) map.setPaintProperty(layer, property, color);
    }
  }, [map, isLoaded, focus]);
  const stops = config.countriesOnly ? [] : config.airportsOnly ? config.stops : config.stops.filter(stop => stop.country === focus);
  const selectedIndex = config.stops.findIndex(stop => stop.name === selection);
  const relevant = new Set(config.airportsOnly && selection ? [selectedIndex - 1, selectedIndex, selectedIndex + 1] : config.stops.map((_, index) => index));
  const highlightedLine = (line) => !previewLine || line.every((point, i) => point[0] === previewLine.coordinates[i]?.[0] && point[1] === previewLine.coordinates[i]?.[1]);
  return <>
    {focus === 'IS' && config.flightId === 'sep27-ams-kef' && <>
      <MapRoute coordinates={icelandDays['2026-09-27'].routes.direct.coordinates} color="#ef9155" width={4} opacity={.95} onClick={() => selectRoute(icelandDays['2026-09-27'].routes.direct.coordinates, '#ef9155')} />
      {icelandDays['2026-09-27'].legs.map(leg => <MapMarker key={leg.to} longitude={leg.coordinates[0]} latitude={leg.coordinates[1]}><MarkerContent><span className="daily-map__duration">驾车 {Math.round(leg.seconds / 60)} 分钟</span></MarkerContent></MapMarker>)}
    </>}
    {config.flightId === 'oct01-kef-svj' && focus === 'NO' && <>
      <MapRoute id="migration-oct01-driving" coordinates={oct01Drive.coordinates} color={countryThemes.NO.route} width={4} opacity={.95} onClick={() => selectRoute(oct01Drive.coordinates, countryThemes.NO.route)} />
      {focus === 'NO' && <MapMarker longitude={oct01Drive.labelCoordinates[0]} latitude={oct01Drive.labelCoordinates[1]}><MarkerContent><span className="daily-map__duration">驾车 {Math.round(oct01Drive.seconds / 60)} 分钟</span></MarkerContent></MapMarker>}
    </>}
    {(config.countriesOnly || (!focus && !config.airportsOnly)) && <MapGeoJSON id="migration-countries" data={features} promoteId="country" interactive fillPaint={{ 'fill-color': '#5499ff', 'fill-opacity': .4 }} fillHoverPaint={{ 'fill-opacity': .6 }} linePaint={{ 'line-color': '#5499ff', 'line-width': 2 }} onClick={event => enterCountry(event.feature.properties.country)} />}
    {legs.map((leg, index) => {
      const from = airports[leg.from], to = airports[leg.to];
      if (focus && !(from.country === focus && to.country === focus)) return null;
      const line = flightLine(from.coordinates, to.coordinates);
      return <MapRoute key={`migration-flight-${index}`} coordinates={line} color={focus ? countryThemes[focus]?.route || '#ef9155' : '#657789'} width={4} opacity={config.airportsOnly && ((!highlightedLine(line)) || (selection && index !== selectedIndex && index + 1 !== selectedIndex)) ? .18 : .95} dashArray={[2, 2]} onClick={() => selectRoute(line, focus ? countryThemes[focus]?.route || '#ef9155' : '#657789', [2, 2])} />;
    })}
    {previewLine && <MapRoute coordinates={previewLine.coordinates} color={previewLine.color} dashArray={previewLine.dashArray} width={4} opacity={1} interactive={false} active />}
    {legs.filter(leg => !focus || (airports[leg.from].country === focus && airports[leg.to].country === focus)).map(leg => {
      const midpoint = flightLine(airports[leg.from].coordinates, airports[leg.to].coordinates)[24];
      return <MapMarker key={leg.code} longitude={midpoint[0]} latitude={midpoint[1]}><MarkerContent><span className="daily-map__duration" title={`${leg.from} → ${leg.to} · 航线示意`}>飞行 {duration(leg)}</span></MarkerContent></MapMarker>;
    })}
    {stops.map((stop, index) => {
      const stopEvents = (stop.eventIds || [stop.eventId]).map(id => events.find(event => event.id === id)).filter(Boolean);
      const expanded = selection === stop.name;
      const toggle = (event) => {
        event.stopPropagation();
        setSelection(expanded ? null : stop.name);
        setPreviewLine(null);
      };
      const address = [...stopEvents].reverse().find(event => event.navigation)?.navigation;
      return <DayMapStop key={stop.name} stop={{ ...stop, id: stop.name, number: stop.number ?? (config.airportsOnly || stop.country === 'NL' ? index : index + 1) }} dimmed={config.airportsOnly && (!relevant.has(index) || Boolean(previewLine && ![previewLine.coordinates[0], previewLine.coordinates.at(-1)].some(p => Math.abs(p[0] - stop.coordinates[0]) < .001 && Math.abs(p[1] - stop.coordinates[1]) < .001)))} expanded={expanded} previewed={expanded || Boolean(previewLine)} onToggle={toggle} address={stop.address || address} />;
    })}
    <div className="daily-map__controls" aria-label="地图控制"><div className="daily-map__zoom"><button type="button" aria-label="放大地图" onClick={() => map?.zoomIn()}><Plus size={16} strokeWidth={1.8} /></button><button type="button" aria-label="缩小地图" onClick={() => map?.zoomOut()}><Minus size={16} strokeWidth={1.8} /></button></div><button className="daily-map__reset" type="button" aria-label="恢复全天总览" title="恢复全天总览" onClick={reset}><RotateCcw size={16} strokeWidth={1.8} /></button></div>
    {error && <p role="status" className="daily-map__error">地图加载失败，请检查网络；当天行程仍可在行程卡片中查看。</p>}
  </>;
}

export default function MigrationMap({ day, events }) {
  const config = migrationDays[day.key];
  const [focus, setFocus] = useState(null);
  const themeClass = focus === 'IS' ? 'volcanic' : countryThemes[focus]?.name;
  return <figure className={`day-map daily-map migration-map${themeClass ? ` daily-map--${themeClass}` : ''}`} aria-label={`${day.label} 跨国行程地图`}>
    <div className="daily-map__surface">
      <Map theme="light" bounds={config.bounds} fitBoundsOptions={{ padding: overviewPadding, duration: 0 }} scrollZoom touchZoomRotate dragPan attributionControl={false}>
        <MigrationScene config={config} events={events} focus={focus} setFocus={setFocus} />
      </Map>
      <figcaption className="day-map__caption daily-map__caption"><div className="daily-map__countries">{config.airportsOnly && <span>航线示意</span>}{(focus ? [focus] : config.countries).map((country, index) => <span className="daily-map__country-step" key={country}>{index > 0 && <span>→</span>}{config.countriesOnly ? <span>{countryNames[country] || country}</span> : <CountryFlag country={country} />}</span>)}</div><span className="daily-map__date">{day.label}</span></figcaption>
    </div>
  </figure>;
}
