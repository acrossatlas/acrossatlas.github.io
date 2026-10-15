import { lazy, Suspense } from 'react';
import { DayEventCard } from './JourneyEvents';

const DayRouteMap = lazy(() => import('./DayRouteMap'));

export default function DayItinerary({ day, events, country, searchQuery = '', onOpenReservation, onOpenStop }) {
  const query = searchQuery.trim().toLocaleLowerCase();
  const visibleEvents = query ? events.filter(event => (
    [event.title, event.detail, event.type, event.navigation].some(value => value?.toLocaleLowerCase().includes(query))
  )) : events;
  return <div className="day-detail">
    <Suspense fallback={<div className="day-map daily-map__loading">正在加载地图…</div>}>
      <DayRouteMap day={day} events={events} country={country} onOpenStop={onOpenStop} />
    </Suspense>
    <section aria-label={`${day.label} 行程事件`} className="day-events">
      <ol className="day-event-list">
        {visibleEvents.map(event => <DayEventCard event={event} key={event.id} onOpenReservation={onOpenReservation} />)}
      </ol>
      {query && !visibleEvents.length && <p className="journey-search-empty" role="status">当天没有匹配的行程。</p>}
    </section>
  </div>;
}
