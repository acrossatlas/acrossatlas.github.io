import { Expand, Minus, Plus, RotateCcw } from 'lucide-react';
import { useMap } from './ui/map';

export default function MapControls({ onReset, resetLabel = '恢复默认位置', onShowAll }) {
  const { map } = useMap();
  return <div className="daily-map__controls" aria-label="地图控制">
    {onShowAll && <button className="daily-map__overview" type="button" aria-label="查看酒店与全部行程地点" title="查看酒店与全部行程地点" onClick={onShowAll}><Expand size={16} strokeWidth={1.8} aria-hidden="true" /></button>}
    <div className="daily-map__zoom">
      <button type="button" aria-label="放大地图" onClick={() => map?.zoomIn()}><Plus size={16} strokeWidth={1.8} aria-hidden="true" /></button>
      <button type="button" aria-label="缩小地图" onClick={() => map?.zoomOut()}><Minus size={16} strokeWidth={1.8} aria-hidden="true" /></button>
    </div>
    <button className="daily-map__reset" type="button" aria-label={resetLabel} title={resetLabel} onClick={onReset}><RotateCcw size={16} strokeWidth={1.8} aria-hidden="true" /></button>
  </div>;
}
