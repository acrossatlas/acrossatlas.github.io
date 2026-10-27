import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

// Shared form primitives for every notebook editor. Surfaces reuse the
// journey-search pill; tokens come from styles.css. Styles live in form.css.
//
// Layout: every row is label on the left, control on the right (Field / FieldGroup).
// Paired values (start–end, from–to, mode·code) share one capsule split into two
// equal halves (Split), so the halves line up from row to row.

/** Label on the left, one control on the right. The child input/select/textarea is wired to the label. */
export function Field({ label, error, children, className = '' }) {
  const id = useId();
  const multiline = children.type === 'textarea', select = children.type === 'select';
  return <div className={`form-field${multiline ? ' is-multiline' : ''}${error ? ' is-invalid' : ''} ${className}`}>
    <label className="form-field__label" id={`${id}-label`} htmlFor={id}>{label}</label>
    <span className={`form-control${multiline ? ' form-control--multiline' : ''}${select ? ' form-control--select' : ''}`}>
      {cloneElement(children, { id, 'aria-labelledby': `${id}-label`, 'aria-invalid': error ? true : undefined })}
      {select && <ChevronDown aria-hidden="true" />}
    </span>
    {error && <p className="form-field__error" role="alert">{error}</p>}
  </div>;
}

/** Label on the left of a group of controls; each control carries its own aria-label. */
export function FieldGroup({ label, error, children, className = '' }) {
  const id = useId();
  return <div className={`form-field${error ? ' is-invalid' : ''} ${className}`} role="group" aria-labelledby={id}>
    <span className="form-field__label" id={id}>{label}</span>
    {children}
    {error && <p className="form-field__error" role="alert">{error}</p>}
  </div>;
}

/** One capsule, two equal halves joined by the same connector everywhere: icon · left — right. */
export function Split({ icon: Icon, left, right }) {
  return <span className="form-control form-split">
    <Icon aria-hidden="true" className="form-split__icon" />
    <span className="form-split__half">{left}</span>
    <span className="form-split__separator" aria-hidden="true">—</span>
    <span className="form-split__half">{right}</span>
  </span>;
}

/** Bare select with a chevron, for use inside a Split half. */
export function SplitSelect({ options, placeholder, ...props }) {
  return <span className="form-split__select">
    <select {...props}><option value="">{placeholder}</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select>
    <ChevronDown aria-hidden="true" />
  </span>;
}

function openPicker(event) { try { event.currentTarget.showPicker?.(); } catch { /* Typing still works. */ } }

const pad = number => String(number).padStart(2, '0');

/** Reads "930", "9:30", "21.5" or "2130" as a 24-hour HH:MM time. '' = empty, null = not a time. */
export function parseTime(text) {
  const raw = text.trim();
  if (!raw) return '';
  const parts = raw.split(/[:：.]/);
  let hours, minutes;
  if (parts.length === 2 && /^\d{1,2}$/.test(parts[0]) && /^\d{0,2}$/.test(parts[1])) [hours, minutes] = [Number(parts[0]), Number(parts[1] || 0)];
  else if (/^\d{1,4}$/.test(raw)) [hours, minutes] = raw.length <= 2 ? [Number(raw), 0] : [Number(raw.slice(0, -2)), Number(raw.slice(-2))];
  else return null;
  return hours < 24 && minutes < 60 ? `${pad(hours)}:${pad(minutes)}` : null;
}

