import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import NotebookDialog from './NotebookDialog';
import { Button, DateRange, Field, FormError, FormFooter } from './form/Form';
import { createEmptyNotebook } from '../lib/notebook.js';

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function TripDatesDialog({ startsOn, endsOn, onSave, onClose }) {
  const [dates, setDates] = useState({ startsOn, endsOn });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <NotebookDialog className="reservation-modal" title="旅行日期" onClose={onClose} busy={busy}><form className="notebook-editor__form" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { if (dates.startsOn !== startsOn || dates.endsOn !== endsOn) await onSave(dates.startsOn, dates.endsOn); onClose(); } catch (error) { setError(error.message); } finally { setBusy(false); }
  }}><div className="journey-modal__body"><fieldset className="form-fields" disabled={busy}>
    <DateRange startsOn={dates.startsOn} endsOn={dates.endsOn} onChange={setDates} />
  </fieldset><FormError>{error}</FormError></div>
  <FormFooter><Button disabled={busy} onClick={onClose}>取消</Button><Button variant="primary" type="submit" disabled={busy}>完成</Button></FormFooter></form></NotebookDialog>;
}

export function NewTripDialog({ onCreate, onClose }) {
  const [title, setTitle] = useState(''), [dates, setDates] = useState(() => ({ startsOn: today(), endsOn: today() }));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <NotebookDialog className="reservation-modal" title="新建旅行" onClose={onClose} busy={busy}><form className="notebook-editor__form" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await onCreate(createEmptyNotebook(title, dates.startsOn, dates.endsOn)); } catch (error) { setError(error.message); setBusy(false); }
  }}><div className="journey-modal__body"><fieldset className="form-fields" disabled={busy}>
    <Field label="名称"><input autoFocus required maxLength={500} placeholder="例如：北欧秋天" value={title} onChange={e => setTitle(e.target.value)} /></Field>
    <DateRange startsOn={dates.startsOn} endsOn={dates.endsOn} onChange={setDates} />
  </fieldset><FormError>{error}</FormError></div>
  <FormFooter><Button disabled={busy} onClick={onClose}>取消</Button><Button variant="primary" type="submit" disabled={busy}>创建</Button></FormFooter></form></NotebookDialog>;
}

export function SectionDialog({ name = '', onSave, onDelete, onClose }) {
  const [value, setValue] = useState(name), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function run(operation) { setBusy(true); setError(''); try { await operation(); onClose(); } catch (error) { setError(error.message); } finally { setBusy(false); } }
  return <NotebookDialog className="reservation-modal" title={name ? '编辑分隔' : '添加分隔'} onClose={onClose} busy={busy}><form className="notebook-editor__form" onSubmit={e => { e.preventDefault(); run(() => onSave(value.trim())); }}><div className="journey-modal__body">
    <fieldset className="form-fields" disabled={busy}><Field label="名称"><input autoFocus required maxLength={100} placeholder="例如：冰岛环岛" value={value} onChange={e => setValue(e.target.value)} /></Field></fieldset>
    <FormError>{error}</FormError>
  </div><FormFooter danger={name && <Button variant="danger" disabled={busy} onClick={() => run(onDelete)}><Trash2 />删除</Button>}><Button variant="primary" type="submit" disabled={busy}>完成</Button></FormFooter></form></NotebookDialog>;
}
