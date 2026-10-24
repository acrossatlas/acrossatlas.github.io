import { useId } from 'react';

export default function TimeRangeField({ startsAt, endsAt, onChange, prefix = '' }) {
  const id = useId();
  const picker = event => { try { event.currentTarget.showPicker?.(); } catch { /* Native editing remains available. */ } };
  return <div className="notebook-field"><span id={id}>时间</span><div className="notebook-native-time" role="group" aria-labelledby={id}>
    <input type="time" step="60" aria-label={`${prefix}开始时间`} value={startsAt || ''} onClick={picker} onChange={e => onChange({ startsAt: e.target.value, endsAt })} />
    <span aria-hidden="true">—</span>
    <input type="time" step="60" aria-label={`${prefix}结束时间`} value={endsAt || ''} onClick={picker} onChange={e => onChange({ startsAt, endsAt: e.target.value })} />
  </div></div>;
}
