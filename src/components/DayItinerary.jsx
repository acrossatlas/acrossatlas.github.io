import { lazy, Suspense, useState } from 'react';
import SortableItinerary from './SortableItinerary';
import { Plus } from 'lucide-react';

const DayRouteMap = lazy(() => import('./DayRouteMap'));

export default function DayItinerary({ day, events, originalEvents, country, searchQuery = '', onOpenReservation, onOpenStop, busy, onEdit, onReorder, bookId, genericMap }) {
  const [selected, setSelected] = useState(null);
  function selectEvent(id) {
    setSelected(id);
    if (id) requestAnimationFrame(() => document.getElementById(`event-${id}`)?.scrollIntoView({ behavior: 'instant', block: 'nearest' }));
  }
  const query = searchQuery.trim().toLocaleLowerCase();
  const visibleEvents = query ? events.filter(event => (
    [event.title, event.detail, event.type, event.navigation].some(value => value?.toLocaleLowerCase().includes(query))
  )) : events;
  return <div className="day-detail">
    <Suspense fallback={<div className="day-map daily-map__loading">正在加载地图…</div>}>
      <DayRouteMap day={day} events={events} originalEvents={originalEvents} country={country} onOpenStop={onOpenStop} genericMap={genericMap} onEdit={onEdit} onSelectEvent={selectEvent} />
    </Suspense>
    <section aria-label={`${day.label} 行程事件`} className="day-events">
      <SortableItinerary dayId={day.key} bookId={bookId} events={visibleEvents} selected={selected} busy={busy} onEdit={onEdit} onReorder={query ? undefined : onReorder} onOpenReservation={onOpenReservation} />
      {query && !visibleEvents.length && <p className="journey-search-empty" role="status">当天没有匹配的行程。</p>}
      {!query && !events.length && <p className="journey-search-empty">当天尚未安排行程。</p>}
      {onEdit && <div className="itinerary-add"><button className="journey-tool-button" type="button" onClick={() => onEdit(null)} disabled={busy}><Plus size={15} />添加行程</button></div>}
    </section>
  </div>;
}
