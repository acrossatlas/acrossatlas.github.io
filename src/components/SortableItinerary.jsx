import { useEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { DayEventCard } from './JourneyEvents';

export default function SortableItinerary({ events, busy, onEdit, onReorder, onOpenReservation, bookId, dayId, selected }) {
  const list = useRef(null), gesture = useRef(null), suppressed = useRef(false), cleanup = useRef(null);
  const [drag, setDrag] = useState(null), [message, setMessage] = useState('');
  useEffect(() => () => cleanup.current?.(), []);
  const interactive = target => target.closest('button,a,input,textarea,select,summary,label');
  function begin(event, item, handle = false) {
    if (!onReorder || busy || event.button !== 0 || (!handle && (event.pointerType === 'touch' || interactive(event.target)))) return;
    event.stopPropagation();
    if (handle) event.preventDefault();
    const start = { id: item.id, x: event.clientX, y: event.clientY, active: false, target: null, position: 'before' };
    gesture.current = start;
    function move(event) {
      if (!start.active && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 6) return;
      start.active = true; suppressed.current = true; event.preventDefault();
      const candidates = [...list.current.querySelectorAll('[data-sortable-id]')].filter(element => element.dataset.sortableId !== start.id);
      const target = candidates.reduce((best, element) => {
        const rect = element.getBoundingClientRect(), distance = Math.abs(event.clientY - (rect.top + rect.height / 2));
        return !best || distance < best.distance ? { element, rect, distance } : best;
      }, null);
      start.target = target?.element.dataset.sortableId;
      start.position = target && event.clientY > target.rect.top + target.rect.height / 2 ? 'after' : 'before';
      setDrag({ ...start, point: { x: event.clientX, y: event.clientY }, title: item.title });
      const scroller = list.current.closest('.day-events');
      if (scroller && scroller.scrollHeight > scroller.clientHeight) {
        const rect = scroller.getBoundingClientRect();
        if (event.clientY < rect.top + 48) scroller.scrollTop -= 20;
        if (event.clientY > rect.bottom - 48) scroller.scrollTop += 20;
      }
      if (event.clientY < 60) window.scrollBy(0, -16);
      if (event.clientY > innerHeight - 60) window.scrollBy(0, 16);
    }
    function stop(event) {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop);
      cleanup.current = null; gesture.current = null; setDrag(null);
      if (event.type !== 'pointercancel' && start.active && start.target) {
        Promise.resolve(onReorder(start.id, start.target, start.position)).then(() => setMessage(`已调整${item.title}的顺序`)).catch(error => setMessage(error.message));
      }
      setTimeout(() => { suppressed.current = false; }, 100);
    }
    cleanup.current = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); };
    window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop);
  }
  function keyboard(event, item, index) {
    const delta = { ArrowUp: -1, ArrowDown: 1 }[event.key];
    if (!delta || !events[index + delta]) return;
    event.preventDefault(); event.stopPropagation();
    Promise.resolve(onReorder(item.id, events[index + delta].id, delta < 0 ? 'before' : 'after')).catch(error => setMessage(error.message));
  }
  return <>
    <ol className="day-event-list" ref={list}>
      {events.map((event, index) => <DayEventCard key={event.id} event={event} dayId={dayId} bookId={bookId} selected={selected === event.id} onOpenReservation={onOpenReservation} onEdit={onEdit ? () => { if (!suppressed.current && !busy) onEdit(event); } : undefined}
        cardProps={{ 'data-sortable-id': event.id, onPointerDown: e => begin(e, event), 'data-dragging': drag?.id === event.id || undefined, 'data-drop': drag?.target === event.id ? drag.position : undefined }}
        dragHandle={onReorder && events.length > 1 ? <button className="theme-toggle itinerary-drag-handle" type="button" aria-label={`拖动调整${event.title}顺序`} title="拖动排序，键盘可用上下方向键" disabled={busy} onClick={e => e.stopPropagation()} onPointerDown={e => begin(e, event, true)} onKeyDown={e => keyboard(e, event, index)}><GripVertical size={14} /></button> : null} />)}
    </ol>
    {drag && <div className="itinerary-drag-preview" aria-hidden="true" style={{ left: drag.point.x + 12, top: drag.point.y + 12 }}>{drag.title}</div>}
    <span className="sr-only" role="status">{message}</span>
  </>;
}
