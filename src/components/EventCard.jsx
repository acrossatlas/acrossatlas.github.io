export default function EventCard({ event, onOpenReservation, title, children, selected = false }) {
  const end = event.displayEndsAt ?? event.endsAt;
  const time = event.startsAt ? `${event.startsAt}${end ? ` — ${end}` : ''}` : '时间待定';
  return (
    <li className={`day-event-card${selected ? " is-selected" : ""}`} id={`event-${event.id}`}>
      <div className="day-event-card__meta">
        <span className="day-event-card__time">{time}</span>
        <div className="day-event-card__signals">
          {event.reservationStatus === '未预定' && <span className="event-alert-tag">未预定</span>}
          {event.reservationStatus === '已预定' && onOpenReservation && <button className="reservation-info-trigger" onClick={() => onOpenReservation(event)} type="button">预定信息</button>}
          {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
          <span className="day-event-card__type">{event.type}</span>
        </div>
      </div>
      {title ?? <div className="day-event-card__title-row"><h3>{event.title}</h3></div>}
      {children ?? <p className="event-description">{event.detail}</p>}
    </li>
  );
}
