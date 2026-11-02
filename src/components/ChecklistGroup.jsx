import { useEffect, useState } from 'react';
import { CheckIcon } from './CopyIcons';
import { Plus } from 'lucide-react';

export default function ChecklistGroup({ groups, items = [], title, variant, storageId, persist = true, controlled = false, disabled = false, onToggle, onEdit, onAdd }) {
  const allItems = groups ? groups.flatMap(group => group.items) : items;
  const storageKey = `across-atlas:${storageId}:checklist:${variant}`;
  const [checkedItems, setCheckedItems] = useState(() => {
    const defaults = allItems.filter(item => item.checked).map(item => item.id);
    if (!persist) return new Set(defaults);
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (!Array.isArray(stored)) return new Set(defaults);
      return new Set(stored.filter(id => allItems.some(item => item.id === id)));
    } catch { return new Set(defaults); }
  });
  useEffect(() => {
    if (!persist) return;
    try { localStorage.setItem(storageKey, JSON.stringify([...checkedItems])); } catch { /* Local-only preview. */ }
  }, [checkedItems, storageKey, persist]);
  function toggle(id, checked) {
    if (controlled) { onToggle(id, checked); return; }
    setCheckedItems(current => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; });
  }
  const copy = item => <>{item.emoji && <span aria-hidden="true" className="checklist-emoji">{item.emoji}</span>}<span className="checklist-text"><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</span></>;
  const renderItems = (items, groupId) => <div className="checklist-grid">{items.map(item => {
    const checked = controlled ? Boolean(item.checked) : checkedItems.has(item.id);
    return onEdit ? <div className={`checklist-item${checked ? ' is-checked' : ''}`} key={item.id}>
      <label className="checklist-check"><input type="checkbox" checked={checked} disabled={disabled} aria-label={item.label} onChange={e => toggle(item.id, e.target.checked)} /><span aria-hidden="true" className="checklist-box"><CheckIcon /></span></label>
      <button type="button" className="checklist-copy checklist-edit-copy" aria-label={`编辑${item.label}`} disabled={disabled} onClick={() => onEdit(item, groupId)}>{copy(item)}</button>
    </div> : <label className={`checklist-item${checked ? ' is-checked' : ''}`} key={item.id}><input type="checkbox" checked={checked} disabled={disabled} onChange={e => toggle(item.id, e.target.checked)} /><span aria-hidden="true" className="checklist-box"><CheckIcon /></span><span className="checklist-copy">{copy(item)}</span></label>;
  })}</div>;
  return <section className={`checklist-group checklist-group--${variant}`}>
    {onAdd && !groups ? <div className="notebook-checklist-heading"><h3>{title}</h3><button className="theme-toggle" type="button" aria-label={`添加${title}条目`} disabled={disabled} onClick={() => onAdd()}><Plus size={15} /></button></div> : <h3>{title}</h3>}
    {groups ? groups.map(group => <section className="checklist-subgroup" key={group.id}>{onAdd ? <div className="notebook-checklist-heading"><h4>{group.title}</h4><button className="theme-toggle" type="button" aria-label={`添加${group.title}条目`} disabled={disabled} onClick={() => onAdd(group.id)}><Plus size={15} /></button></div> : <h4>{group.title}</h4>}{renderItems(group.items, group.id)}</section>) : renderItems(items)}
  </section>;
}
