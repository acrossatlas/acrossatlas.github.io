import { useState } from 'react';
import NotebookDialog from './NotebookDialog';
import { Button, ConfirmButton, Field, FormError, FormFooter } from './form/Form';
import { useUnsavedGuard } from '../lib/use-unsaved-guard.js';

// Edits apply only on 完成. Closing with changes asks to discard them (see NotebookDialog).
export default function ChecklistEditor({ selection, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState({ label: selection.item?.label ?? '', detail: selection.item?.detail ?? '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [checked, setChecked] = useState(false);
  const dirty = useUnsavedGuard(draft), isNew = !selection.item;
  const labelError = checked && !draft.label.trim() ? '请填写名称' : '';
  async function run(operation) {
    setBusy(true); setError('');
    try { await operation(); onClose(); } catch (error) { setError(error.message); setBusy(false); }
  }
  function save() {
    if (!dirty && !isNew) { onClose(); return; }
    setChecked(true);
    if (!draft.label.trim()) { requestAnimationFrame(() => document.querySelector('.notebook-editor [aria-invalid="true"]')?.focus()); return; }
    run(() => onSave({ label: draft.label.trim(), detail: draft.detail.trim() }, selection.revision));
  }
  return <NotebookDialog className="reservation-modal" title={isNew ? '添加清单条目' : '编辑清单条目'} onClose={onClose} dirty={dirty && !busy} busy={busy}>
    <form className="notebook-editor__form" noValidate onSubmit={e => { e.preventDefault(); save(); }}><div className="journey-modal__body">
      <fieldset className="form-fields" disabled={busy}>
        <Field label="名称" error={labelError}><input data-autofocus={isNew ? '' : undefined} maxLength={300} value={draft.label} onChange={e => setDraft(draft => ({ ...draft, label: e.target.value }))} /></Field>
        <Field label="说明"><textarea rows={3} maxLength={2000} value={draft.detail} onChange={e => setDraft(draft => ({ ...draft, detail: e.target.value }))} /></Field>
      </fieldset>
      <FormError>{error}</FormError>
    </div>
    <FormFooter>
      {!isNew && <ConfirmButton confirmLabel="确认删除" disabled={busy} onConfirm={() => run(() => onDelete(selection.revision))}>删除</ConfirmButton>}
      <Button variant="primary" type="submit" disabled={busy}>完成</Button>
    </FormFooter>
    </form>
  </NotebookDialog>;
}
