import { useId } from 'react';

// A single grouped field. All four controls use the browser / OS pickers.
export default function DateTimeRangeField({ value, onChange, min, max, label = '时间', prefix = '' }) {
  const id = useId();
  const update = (key, next) => {
    const changed = { ...value, [key]: next };
    if (key === 'startsOn' && value.endsOn === value.startsOn) changed.endsOn = next;
    onChange(changed);
  };
  return <div className="notebook-field"><span id={id}>{label}</span><div className="journey-search notebook-range" role="group" aria-labelledby={id}>
    <div><input type="date" aria-label={`${prefix}开始日期`} value={value.startsOn ?? ''} min={min} max={max} onChange={e => update('startsOn', e.target.value)} /><input type="time" aria-label={`${prefix}开始时间`} value={value.startsAt ?? ''} onChange={e => update('startsAt', e.target.value)} /></div>
    <span className="notebook-range__separator" aria-hidden="true">—</span>
    <div><input type="date" aria-label={`${prefix}结束日期`} value={value.endsOn ?? ''} onChange={e => update('endsOn', e.target.value)} /><input type="time" aria-label={`${prefix}结束时间`} value={value.endsAt ?? ''} onChange={e => update('endsAt', e.target.value)} /></div>
  </div></div>;
}
