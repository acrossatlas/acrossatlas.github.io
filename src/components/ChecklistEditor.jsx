import { useState } from 'react';
import NotebookDialog, { EditorField, EditorFooter } from './NotebookDialog';
import { useDraftAutosave } from '../lib/use-draft-autosave.js';

export default function ChecklistEditor({ selection, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState({ label: selection.item?.label ?? '', detail: selection.item?.detail ?? '' });
  const [deleting, setDeleting] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const autosave = useDraftAutosave(draft, { revision: selection.revision, enabled: !deleting, ready: draft => Boolean(draft.label.trim()), onSave: (draft, revision) => onSave({ label: draft.label.trim(), detail: draft.detail.trim() }, revision) });
  async function close() {
    if (!selection.item && !draft.label.trim() && autosave.revision.current === selection.revision) { onClose(); return; }
    try { await autosave.flush(); onClose(); } catch { /* The input remains available. */ }
  }
  async function remove() {
    setBusy(true); setError('');
    try { await autosave.wait(); await onDelete(autosave.revision.current); onClose(); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  }
  return <NotebookDialog className="reservation-modal" title={deleting ? '删除清单条目？' : selection.item ? '编辑清单条目' : '添加清单条目'} eyebrow="Checklist" onClose={close} busy={busy}>
    <form className="notebook-editor__form" onSubmit={e => { e.preventDefault(); close(); }}><div className="journey-modal__body">
      {deleting ? <div className="reservation-state"><strong>{draft.label}</strong><p>删除后可在更多菜单中撤销恢复。</p></div> : <fieldset className="notebook-fields"><EditorField label="名称"><input autoFocus required maxLength={300} value={draft.label} onChange={e => setDraft(draft => ({ ...draft, label: e.target.value }))} /></EditorField><EditorField label="说明"><textarea rows={3} maxLength={2000} value={draft.detail} onChange={e => setDraft(draft => ({ ...draft, detail: e.target.value }))} /></EditorField></fieldset>}
      {(error || autosave.error) && <p className="notebook-editor__error" role="alert">{error || autosave.error}</p>}
    </div><EditorFooter>
      {deleting ? <><button className="journey-tool-button" type="button" disabled={busy} onClick={() => setDeleting(false)}>保留条目</button><button className="journey-tool-button is-primary" type="button" disabled={busy} onClick={remove}>确认删除</button></> : <>{(selection.item || autosave.revision.current !== selection.revision) && <button className="journey-tool-button" type="button" onClick={async () => { await autosave.wait().catch(() => {}); setDeleting(true); }}>删除</button>}{autosave.error && <button className="journey-tool-button" type="button" onClick={onClose}>放弃未保存内容</button>}<button className="journey-tool-button is-primary" type="submit">完成</button></>}
    </EditorFooter></form>
  </NotebookDialog>;
}
