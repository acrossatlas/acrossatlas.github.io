import { cloneElement, useId } from 'react';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

// Shared form primitives for every notebook editor. Surfaces reuse the
// journey-search pill; tokens come from styles.css. Styles live in form.css.

/** Label stacked above one control. The child input/select/textarea is wired to the label. */
export function Field({ label, hint, children, className = '' }) {
  const id = useId();
  const multiline = children.type === 'textarea';
  return <label className={`form-field ${className}`} htmlFor={id}>
    <span className="form-field__label" id={`${id}-label`}>{label}</span>
    <span className={`form-control${multiline ? ' form-control--multiline' : ''}`}>{cloneElement(children, { id, 'aria-labelledby': `${id}-label` })}</span>
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

/** Native date / time input on the pill surface, opening the OS picker on click. */
export function PickerInput({ type = 'time', ...props }) {
  const Icon = type === 'date' ? Calendar : Clock;
  return <span className="form-control form-control--picker">
    <Icon aria-hidden="true" />
    <input type={type} step={type === 'time' ? 60 : undefined} onClick={openPicker} {...props} />
  </span>;
}

export function TimeRange({ label = '时间', prefix = '', startsAt, endsAt, onChange }) {
  return <FieldGroup label={label}><div className="form-range">
    <PickerInput aria-label={`${prefix}开始时间`} value={startsAt || ''} onChange={e => onChange({ startsAt: e.target.value, endsAt })} />
    <span className="form-range__separator" aria-hidden="true">—</span>
    <PickerInput aria-label={`${prefix}结束时间`} value={endsAt || ''} onChange={e => onChange({ startsAt, endsAt: e.target.value })} />
  </div></FieldGroup>;
}

export function DateRange({ label = '日期', startsOn, endsOn, min, max, onChange }) {
  return <FieldGroup label={label}><div className="form-range">
    <PickerInput type="date" required aria-label="开始日期" min={min} max={max} value={startsOn} onChange={e => onChange({ startsOn: e.target.value, endsOn: endsOn < e.target.value ? e.target.value : endsOn })} />
    <span className="form-range__separator" aria-hidden="true">—</span>
    <PickerInput type="date" required aria-label="结束日期" min={startsOn} max={max} value={endsOn} onChange={e => onChange({ startsOn, endsOn: e.target.value })} />
  </div></FieldGroup>;
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
