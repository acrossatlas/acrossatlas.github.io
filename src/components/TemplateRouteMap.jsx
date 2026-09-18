import { useEffect } from 'react';
import { templateBasemap, templateFallbackBasemap } from './template-basemap';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { Map, MapRoute, MapGeoJSON, MapMarker, MarkerContent, useMap } from './ui/map';
import DayMapStop from './DayMapStop';
import routes from '../data/template-new-york-routes.json';
import { templateRouteLine } from '../lib/template-route-line';
import countryBase from '../data/migration-countries.json';
import longHaul from '../data/long-haul-countries.json';
import unitedStates from '../data/template-united-states.json';

// Saved routing geometry keeps preview roads and trails aligned with the basemap.
const fitOptions = { padding: { top: 70, bottom: 45, left: 35, right: 55 }, duration: 0 };
const countryLabels = { CN: { name: '中国', coordinates: [104, 35] }, US: { name: '美国', coordinates: [-98, 39] } };
function Controls({ preview, onReset }) {
  const { map } = useMap();
  useEffect(() => {
    if (!map) return;
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return <div className="daily-map__controls" aria-label="地图控制">
    <div className="daily-map__zoom"><button type="button" aria-label="放大地图" onClick={() => map?.zoomIn()}><Plus size={16}/></button><button type="button" aria-label="缩小地图" onClick={() => map?.zoomOut()}><Minus size={16}/></button></div>
    <button type="button" className="daily-map__reset" aria-label={preview.bounds ? '恢复国家总览' : '恢复纽约视图'} onClick={() => { if (preview.bounds) map?.fitBounds(preview.bounds, fitOptions); else map?.jumpTo({center: preview.center, zoom: preview.zoom}); onReset(); }}><RotateCcw size={16}/></button>
  </div>;
}
export default function TemplateRouteMap({ day, selected, onSelect }) {
  const preview = day.map.preview;
  const transfer = day.template === 'transfer';
  const profile = routes.profiles[day.template === 'outdoor' ? 'foot' : 'car'];
  const anchors = profile.waypoints;
  const flightLine = transfer ? templateRouteLine({ mode: preview.connectionMode, from: countryLabels[preview.countries[0]].coordinates, to: countryLabels[preview.countries[1]].coordinates }) : null;
  const features = { type: 'FeatureCollection', features: [...countryBase.features, ...longHaul.features, unitedStates].filter(feature => preview.countries?.includes(feature.properties.country)) };
  return <figure className="day-map daily-map" aria-label={transfer ? '转场国家总览' : '纽约模板地图'}><div className="daily-map__surface">
    <Map theme="light" styles={{light: templateBasemap}} fallbackStyle={templateFallbackBasemap} bounds={preview.bounds} fitBoundsOptions={fitOptions} center={preview.center} zoom={preview.zoom} scrollZoom touchZoomRotate dragPan>
      {transfer ? <>
        <MapGeoJSON id="template-countries" data={features} promoteId="country" fillPaint={{'fill-color':'#5499ff','fill-opacity':.4}} linePaint={{'line-color':'#5499ff','line-width':2}} />
        {flightLine && <MapRoute id="template-flight" {...flightLine} color="#5499ff" width={2.5}/>}
        {preview.countries.map((country,i) => <MapMarker key={country} longitude={countryLabels[country].coordinates[0]} latitude={countryLabels[country].coordinates[1]}><MarkerContent><button className="template-country-label" type="button" onClick={()=>onSelect(day.events[i ? 2 : 1].id)}>{countryLabels[country].name}<small>{i ? '到达国家' : '出发国家'}</small></button></MarkerContent></MapMarker>)}
      </> : <>
        {preview.showConnections && day.map.legs.map((leg,i) => {
          const line = templateRouteLine({ mode: leg.mode, geometry: profile.legs[i]?.geometry, from: anchors[i], to: anchors[i+1] });
          return line ? <MapRoute key={leg.id} id={`template-${day.id}-${leg.id}`} {...line} color="#ef9155" width={3}/> : null;
        })}
        {day.map.stops.map((stop, i) => <DayMapStop key={stop.id} stop={{...stop, coordinates: anchors[i], number: i+1}} expanded={selected===stop.eventId} onToggle={() => onSelect(selected===stop.eventId ? null : stop.eventId)} address="示例标注 · 请替换为行程地点" />)}
      </>}
      <Controls preview={preview} onReset={() => onSelect(null)} />
    </Map>
    <figcaption className="day-map__caption daily-map__caption"><span>{transfer ? '中国 → 美国' : 'New York'}</span><span>{day.label} · 示例</span></figcaption>
    {preview.showConnections && <p className="template-map-disclaimer">{day.template === 'outdoor' ? '步行路网示例' : '驾车路网示例'} · 地点待替换</p>}
  </div></figure>;
}
