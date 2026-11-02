import { useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from './JourneyEvents';

// Same shell, header, close button and scrolling body as Transport / Stay.
// `header` replaces the title (the itinerary editor puts its type tabs there);
// `actions` sit just left of the close button.
//
// Closing never saves. While `dirty` is true, the first close (×, Escape or a
// click on the backdrop) turns the × into "放弃修改" in place; pressing it
// discards and closes. Escape or any further edit returns to the ×.
// Initial focus goes to the element marked data-autofocus, otherwise the dialog itself.
export default function NotebookDialog({ title, eyebrow, header, actions, onClose, dirty = false, busy, children, className = '' }) {
  const ref = useRef(null), closeRef = useRef(null), titleId = useId();
  const [confirming, setConfirming] = useState(false);
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
  useEffect(() => { if (confirming) closeRef.current?.focus({ preventScroll: true }); }, [confirming]);
  useEffect(() => { if (!dirty) setConfirming(false); }, [dirty]);
  function requestClose() {
    if (busy) return;
    if (dirty && !confirming) setConfirming(true); else onClose();
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
      {actions && <div className="notebook-editor__actions">{actions}</div>}
      <button ref={closeRef} type="button" className={`notebook-editor__close${confirming ? ' is-confirming' : ''}`} disabled={busy}
        aria-label={confirming ? '放弃修改并关闭' : '关闭编辑窗口'} onClick={requestClose} onBlur={() => setConfirming(false)}>
        {confirming ? <span>放弃修改</span> : <CloseIcon />}
      </button>
    </header>
    {children}
  </dialog>;
}
