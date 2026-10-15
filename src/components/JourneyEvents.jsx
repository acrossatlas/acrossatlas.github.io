import { useEffect, useState } from 'react';
import EventCard from './EventCard';
import { CopyIcon, CheckIcon } from './CopyIcons';

export function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h13M14 7l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z" />
    </svg>
  );
}

export function useModalBehavior(onClose) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
}

export function CopyableAddress({ label, value }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => setCopied(await copyText(value));

  return (
    <div className="copyable-address-row">
      <button aria-label={copied ? `${label}已复制` : `复制${label}`} className="copyable-address" onClick={handleCopy} type="button">
        <span className="copyable-address__label">{label}</span>
        <span>{value}</span>
        <span className="copy-cue">{copied ? <CheckIcon /> : <CopyIcon />}</span>
      </button>
    </div>
  );
}

function BookingAccess({ access }) {
  if (!access) return null;

  return (
    <aside aria-label="查看预订所需信息" className="booking-access">
      <div className="booking-access__header">
        <span>查看预订需要</span>
        <div className="booking-access__links">
          {access.url && <a href={access.url} rel="noopener noreferrer" target="_blank">
            查询预订<ArrowIcon />
          </a>}
          {access.links?.map((link) => (
            <a href={link.url} key={link.url} rel="noopener noreferrer" target="_blank">
              {link.label}<ArrowIcon />
            </a>
          ))}
        </div>
      </div>
      <div className="booking-access__credentials">
        {access.credentials.map((credential) => (
          credential.label.includes('邮箱')
            ? <div className="booking-access__identity" key={credential.label}>
                <span className="copyable-address__label">{credential.label}</span>
                <span>{credential.value}</span>
              </div>
            : <CopyableAddress key={credential.label} label={credential.label} value={credential.value} />
        ))}
      </div>
    </aside>
  );
}

export function FlightLegCaption({ text }) {
  const flightNumber = text.match(/\b[A-Z0-9]{2}\d{3,4}\b/);

  if (!flightNumber) return <small>{text}</small>;

  const start = flightNumber.index;
  const end = start + flightNumber[0].length;

  return (
    <small>
      {text.slice(0, start)}
      <b>{flightNumber[0]}</b>
      {text.slice(end)}
    </small>
  );
}

function legacyCopyText(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

async function copyText(text) {
  // Keep the first attempt inside the click event's user-activation window.
  if (legacyCopyText(text)) return true;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Some mobile and embedded browsers deny Clipboard API access.
    }
  }

  return false;
}

export function CopyableEventTitle({ className, event }) {
  return (
    <div className={`${className} copyable-title-block`}>
      <h3>{event.title}</h3>
      {event.navigation && (
        <CopyableAddress
          label={event.addressLabel ?? (event.type === '住宿' ? '住宿地址' : '导航地址')}
          value={event.navigation}
        />
      )}
      {event.photoSpots?.length > 0 && (
        <details className="photo-spots">
          <summary><span>拍照点</span><span className="photo-spots__count">{event.photoSpots.length}</span><svg aria-hidden="true" viewBox="0 0 16 16"><path d="m6 4 4 4-4 4" /></svg></summary>
          {event.photoSpots.map((spot) => (
            <div className="photo-spots__item" key={spot.name}>
              <CopyableAddress label="拍照点" value={spot.query} />
              <p>{spot.note}</p>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

export function getReservationHeading() {
  return '预定信息';
}

export function ReservationDetails({ event, showContext = false }) {
  if (!event.reservation) {
    const pending = event.reservationStatus === '未预定';

    return (
      <div className={`reservation-state${pending ? ' is-pending' : ''}`}>
        <strong>{pending ? '未预定' : '无需预定'}</strong>
        <p>{pending ? '预定方式和凭证将在这里补充。' : '此项行程没有预定信息。'}</p>
      </div>
    );
  }

  const fields = event.infoType === 'flight'
    ? [

        ['航班号', event.reservation.flightNumber],

        ['航班时间', event.reservation.time],

      ]
    : [
        ['查看预订', event.reservation.reference],
        ['使用时间', event.reservation.time],
        ['使用方式', event.reservation.instruction],
      ];

  return (
    <div className={`reservation-details${showContext ? '' : ' is-embedded'}`}>
      <div className="reservation-copy">
        {showContext && (
          <>
            <span>{event.type}</span>
            <h3>{event.title}</h3>
          </>
        )}
        <dl className="info-card__details">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value ?? '待补充'}</dd>
            </div>
          ))}
        </dl>
        <BookingAccess access={event.bookingAccess} />
      </div>
    </div>
  );
}

export function ReservationModal({ event, onClose }) {
  useModalBehavior(onClose);
  const heading = getReservationHeading(event);

  return (
    <div className="modal-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <section aria-labelledby="reservation-modal-title" aria-modal="true" className="journey-modal reservation-modal" role="dialog">
        <header className="journey-modal__header">
          <div>
            <p>{event.infoType === 'flight' ? 'Flight' : 'Reservation'}</p>
            <h2 id="reservation-modal-title">{heading}</h2>
          </div>
          <button aria-label={`关闭${heading}`} autoFocus onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </header>
        <ReservationDetails event={event} showContext />
      </section>
    </div>
  );
}

export function EventFlightDetails({ event }) {
  return (
    <div className="flight-itinerary day-event-card__flight">
      {event.flightLegs.map((leg, index) => (
        <div key={`${event.id}-${leg.from}-${leg.depart}`}>
          <div className="flight-leg">
            <span>{leg.depart}</span>
            <strong>{leg.from} → {leg.to}</strong>
            <span>{leg.arrive}</span>
            <FlightLegCaption text={leg.code} />
          </div>
          {index < event.flightLegs.length - 1 && event.flightConnections?.[index] && (
            <div className="connection-note">{event.flightConnections[index]}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function DayEventCard({ event, onOpenReservation }) {
  return <EventCard event={event} onOpenReservation={onOpenReservation}
    title={<CopyableEventTitle className="day-event-card__title-row" event={event} />}>
    {event.flightLegs ? <EventFlightDetails event={event} /> : <p className="event-description">{event.detail}</p>}
  </EventCard>;
}
