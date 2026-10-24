import { useCallback, useEffect, useRef, useState } from 'react';

// Serialize saves, flush the newest draft on close, and keep stale writes visible.
export function useDraftAutosave(draft, { revision, onSave, ready, enabled = true, invalidMessage = '请填写名称。' }) {
  const signature = JSON.stringify(draft);
  const latest = useRef({ draft, signature }), saved = useRef(signature), version = useRef(revision);
  const options = useRef({ onSave, ready, enabled, invalidMessage }), timer = useRef(), running = useRef(null), live = useRef(true);
  const [status, setStatus] = useState('saved'), [error, setError] = useState('');
  latest.current = { draft, signature }; options.current = { onSave, ready, enabled, invalidMessage };
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (running.current) { await running.current; return flush(); }
    const snapshot = latest.current;
    if (snapshot.signature === saved.current) return version.current;
    if (!options.current.ready(snapshot.draft)) {
      const error = new Error(options.current.invalidMessage);
      if (live.current) { setError(error.message); setStatus('error'); }
      throw error;
    }
    if (live.current) { setStatus('saving'); setError(''); }
    const task = (async () => {
      try {
        version.current = await options.current.onSave(snapshot.draft, version.current);
        saved.current = snapshot.signature;
        if (live.current) setStatus(latest.current.signature === snapshot.signature ? 'saved' : 'pending');
        return version.current;
      } catch (error) {
        if (live.current) { setStatus('error'); setError(error.message); }
        throw error;
      }
    })();
    running.current = task;
    try { return await task; } finally { running.current = null; }
  }, []);
  useEffect(() => {
    if (signature === saved.current || !enabled) return;
    setStatus('pending'); setError('');
    if (ready(draft)) timer.current = setTimeout(() => flush().catch(() => {}), 550);
    return () => clearTimeout(timer.current);
  }, [signature, enabled, flush]);
  useEffect(() => {
    live.current = true;
    const beforeLeave = event => {
      if (latest.current.signature !== saved.current) { event.preventDefault(); event.returnValue = ''; }
    };
    const background = () => { if (document.visibilityState === 'hidden' && options.current.enabled && options.current.ready(latest.current.draft)) flush().catch(() => {}); };
    window.addEventListener('beforeunload', beforeLeave); document.addEventListener('visibilitychange', background);
    return () => { live.current = false; clearTimeout(timer.current); window.removeEventListener('beforeunload', beforeLeave); document.removeEventListener('visibilitychange', background); };
  }, [flush]);
  return { flush, status, error, revision: version,
    wait: async () => { clearTimeout(timer.current); if (running.current) await running.current; return version.current; },
  };
}
