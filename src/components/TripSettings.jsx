import { useState } from 'react';
import NotebookDialog from './NotebookDialog';
import { Button, ConfirmButton, DateRange, Field, FormError, FormFooter } from './form/Form';
import { createEmptyNotebook } from '../lib/notebook.js';

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function focusInvalid() { requestAnimationFrame(() => document.querySelector('.notebook-editor [aria-invalid="true"]')?.focus()); }

// Shared run state: disable the form while saving, keep it open with the message on failure.
function useRun(onClose) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function run(operation, close = true) {
    setBusy(true); setError('');
    try { await operation(); if (close) onClose(); } catch (error) { setError(error.message); setBusy(false); }
  }
  return { busy, error, run };
}

export function TripDatesDialog({ startsOn, endsOn, onSave, onClose }) {
  const [dates, setDates] = useState({ startsOn, endsOn });
  const { busy, error, run } = useRun(onClose);
  const dirty = dates.startsOn !== startsOn || dates.endsOn !== endsOn;
  return <NotebookDialog className="reservation-modal" title="旅行日期" onClose={onClose} dirty={dirty && !busy} busy={busy}>
    <form className="notebook-editor__form" noValidate onSubmit={e => { e.preventDefault(); if (!dirty) onClose(); else run(() => onSave(dates.startsOn, dates.endsOn)); }}>
      <div className="journey-modal__body"><fieldset className="form-fields" disabled={busy}>
        <DateRange startsOn={dates.startsOn} endsOn={dates.endsOn} onChange={setDates} />
      </fieldset><FormError>{error}</FormError></div>
      <FormFooter><Button variant="primary" type="submit" disabled={busy}>完成</Button></FormFooter>
    </form>
  </NotebookDialog>;
}

export function NewTripDialog({ onCreate, onClose }) {
  const [title, setTitle] = useState(''), [dates, setDates] = useState(() => ({ startsOn: today(), endsOn: today() })), [checked, setChecked] = useState(false);
  const { busy, error, run } = useRun(onClose);
  const titleError = checked && !title.trim() ? '请填写名称' : '';
  return <NotebookDialog className="reservation-modal" title="新建旅行" onClose={onClose} dirty={Boolean(title.trim()) && !busy} busy={busy}>
    <form className="notebook-editor__form" noValidate onSubmit={e => {
      e.preventDefault(); setChecked(true);
      if (!title.trim()) { focusInvalid(); return; }
      run(() => onCreate(createEmptyNotebook(title.trim(), dates.startsOn, dates.endsOn)), false);
    }}>
      <div className="journey-modal__body"><fieldset className="form-fields" disabled={busy}>
        <Field label="名称" error={titleError}><input data-autofocus="" maxLength={500} placeholder="例如：北欧秋天" value={title} onChange={e => setTitle(e.target.value)} /></Field>
        <DateRange startsOn={dates.startsOn} endsOn={dates.endsOn} onChange={setDates} />
      </fieldset><FormError>{error}</FormError></div>
      <FormFooter><Button variant="primary" type="submit" disabled={busy}>创建</Button></FormFooter>
    </form>
  </NotebookDialog>;
}

export function SectionDialog({ day, name = '', onSave, onDelete, onClose }) {
  const [value, setValue] = useState(name), [checked, setChecked] = useState(false);
  const { busy, error, run } = useRun(onClose);
  const when = day?.label ?? day?.date?.slice(5).replace('-', '.');
  const valueError = checked && !value.trim() ? '请填写名称' : '';
  return <NotebookDialog className="reservation-modal" title={name ? '编辑分隔' : '添加分隔'} eyebrow={when ? `${when} 之前` : undefined} onClose={onClose} dirty={value.trim() !== name && !busy} busy={busy}>
    <form className="notebook-editor__form" noValidate onSubmit={e => {
      e.preventDefault(); setChecked(true);
      if (!value.trim()) { focusInvalid(); return; }
      if (value.trim() === name) onClose(); else run(() => onSave(value.trim()));
    }}>
      <div className="journey-modal__body"><fieldset className="form-fields" disabled={busy}>
        <Field label="名称" error={valueError}><input data-autofocus="" maxLength={100} placeholder="例如：冰岛" value={value} onChange={e => setValue(e.target.value)} /></Field>
        <p className="form-message">显示在日期标签之间，用来分开国家或路段。</p>
      </fieldset><FormError>{error}</FormError></div>
      <FormFooter>
        {name && <ConfirmButton confirmLabel="确认删除" disabled={busy} onConfirm={() => run(onDelete)}>删除</ConfirmButton>}
        <Button variant="primary" type="submit" disabled={busy}>完成</Button>
      </FormFooter>
    </form>
  </NotebookDialog>;
}
