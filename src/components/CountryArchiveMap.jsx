import { useEffect, useMemo } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { Map, MapGeoJSON, MapMarker, MarkerContent, useMap } from './ui/map';
import shapes from '../data/migration-countries.json';
import { countryFeatures } from '../lib/archive-geography';
import { templateBasemap, templateFallbackBasemap } from './template-basemap';

const fitOptions = { padding: { top: 65, bottom: 45, left: 42, right: 60 }, duration: 0 };
function Camera({ regions, selected, bounds, onReset }) {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    const region = regions.find(item => item.id === selected);
    map.stop();
    if (region?.bounds) map.fitBounds(region.bounds, fitOptions);
    else if (region) map.jumpTo({ center: region.coordinates, zoom: region.zoom ?? 10.5 });
    else map.fitBounds(bounds, fitOptions);
  }, [map, isLoaded, regions, selected, bounds]);
  useEffect(() => {
    if (!map) return;
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return <div className="daily-map__controls" aria-label="地图控制"><div className="daily-map__zoom"><button type="button" aria-label="放大地图" onClick={() => map?.zoomIn()}><Plus size={16} /></button><button type="button" aria-label="缩小地图" onClick={() => map?.zoomOut()}><Minus size={16} /></button></div><button type="button" className="daily-map__reset" aria-label="返回国家总览" onClick={() => { onReset(); map?.fitBounds(bounds, fitOptions); }}><RotateCcw size={16} /></button></div>;
}

export default function CountryArchiveMap({ country, regions, selected, onSelect }) {
  const data = useMemo(() => ({ type: 'FeatureCollection', features: countryFeatures(shapes, country) }), [country]);
  const bounds = country.overviewBounds;
  return <figure className="day-map daily-map country-map" aria-label={`${country.label}国家地图`}><div className="daily-map__surface">
    <Map theme="light" styles={{ light: templateBasemap }} fallbackStyle={templateFallbackBasemap} bounds={bounds} fitBoundsOptions={fitOptions} scrollZoom touchZoomRotate dragPan>
      <MapGeoJSON id={`archive-${country.code}`} data={data} fillPaint={{ 'fill-color': country.color, 'fill-opacity': selected ? .03 : .1 }} linePaint={{ 'line-color': country.color, 'line-width': 1.5 }} />
      {regions.map((region, index) => (
        <MapMarker key={region.id} longitude={region.coordinates[0]} latitude={region.coordinates[1]} anchor="bottom">
          <MarkerContent><button className={`daily-map__marker country-map__marker${selected === region.id ? ' is-current' : ''}`} type="button" aria-label={`定位${region.label}`} aria-pressed={selected === region.id} onClick={() => onSelect(selected === region.id ? null : region.id)}>
            <span aria-hidden="true">{index + 1}</span><strong>{region.label}</strong>
          </button></MarkerContent>
        </MapMarker>
      ))}
      <Camera regions={regions} selected={selected} bounds={bounds} onReset={() => onSelect(null)} />
    </Map>
    <figcaption className="day-map__caption daily-map__caption"><span>{country.name}</span><span>{selected ? regions.find(region => region.id === selected)?.label : '国家总览'}</span></figcaption>
  </div></figure>;
}
