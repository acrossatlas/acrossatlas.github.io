import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import NotebookDialog from './NotebookDialog';
import { Button, Field, FormError, FormFooter } from './form/Form';
import { useDraftAutosave } from '../lib/use-draft-autosave.js';

export default function ChecklistEditor({ selection, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState({ label: selection.item?.label ?? '', detail: selection.item?.detail ?? '' });
  const [deleting, setDeleting] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const autosave = useDraftAutosave(draft, { revision: selection.revision, enabled: !deleting, ready: draft => Boolean(draft.label.trim()), onSave: (draft, revision) => onSave({ label: draft.label.trim(), detail: draft.detail.trim() }, revision) });
  async function canClose() {
    if (!selection.item && !draft.label.trim() && !draft.detail.trim() && autosave.revision.current === selection.revision) return true;
    try { await autosave.flush(); return true; } catch { return false; }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await autosave.wait(); await onDelete(autosave.revision.current); onClose(); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <NotebookDialog className="reservation-modal" title={deleting ? '删除清单条目？' : selection.item ? '编辑清单条目' : '添加清单条目'} eyebrow="Checklist" onClose={onClose} canClose={canClose} busy={busy}>
    <form className="notebook-editor__form" onSubmit={async e => { e.preventDefault(); if (await canClose()) onClose(); }}><div className="journey-modal__body">
      {deleting ? <div className="reservation-state"><strong>{draft.label}</strong><p>删除后可在更多菜单中撤销恢复。</p></div> : <fieldset className="form-fields">
        <Field label="名称"><input data-autofocus={selection.item ? undefined : ''} required maxLength={300} value={draft.label} onChange={e => setDraft(draft => ({ ...draft, label: e.target.value }))} /></Field>
        <Field label="说明"><textarea rows={3} maxLength={2000} value={draft.detail} onChange={e => setDraft(draft => ({ ...draft, detail: e.target.value }))} /></Field>
      </fieldset>}
      <FormError>{error || autosave.error}</FormError>
    </div>
    {deleting
      ? <FormFooter><Button disabled={busy} onClick={() => setDeleting(false)}>保留条目</Button><Button variant="primary" disabled={busy} onClick={remove}>确认删除</Button></FormFooter>
      : <FormFooter danger={(selection.item || autosave.revision.current !== selection.revision) && <Button variant="danger" onClick={async () => { await autosave.wait().catch(() => {}); setDeleting(true); }}><Trash2 />删除</Button>}>
        <Button variant="primary" type="submit">完成</Button>
      </FormFooter>}
    </form>
  </NotebookDialog>;
}