function stepTime(value, delta) {
  const [hours, minutes] = (value || '00:00').split(':').map(Number);
  const total = (((hours * 60 + minutes + delta) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * 24-hour time field. Accepts typed digits, commits a complete time while typing
 * and normalises on blur / Enter. Arrow keys step 5 minutes (Shift: 1 hour).
 */
export function TimeInput({ value = '', onChange, ...props }) {
  const [text, setText] = useState(value), [invalid, setInvalid] = useState(false);
  useEffect(() => { setText(current => parseTime(current) === value ? current : value); setInvalid(false); }, [value]);
  const commit = next => { if (next !== value) onChange(next); };
  function settle() {
    const parsed = parseTime(text);
    if (parsed === null) { setInvalid(true); return; }
    setInvalid(false); setText(parsed); commit(parsed);
  }
  return <input type="text" className="form-time" inputMode="numeric" autoComplete="off" placeholder="--:--" maxLength={5} aria-invalid={invalid || undefined} value={text}
    onChange={e => { const next = e.target.value; setText(next); setInvalid(false); if (/^\d{1,2}[:：.]\d{2}$/.test(next.trim()) || next.trim() === '') { const parsed = parseTime(next); if (parsed !== null) commit(parsed); } }}
    onBlur={settle}
    onKeyDown={e => {
      if (e.key === 'Enter') { e.preventDefault(); settle(); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = stepTime(parseTime(text) || value, (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 60 : 5));
        setText(next); setInvalid(false); commit(next);
      }
    }} {...props} />;
}

export function TimeRange({ label = '时间', prefix = '', startsAt, endsAt, onChange }) {
  return <FieldGroup label={label}><Split icon={Clock}
    left={<TimeInput aria-label={`${prefix}开始时间`} value={startsAt || ''} onChange={next => onChange({ startsAt: next, endsAt })} />}
    right={<TimeInput aria-label={`${prefix}结束时间`} value={endsAt || ''} onChange={next => onChange({ startsAt, endsAt: next })} />} /></FieldGroup>;
}

export function DateRange({ label = '日期', startsOn, endsOn, min, max, onChange }) {
  return <FieldGroup label={label}><Split icon={Calendar}
    left={<input type="date" className="form-date" required aria-label="开始日期" min={min} max={max} value={startsOn} onClick={openPicker} onChange={e => onChange({ startsOn: e.target.value, endsOn: endsOn < e.target.value ? e.target.value : endsOn })} />}
    right={<input type="date" className="form-date" required aria-label="结束日期" min={startsOn} max={max} value={endsOn} onClick={openPicker} onChange={e => onChange({ startsOn, endsOn: e.target.value })} />} /></FieldGroup>;
}

/** A single date in a capsule (photo upload). */
export function DateField({ label, ...props }) {
  return <FieldGroup label={label}><span className="form-control form-split form-split--single">
    <Calendar aria-hidden="true" className="form-split__icon" />
    <span className="form-split__half"><input type="date" className="form-date" aria-label={label} onClick={openPicker} {...props} /></span>
  </span></FieldGroup>;
}

/** Compact tag-sized select (booking / payment state). */
export function TagSelect({ options, placeholder, className = '', ...props }) {
  return <span className={`form-tag-select${props.value ? ' has-value' : ''} ${className}`}>
    <select {...props}>
      <option value="">{placeholder}</option>
      {options.filter(Boolean).map(option => <option key={option} value={option}>{option}</option>)}
    </select>
    <ChevronDown aria-hidden="true" />
  </span>;
}

/** Pill tabs used as a single-choice control. */
export function Segmented({ label, options, value, onChange, disabled }) {
  return <div className="day-tabs form-segmented" role="tablist" aria-label={label}>
    {options.map(option => <button key={option} type="button" role="tab" disabled={disabled} aria-selected={value === option} className={value === option ? 'is-active' : ''} onClick={() => onChange(option)}>{option}</button>)}
  </div>;
}

/** Filled card holding its own rows, e.g. one transport leg or the booking details. */
export function FormSection({ title, actions, children, className = '', ...props }) {
  return <section className={`form-section ${className}`} {...props}>
    {(title || actions) && <header className="form-section__header">{title && <h4>{title}</h4>}{actions}</header>}
    {children}
  </section>;
}

/** A grey capsule with one centred action, placed in the control column so it lines up with the fields. */
export function AddBar({ children, ...props }) {
  return <div className="form-field form-add-row">
    <span className="form-field__label" aria-hidden="true" />
    <button type="button" className="form-add-bar" {...props}>{children}</button>
  </div>;
}

export function FormError({ children }) {
  return children ? <p className="form-message is-error" role="alert">{children}</p> : null;
}

export function FormHint({ children, status }) {
  return children ? <p className="form-message" role={status ? 'status' : undefined}>{children}</p> : null;
}

/** Dialog footer: actions on the right, secondary first, primary last. */
export function FormFooter({ children }) {
  return <footer className="form-footer">{children}</footer>;
}

export function Button({ variant = 'secondary', className = '', type = 'button', children, ...props }) {
  const base = variant === 'text' ? 'form-text-button' : 'journey-tool-button';
  return <button type={type} className={`${base}${variant === 'primary' ? ' is-primary' : ''} ${className}`} {...props}>{children}</button>;
}

/**
 * In-place confirmation: the first press turns the label into `confirmLabel`,
 * the second press runs `onConfirm`. Moving focus away resets it.
 */
export function ConfirmButton({ children, confirmLabel, onConfirm, disabled, className = '' }) {
  const [armed, setArmed] = useState(false), ref = useRef(null);
  return <button ref={ref} type="button" disabled={disabled} className={`journey-tool-button form-confirm-button${armed ? ' is-armed' : ''} ${className}`}
    onBlur={() => setArmed(false)}
    onKeyDown={e => { if (e.key === 'Escape' && armed) { e.stopPropagation(); e.preventDefault(); setArmed(false); } }}
    onClick={() => { if (armed) { setArmed(false); onConfirm(); } else { setArmed(true); ref.current?.focus(); } }}>
    {armed ? confirmLabel : children}
  </button>;
}
