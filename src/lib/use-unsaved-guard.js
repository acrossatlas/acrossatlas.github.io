import { useEffect, useRef, useState } from 'react';

// Tracks whether an editor draft differs from what it opened with, and asks the
// browser to confirm leaving the page while it does.
export function useUnsavedGuard(draft) {
  const [initial] = useState(() => JSON.stringify(draft));
  const dirty = JSON.stringify(draft) !== initial;
  const latest = useRef(dirty); latest.current = dirty;
  useEffect(() => {
    const beforeLeave = event => { if (latest.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeLeave);
    return () => window.removeEventListener('beforeunload', beforeLeave);
  }, []);
  return dirty;
}
