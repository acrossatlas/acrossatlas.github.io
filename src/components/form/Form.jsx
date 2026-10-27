import { cloneElement, useEffect, useId, useState } from 'react';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

// Shared form primitives for every notebook editor. Surfaces reuse the
// journey-search pill; tokens come from styles.css. Styles live in form.css.

/** Label stacked above one control. The child input/select/textarea is wired to the label. */
export function Field({ label, hint, children, className = '' }) {
  const id = useId();
  const multiline = children.type === 'textarea', select = children.type === 'select';
  return <label className={`form-field ${className}`} htmlFor={id}>
    <span className="form-field__label" id={`${id}-label`}>{label}</span>
    <span className={`form-control${multiline ? ' form-control--multiline' : ''}${select ? ' form-control--select' : ''}`}>{cloneElement(children, { id, 'aria-labelledby': `${id}-label` })}{select && <ChevronDown aria-hidden="true" />}</span>
    {hint && <small className="form-field__hint">{hint}</small>}
  </label>;
}

/** Label above a group of controls (each control carries its own aria-label). */
export function FieldGroup({ label, children, className = '' }) {
  const id = useId();
  return <div className={`form-field ${className}`} role="group" aria-labelledby={id}>
    <span className="form-field__label" id={id}>{label}</span>
    {children}
  </div>;
}

/** Lays fields out side by side on wider dialogs; stacks on phones. */
export function FieldRow({ children }) {
  return <div className="form-row">{children}</div>;
}

function openPicker(event) { try { event.currentTarget.showPicker?.(); } catch { /* Typing still works. */ } }

/** Native date input on the pill surface, opening the OS picker on click. */
export function PickerInput({ type = 'date', ...props }) {
  return <span className="form-control form-control--picker">
    <Calendar aria-hidden="true" />
    <input type={type} onClick={openPicker} {...props} />
  </span>;
}

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
  return <input type="text" className="form-range__input form-range__input--time" inputMode="numeric" autoComplete="off" placeholder="--:--" maxLength={5} aria-invalid={invalid || undefined} value={text}
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

/** One capsule holding start and end time. */
export function TimeRange({ label = '时间', prefix = '', startsAt, endsAt, onChange }) {
  return <FieldGroup label={label}><span className="form-control form-control--range">
    <Clock aria-hidden="true" />
    <TimeInput aria-label={`${prefix}开始时间`} value={startsAt || ''} onChange={next => onChange({ startsAt: next, endsAt })} />
    <span className="form-range__separator" aria-hidden="true">—</span>
    <TimeInput aria-label={`${prefix}结束时间`} value={endsAt || ''} onChange={next => onChange({ startsAt, endsAt: next })} />
  </span></FieldGroup>;
}

/** One capsule holding start and end date (native pickers open on click). */
export function DateRange({ label = '日期', startsOn, endsOn, min, max, onChange }) {
  return <FieldGroup label={label}><span className="form-control form-control--range">
    <Calendar aria-hidden="true" />
    <input type="date" className="form-range__input" required aria-label="开始日期" min={min} max={max} value={startsOn} onClick={openPicker} onChange={e => onChange({ startsOn: e.target.value, endsOn: endsOn < e.target.value ? e.target.value : endsOn })} />
    <span className="form-range__separator" aria-hidden="true">—</span>
    <input type="date" className="form-range__input" required aria-label="结束日期" min={startsOn} max={max} value={endsOn} onClick={openPicker} onChange={e => onChange({ startsOn, endsOn: e.target.value })} />
  </span></FieldGroup>;
}

/** Compact tag-sized select (booking / payment state, transport mode). */
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

/** Bordered sub-section inside a form, e.g. a transport leg or booking details. */
export function FormSection({ title, actions, children, className = '', ...props }) {
  return <section className={`form-section ${className}`} {...props}>
    {(title || actions) && <header className="form-section__header">{title && <h4>{title}</h4>}{actions}</header>}
    {children}
  </section>;
}

export function FormError({ children }) {
  return children ? <p className="form-message is-error" role="alert">{children}</p> : null;
}

export function FormHint({ children, status }) {
  return children ? <p className="form-message" role={status ? 'status' : undefined}>{children}</p> : null;
}

/**
 * Dialog footer. `danger` sits on the left as a quiet text action;
 * `children` (secondary then primary) sit on the right.
 */
export function FormFooter({ danger, children }) {
  return <footer className="form-footer">
    {danger && <div className="form-footer__danger">{danger}</div>}
    <div className="form-footer__actions">{children}</div>
  </footer>;
}

export function Button({ variant = 'secondary', className = '', type = 'button', children, ...props }) {
  const base = variant === 'text' || variant === 'danger' ? 'form-text-button' : 'journey-tool-button';
  return <button type={type} className={`${base}${variant === 'primary' ? ' is-primary' : ''}${variant === 'danger' ? ' is-danger' : ''} ${className}`} {...props}>{children}</button>;
}
