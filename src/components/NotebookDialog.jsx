import { useEffect, useId, useRef } from 'react';
import { CloseIcon } from './JourneyEvents';

// Same shell, header, close button and scrolling body as Transport / Stay.
// `header` replaces the title row (the itinerary editor puts its type tabs there).
export default function NotebookDialog({ title, eyebrow, header, onClose, busy, children, className = '' }) {
  const ref = useRef(null), titleId = useId();
  useEffect(() => {
    const element = ref.current, opener = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => {
      element.close(); document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={`journey-modal notebook-editor ${className}`} aria-labelledby={header ? undefined : titleId} aria-label={header ? title : undefined}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget || busy) return;
      const rect = ref.current.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <header className="journey-modal__header notebook-editor__header">
      {header || <div>{eyebrow && <p>{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div>}
      <button type="button" disabled={busy} aria-label="关闭编辑窗口" onClick={onClose}><CloseIcon /></button>
    </header>
    {children}
  </dialog>;
}
