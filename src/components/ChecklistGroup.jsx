import { useEffect, useState } from 'react';
import { CheckIcon } from './CopyIcons';

export default function ChecklistGroup({ groups, items = [], title, variant, storageId, persist = true }) {
  const allItems = groups ? groups.flatMap((group) => group.items) : items;
  const storageKey = `across-atlas:${storageId}:checklist:${variant}`;
  const [checkedItems, setCheckedItems] = useState(() => {
    const defaultItems = allItems.filter((item) => item.checked).map((item) => item.id);

    if (!persist) return new Set(defaultItems);
    try {
      const storedItems = JSON.parse(window.localStorage.getItem(storageKey));
      if (!Array.isArray(storedItems)) return new Set(defaultItems);

      const validItemIds = new Set(allItems.map((item) => item.id));
      return new Set(storedItems.filter((itemId) => validItemIds.has(itemId)));
    } catch {
      return new Set(defaultItems);
    }
  });

  useEffect(() => {
    if (!persist) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...checkedItems]));
    } catch {
      // Keep the checklist usable when browser storage is unavailable.
    }
  }, [checkedItems, storageKey, persist]);

  const toggleItem = (itemId, checked) => {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const renderItems = (groupItems) => (
    <div className="checklist-grid">
      {groupItems.map((item) => {
        const checked = checkedItems.has(item.id);

        return (
          <label className={`checklist-item${checked ? ' is-checked' : ''}`} key={item.id}>
            <input
              checked={checked}
              onChange={(event) => toggleItem(item.id, event.target.checked)}
              type="checkbox"
            />
            <span aria-hidden="true" className="checklist-box"><CheckIcon /></span>
            <span className="checklist-copy">
              {item.emoji && <span aria-hidden="true" className="checklist-emoji">{item.emoji}</span>}
              <span className="checklist-text">
                <strong>{item.label}</strong>
                {item.detail && <small>{item.detail}</small>}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );

  return (
    <section className={`checklist-group checklist-group--${variant}`}>
      <h3>{title}</h3>
      {groups ? groups.map((group) => (
        <section className="checklist-subgroup" key={group.id}>
          <h4>{group.title}</h4>
          {renderItems(group.items)}
        </section>
      )) : renderItems(items)}
    </section>
  );
}
