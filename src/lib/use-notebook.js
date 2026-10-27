import { useEffect, useMemo, useRef, useState } from 'react';
import { notebookFromJourney } from './notebook.js';
import { deleteNotebook, openNotebook, switchNotebookVersion, writeNotebook } from './notebook-store.js';

// One notification stream for trip and country views, plus other browser tabs.
const updates = new EventTarget();
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('across-notebook-updates') : null;
channel?.addEventListener('message', event => updates.dispatchEvent(new CustomEvent('change', { detail: event.data })));
function announce(id) {
  updates.dispatchEvent(new CustomEvent('change', { detail: id }));
  channel?.postMessage(id);
}

export function subscribeNotebooks(listener) {
  updates.addEventListener('change', listener);
  return () => updates.removeEventListener('change', listener);
}

export async function createLocalNotebook(seed) {
  const record = await openNotebook(seed); announce(seed.id); return record;
}

export function useNotebook(journey) {
  const seed = useMemo(() => notebookFromJourney(journey), [journey]);
  const [record, setRecord] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const current = useRef(null), locked = useRef(false);
  const update = value => {
    if (current.current && value.localRevision < current.current.localRevision) return;
    current.current = value; setRecord(value);
  };
  useEffect(() => {
    let live = true;
    const load = () => openNotebook(seed).then(value => { if (live) update(value); }).catch(error => { if (live) setError(error.message); });
    const receive = event => { if (event.detail === seed.id) load(); };
    load(); updates.addEventListener('change', receive);
    return () => { live = false; updates.removeEventListener('change', receive); };
  }, [seed]);

  async function run(operation) {
    if (locked.current) throw new Error('正在保存，请稍后再试。');
    if (!current.current) throw new Error('本机存储尚未就绪，暂时无法编辑。');
    locked.current = true; setBusy(true); setError('');
    try {
      const next = await operation(current.current);
      update(next); announce(next.id); return next;
    } catch (error) { setError(error.message); throw error; }
    finally { locked.current = false; setBusy(false); }
  }
  return { record, seed, current, error, busy,
    commit: (transform, label, files, options) => run(record => writeNotebook(record.id, record.localRevision, transform(record.document), label, files, options)),
    switchVersion: versionId => run(record => switchNotebookVersion(record.id, record.localRevision, versionId)),
    remove: expected => run(record => deleteNotebook(record.id, expected)),
  };
}
