import { useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from './JourneyEvents';

// Same shell, header, close button and scrolling body as Transport / Stay.
// `header` replaces the title row (the itinerary editor puts its type tabs there).
//
// Closing (×, Escape, backdrop) asks `canClose` first. If it answers false the
// changes can't be kept, so the × turns into "放弃修改" in place; pressing it
// discards and closes, while Escape or any further edit keeps editing.
// Initial focus goes to the element marked data-autofocus, otherwise the dialog
// itself, so no control shows a focus ring just because the dialog opened.
export default function NotebookDialog({ title, eyebrow, header, onClose, canClose, busy, children, className = '' }) {
  const ref = useRef(null), closeRef = useRef(null), titleId = useId();
  const [confirming, setConfirming] = useState(false), [checking, setChecking] = useState(false);
  useEffect(() => {
    const element = ref.current, opener = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    (element.querySelector('[data-autofocus]') ?? element).focus({ preventScroll: true });
    return () => {
      element.close(); document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => { if (confirming) closeRef.current?.focus(); }, [confirming]);
  async function requestClose() {
    if (busy || checking) return;
    if (confirming) { onClose(); return; }
    setChecking(true);
    let ok = true;
    try { ok = canClose ? await canClose() : true; } catch { ok = false; }
    setChecking(false);
    if (ok) onClose(); else setConfirming(true);
  }
  return <dialog ref={ref} tabIndex={-1} className={`journey-modal notebook-editor ${className}`} aria-labelledby={header ? undefined : titleId} aria-label={header ? title : undefined}
    onCancel={event => { event.preventDefault(); if (confirming) setConfirming(false); else requestClose(); }}
    onInput={() => confirming && setConfirming(false)}
    onClick={event => {
      if (event.target !== event.currentTarget || busy) return;
      const rect = ref.current.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
    }}>
    <header className="journey-modal__header notebook-editor__header">
      {header || <div>{eyebrow && <p>{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div>}
      <button ref={closeRef} type="button" className={`notebook-editor__close${confirming ? ' is-confirming' : ''}`} disabled={busy || checking}
        aria-label={confirming ? '放弃修改并关闭' : '关闭编辑窗口'} onClick={requestClose}>
        {confirming ? <span>放弃修改</span> : <CloseIcon />}
      </button>
    </header>
    {children}
  </dialog>;
}
