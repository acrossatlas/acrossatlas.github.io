import { eventTimeLabel } from '../lib/notebook.js';

export default function EventCard({ event, onOpenReservation, title, children, actions, onEdit, cardProps, dragHandle, dayId, selected = false }) {
  const time = eventTimeLabel(event, dayId);
  return (
    <li {...cardProps} className={`day-event-card${selected ? ' is-selected' : ''}${onEdit ? ' is-editable' : ''}`} id={`event-${event.id}`} onClick={onEdit ? e => {
      if (e.target.closest('button,a,input,textarea,select,summary,label') || window.getSelection()?.toString()) return;
      onEdit();
    } : undefined}>
      <div className="day-event-card__meta">
        <span className="day-event-card__time">{time}</span>
        <div className="day-event-card__signals">
          {event.reservationStatus === '未预定' && <span className="event-alert-tag">未预定</span>}
          {event.reservationStatus === '已预定' && onOpenReservation && <button className="reservation-info-trigger" onClick={() => onOpenReservation(event)} type="button">预定信息</button>}
          {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
          <span className="day-event-card__type">{event.type}</span>
          {dragHandle}
        </div>
      </div>
      {title ?? <div className="day-event-card__title-row"><h3>{event.title}</h3></div>}
      {children ?? <p className="event-description">{event.detail}</p>}
      {actions}
    </li>
  );
}
