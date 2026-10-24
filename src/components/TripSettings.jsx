import { useState } from 'react';
import NotebookDialog, { EditorField, EditorFooter } from './NotebookDialog';
import { createEmptyNotebook } from '../lib/notebook.js';

export function TripDatesDialog({ startsOn, endsOn, onSave, onClose }) {
  const [start, setStart] = useState(startsOn), [end, setEnd] = useState(endsOn);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <NotebookDialog className="reservation-modal" title="旅行日期" onClose={onClose} busy={busy}><form className="notebook-editor__form" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { if (start !== startsOn || end !== endsOn) await onSave(start, end); onClose(); } catch (error) { setError(error.message); } finally { setBusy(false); }
  }}><div className="journey-modal__body"><fieldset className="notebook-fields" disabled={busy}>
    <EditorField label="开始日期"><input type="date" required value={start} onChange={e => setStart(e.target.value)} /></EditorField>
    <EditorField label="结束日期"><input type="date" required min={start} value={end} onChange={e => setEnd(e.target.value)} /></EditorField>
  </fieldset>{error && <p className="notebook-editor__error" role="alert">{error}</p>}</div><EditorFooter><button className="journey-tool-button is-primary" type="submit" disabled={busy}>完成</button></EditorFooter></form></NotebookDialog>;
}

export function NewTripDialog({ onCreate, onClose }) {
  const now = new Date(), today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [title, setTitle] = useState(''), [start, setStart] = useState(today), [end, setEnd] = useState(today);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <NotebookDialog className="reservation-modal" title="新建旅行" onClose={onClose} busy={busy}><form className="notebook-editor__form" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await onCreate(createEmptyNotebook(title, start, end)); } catch (error) { setError(error.message); setBusy(false); }
  }}><div className="journey-modal__body"><fieldset className="notebook-fields" disabled={busy}>
    <EditorField label="名称"><input autoFocus required maxLength={500} value={title} onChange={e => setTitle(e.target.value)} /></EditorField>
    <EditorField label="开始日期"><input type="date" required value={start} onChange={e => { const next = e.target.value; setStart(next); if (end < next) setEnd(next); }} /></EditorField>
    <EditorField label="结束日期"><input type="date" required min={start} value={end} onChange={e => setEnd(e.target.value)} /></EditorField>
  </fieldset>{error && <p className="notebook-editor__error" role="alert">{error}</p>}</div><EditorFooter><button className="journey-tool-button is-primary" type="submit" disabled={busy}>创建</button></EditorFooter></form></NotebookDialog>;
}

export function SectionDialog({ day, name = '', onSave, onDelete, onClose }) {
  const [value, setValue] = useState(name), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function run(operation) { setBusy(true); setError(''); try { await operation(); onClose(); } catch (error) { setError(error.message); } finally { setBusy(false); } }
  return <NotebookDialog className="reservation-modal" title={name ? '编辑分隔' : '添加分隔'} onClose={onClose} busy={busy}><form className="notebook-editor__form" onSubmit={e => { e.preventDefault(); run(() => onSave(value.trim())); }}><div className="journey-modal__body">
    <EditorField label="名称"><input autoFocus required maxLength={100} value={value} onChange={e => setValue(e.target.value)} /></EditorField>
    {error && <p className="notebook-editor__error" role="alert">{error}</p>}
  </div><EditorFooter>{name && <button className="journey-tool-button" type="button" disabled={busy} onClick={() => run(onDelete)}>删除</button>}<button className="journey-tool-button is-primary" type="submit" disabled={busy}>完成</button></EditorFooter></form></NotebookDialog>;
}
