import { useEffect, useRef, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { MapMarker, MarkerContent } from './ui/map';
import { CopyIcon, CheckIcon } from './CopyIcons';

function CopyMapAddress({ address }) {
  const [status, setStatus] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy(event) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setStatus('copied');
    } catch { setStatus('error'); }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(''), 2000);
  }
  return <>
    <button type="button" className="daily-map__address daily-map__address-copy" aria-label={status === 'copied' ? '地址已复制' : `复制地址：${address}`} onClick={copy}>
      <span>{address}</span>
      <span className="copy-cue">{status === 'copied' ? <CheckIcon /> : <CopyIcon />}</span>
    </button>
    <span className="daily-map__copy-status" role="status">{status === 'error' ? '复制失败，请重试' : ''}</span>
  </>;
}

export default function DayMapStop({ stop, expanded, previewed, activeRoute, onToggle, onTogglePlannedStop, address, dimmed = false }) {
  return <MapMarker anchor="bottom" longitude={stop.coordinates[0]} latitude={stop.coordinates[1]} offset={stop.repeatOf ? [0, -58] : [0, 0]}>
    <MarkerContent>
      <div data-dimmed={dimmed && !expanded ? 'true' : undefined} data-preview={previewed ? 'true' : undefined} className={`daily-map__marker daily-map__marker--${stop.id}${stop.option ? ' is-optional' : ''}${expanded ? ' is-selected' : ''}${(stop.option ? activeRoute === stop.option || previewed : expanded) ? ' is-highlighted' : ''}`}>
        <button className="daily-map__pin-trigger" type="button" aria-label={`${expanded ? '收起' : '展开'}${stop.name}详情`} aria-expanded={expanded} onClick={onToggle} />
        {stop.repeatOf && <i aria-hidden="true" style={{ position: 'absolute', left: 11, top: 32, height: 58, borderLeft: '1px solid #929b81', pointerEvents: 'none' }} />}
        <span aria-hidden="true">{stop.number === '+' ? <Plus size={13} strokeWidth={2} /> : stop.number}</span><strong>
          {expanded && stop.option && <button className="daily-map__plan-toggle" type="button" aria-label={activeRoute === stop.option ? `从路线移除${stop.name}` : `将${stop.name}加入路线`} aria-pressed={activeRoute === stop.option} title={activeRoute === stop.option ? '移出路线' : '加入路线'} onClick={(event) => { event.stopPropagation(); onTogglePlannedStop(stop.option); }}>
            {activeRoute === stop.option ? <Minus size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          </button>}
          <button className="daily-map__title-trigger" type="button" aria-expanded={expanded} onClick={onToggle}>{stop.name}</button>
          {expanded && <CopyMapAddress address={address || stop.address || stop.name} />}
        </strong>
      </div>
    </MarkerContent>
  </MapMarker>;
}
