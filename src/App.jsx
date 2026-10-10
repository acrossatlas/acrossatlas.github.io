import ChecklistGroup from './components/ChecklistGroup';
import EventCard from './components/EventCard';
import TemplatesPage from './components/TemplatesPage';
import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
const DayRouteMap = lazy(() => import('./components/DayRouteMap'));
import { Link, Navigate, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { journeys, archiveDateRange, tripUrl, findJourney } from './data/archive';
import { dateFromKey, getJourneyDayCount, resolveJourneyDayIndex } from './lib/journey-dates';
import { ArchivePanel } from './components/ArchiveCards';
import CountryArchivePage from './components/CountryArchivePage';

const infoPanels = {
  transport: {
    label: '交通',
    title: '交通信息',
  },
  stay: {
    label: '住宿',
    title: '住宿信息',
  },
};

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isJourneyOngoing(journey, today = new Date()) {
  if (journey.status === 'completed') return false;
  const todayKey = getLocalDateKey(today);
  const previewStart = dateFromKey(journey.startsOn);
  previewStart.setUTCMonth(previewStart.getUTCMonth() - 2);
  const previewStartKey = previewStart.toISOString().slice(0, 10);

  return todayKey >= previewStartKey && todayKey <= journey.endsOn;
}

function getFocusedJourneyDayIndex(journey, dates, now = new Date()) {
  const todayKey = getLocalDateKey(now);

  if (todayKey < journey.startsOn || todayKey > journey.endsOn) return 0;

  const todayIndex = dates.findIndex((date) => date.key === todayKey);
  return todayIndex >= 0 ? todayIndex : 0;
}

function getJourneyProgress(journey, now = new Date()) {
  const dayCount = getJourneyDayCount(journey);
  const todayKey = getLocalDateKey(now);

  if (todayKey < journey.startsOn) return { currentDay: 1, dayCount };
  if (todayKey > journey.endsOn) return { currentDay: dayCount, dayCount };

  const start = dateFromKey(journey.startsOn);
  const today = dateFromKey(todayKey);
  return {
    currentDay: Math.round((today - start) / 86400000) + 1,
    dayCount,
  };
}

function timeToMinutes(time) {
  if (!/^\d{2}:\d{2}$/.test(time ?? '')) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getCurrentEventFocus(events, now = new Date(), dayKey) {
  if (!events?.length) return null;

  const todayKey = getLocalDateKey(now);
  if (dayKey && todayKey !== dayKey) {
    return {
      event: events[0],
      status: '接下来',
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledEvents = events.filter((event) => (
    timeToMinutes(event.startsAt) !== null && timeToMinutes(event.endsAt) !== null
  ));

  const current = scheduledEvents.find((event) => (
    currentMinutes >= timeToMinutes(event.startsAt) && currentMinutes < timeToMinutes(event.endsAt)
  ));
  if (current) return { event: current, status: '接下来' };

  const upcoming = scheduledEvents.find((event) => currentMinutes < timeToMinutes(event.startsAt));
  if (upcoming) return { event: upcoming, status: '接下来' };

  if (scheduledEvents.length > 0) {
    return { event: scheduledEvents.at(-1), status: '接下来' };
  }

  return { event: events[0], status: '接下来' };
}

function formatEventTime(event) {
  const displayEnd = event.displayEndsAt ?? event.endsAt;
  if (!displayEnd) return event.startsAt;
  return `${event.startsAt} — ${displayEnd}`;
}

function formatDateRange(journey) {
  return `${formatShortDate(journey.startsOn)} — ${formatShortDate(journey.endsOn)}`;
}

function formatShortDate(dateKey) {
  const [, month, day] = dateKey.split('-');
  return `${month}.${day}`;
}

function formatRecordRange(record) {
  const start = formatShortDate(record.startsOn);
  const end = formatShortDate(record.endsOn);
  return start === end ? start : `${start} — ${end}`;
}

function getRelevantRecordId(records, today = new Date()) {
  const todayKey = getLocalDateKey(today);
  const current = records.find((record) => todayKey >= record.startsOn && todayKey <= record.endsOn);

  if (current) return current.id;
  return records.find((record) => record.startsOn > todayKey)?.id ?? records[0]?.id;
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h13M14 7l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z" />
    </svg>
  );
}

function TransportIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 20H5V21C5 21.5523 4.55228 22 4 22H3C2.44772 22 2 21.5523 2 21V12L4.51334 5.29775C4.80607 4.51715 5.55231 4 6.386 4H17.614C18.4477 4 19.1939 4.51715 19.4867 5.29775L22 12V21C22 21.5523 21.5523 22 21 22H20C19.4477 22 19 21.5523 19 21V20ZM4.136 12H19.864L17.614 6H6.386L4.136 12ZM6.5 17C7.32843 17 8 16.3284 8 15.5C8 14.6716 7.32843 14 6.5 14C5.67157 14 5 14.6716 5 15.5C5 16.3284 5.67157 17 6.5 17ZM17.5 17C18.3284 17 19 16.3284 19 15.5C19 14.6716 18.3284 14 17.5 14C16.6716 14 16 14.6716 16 15.5C16 16.3284 16.6716 17 17.5 17Z" />
    </svg>
  );
}

function StayIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.48907C3 9.18048 3.14247 8.88917 3.38606 8.69972L11.3861 2.47749C11.7472 2.19663 12.2528 2.19663 12.6139 2.47749L20.6139 8.69972C20.8575 8.88917 21 9.18048 21 9.48907V20ZM11 13V19H13V13H11Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m9.5 14.5 5-5M7.7 16.3l-1.2 1.2a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M16.3 7.7l1.2-1.2a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}


function MapPinIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11 19.9451C6.50005 19.4476 3 15.6326 3 11C3 6.02944 7.02944 2 12 2C16.9706 2 21 6.02944 21 11C21 15.6326 17.5 19.4476 13 19.9451V24H11V19.9451Z" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 12h12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 12h12M12 6v12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function SiteTitle({ linked = false }) {
  const title = <span>across</span>;

  return (
    <header className="title-row">
      {linked ? <Link to="/" aria-label="across home">{title}</Link> : <h1>{title}</h1>}
    </header>
  );
}

function CurrentJourneyCard({ journey }) {
  const { currentDay, dayCount } = getJourneyProgress(journey);

  return (
    <Link className="current-journey" to={tripUrl(journey)} aria-label="Open the ongoing journey">
      <div className="current-journey__copy">
        <h2>{journey.destinations.join(' ')}</h2>
        <p className="current-journey__dates">
          <span>{formatDateRange(journey)}</span>
          <span>Day {currentDay} of {dayCount}</span>
        </p>
      </div>
      <span className="current-journey__action">Ongoing <ArrowIcon /></span>
    </Link>
  );
}

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('log') === 'trip' ? 'trip' : 'map';
  const ongoingJourney = journeys.find(journey => isJourneyOngoing(journey));
  const setActiveTab = tab => setSearchParams({ log: tab }, { preventScrollReset: true });

  return (
    <div className={`page home-page${ongoingJourney ? '' : ' home-page--archive'}`}>
      <nav className="home-navigation" aria-label="主导航"><Link to="/templates">模板 ↗</Link></nav>
      <main>
        <section className="home-hero" aria-labelledby="home-title">
          <h1 id="home-title">across</h1>
          {ongoingJourney && (
            <div className="ongoing-slot" aria-label="Ongoing journey">
              <CurrentJourneyCard journey={ongoingJourney} />
            </div>
          )}
        </section>
        <section className="archive-section" aria-label="Travel logs">
          <div className="log-tabs" role="tablist" aria-label="Travel logs">
            <button
              aria-controls="map-panel"
              aria-selected={activeTab === 'map'}
              className={activeTab === 'map' ? 'is-active' : ''}
              id="map-tab"
              onClick={() => setActiveTab('map')}
              role="tab"
              type="button"
            >
              Map log
            </button>
            <button
              aria-controls="trip-panel"
              aria-selected={activeTab === 'trip'}
              className={activeTab === 'trip' ? 'is-active' : ''}
              id="trip-tab"
              onClick={() => setActiveTab('trip')}
              role="tab"
              type="button"
            >
              Trip log
            </button>
          </div>

          <ArchivePanel type={activeTab} />
        </section>
      </main>
    </div>
  );
}

function useModalBehavior(onClose) {
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

function CurrentIndicator({ visible }) {
  return visible ? <span className="info-card__current">当前</span> : null;
}

function CopyableAddress({ label, value }) {
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

function LocationCardTitle({ record }) {
  return (
    <div className="info-card__title-block">
      <h3>{record.title}</h3>
      <CopyableAddress label={record.addressLabel ?? '住宿地址'} value={record.navigation} />
    </div>
  );
}

function FlightLegCaption({ text }) {
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

function TransportCard({ record, isRelevant }) {
  return (
    <article className="info-card transport-card" data-relevant={isRelevant || undefined}>
      <header className="info-card__meta">
        <div>
          <span>{record.kind}</span>
        </div>
        <CurrentIndicator visible={isRelevant} />
      </header>
      <p className="info-card__date">{formatRecordRange(record)}</p>
      {record.navigation ? <LocationCardTitle record={record} /> : <h3>{record.title}</h3>}

      {record.legs ? (
        <div className="flight-itinerary">
          {record.legs.map((leg, index) => {
            const connection = record.connections?.[index] ?? record.connection;

            return (
              <div key={`${record.id}-${leg.from}-${leg.depart}`}>
                <div className="flight-leg">
                  <span>{leg.depart}</span>
                  <strong>{leg.from} → {leg.to}</strong>
                  <span>{leg.arrive}</span>
                  <FlightLegCaption text={leg.code} />
                </div>
                {index < record.legs.length - 1 && connection && (
                  <p className="connection-note">{connection}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <dl className="info-card__details">
          {record.details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

function StayCard({ record, isRelevant }) {
  return (
    <article className="info-card stay-card" data-relevant={isRelevant || undefined}>
      <header className="info-card__meta">
        <span>{formatRecordRange(record)}</span>
        <CurrentIndicator visible={isRelevant} />
      </header>
      <LocationCardTitle record={record} />
      <dl className="info-card__details">
        <div>
          <dt>入住</dt>
          <dd>{record.checkIn}</dd>
        </div>
        <div>
          <dt>退房</dt>
          <dd>{record.checkOut}</dd>
        </div>
        <div>
          <dt>预定</dt>
          <dd>{record.reservation}</dd>
        </div>
        <div>
          <dt>备注</dt>
          <dd>{record.note}</dd>
        </div>
      </dl>
    </article>
  );
}

function InfoModal({ panel, records, archived, onClose }) {
  const copy = infoPanels[panel];
  const relevantId = archived ? null : getRelevantRecordId(records);
  const relevantRecord = records.find((record) => record.id === relevantId);
  const orderedRecords = relevantRecord
    ? [relevantRecord, ...records.filter((record) => record.id !== relevantId)]
    : records;

  useModalBehavior(onClose);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        aria-labelledby={`${panel}-modal-title`}
        aria-modal="true"
        className="journey-modal"
        id={`${panel}-modal`}
        role="dialog"
      >
        <header className="journey-modal__header">
          <div>
            <p>{panel === 'transport' ? 'Transport' : 'Stay'}</p>
            <h2 id={`${panel}-modal-title`}>{copy.title}</h2>
          </div>
          <button aria-label={`关闭${copy.label}信息`} autoFocus onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </header>
        <div className="journey-modal__body">
          <div className="journey-modal__list">
            {orderedRecords.map((record) => panel === 'transport' ? (
              <TransportCard isRelevant={record.id === relevantId} key={record.id} record={record} />
            ) : (
              <StayCard isRelevant={record.id === relevantId} key={record.id} record={record} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <header className="notebook-section__heading">
      <h2>{children}</h2>
    </header>
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

function CopyableEventTitle({ className, event }) {
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

function getReservationHeading() {
  return '预定信息';
}

function ReservationDetails({ event, showContext = false }) {
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

function ReservationModal({ event, onClose }) {
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

function MapStopModal({ onClose, selection }) {
  const { event, stop } = selection;
  useModalBehavior(onClose);

  return (
    <div className="modal-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <section aria-labelledby="map-stop-modal-title" aria-modal="true" className="journey-modal map-stop-modal" role="dialog">
        <header className="journey-modal__header">
          <div>
            <p>Map stop</p>
            <h2 id="map-stop-modal-title">{stop.name}</h2>
          </div>
          <button aria-label="关闭停靠点详情" autoFocus onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </header>
        <div className="map-stop-modal__body">
          <article className="map-stop-modal__main">
            <div className="map-stop-modal__meta">
              <span>时间待补充</span>
              <span>{event.type}</span>
            </div>
            <CopyableEventTitle className="map-stop-modal__title-row" event={event} />
            <p className="event-description">{event.detail}</p>
            <div className="map-stop-modal__alerts">
              {event.reservationStatus === '未预定' && <span className="event-alert-tag">未预定</span>}
              {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
            </div>
          </article>
          <section className="map-stop-modal__reservation" aria-labelledby="map-stop-reservation-title">
            <header>
              <span>{event.infoType === 'flight' ? 'Flight' : 'Reservation'}</span>
              <h3 id="map-stop-reservation-title">{getReservationHeading(event)}</h3>
            </header>
            <ReservationDetails event={event} />
          </section>
        </div>
      </section>
    </div>
  );
}

function EventFlightDetails({ event }) {
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

function DayEventCard({ event, onOpenReservation }) {
  return <EventCard event={event} onOpenReservation={onOpenReservation}
    title={<CopyableEventTitle className="day-event-card__title-row" event={event} />}>
    {event.flightLegs ? <EventFlightDetails event={event} /> : <p className="event-description">{event.detail}</p>}
  </EventCard>;
}

function TodayFocusCard({ dayIndex, focus }) {
  if (!focus) return null;

  const { event } = focus;
  const hasAlerts = event.reservationStatus === '未预定' || event.paymentStatus === '未付款';

  return (
    <article className="today-focus">
      <div className="today-focus__meta">
        <div className="today-focus__schedule">
          <span>Day {dayIndex + 1}</span>
          <span>{formatEventTime(event)}</span>
        </div>
        <span className="today-focus__type">{event.type}</span>
      </div>
      {hasAlerts && (
        <div className="today-focus__signals">
          {event.reservationStatus === '未预定' && <span className="event-alert-tag">未预定</span>}
          {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
        </div>
      )}
      <CopyableEventTitle className="today-focus__title-row" event={event} />
      {event.flightLegs ? <EventFlightDetails event={event} /> : <p className="event-description">{event.detail}</p>}
    </article>
  );
}

function DayItinerary({ day, events, searchQuery, onOpenReservation, onOpenStop }) {
  const query = searchQuery.trim().toLocaleLowerCase();
  const visibleEvents = query ? events.filter(event => (
    [event.title, event.detail, event.type, event.navigation].some(value => value?.toLocaleLowerCase().includes(query))
  )) : events;
  return (
    <div className="day-detail">
      <Suspense fallback={<div className="day-map daily-map__loading">正在加载地图…</div>}><DayRouteMap day={day} events={events} onOpenStop={onOpenStop} /></Suspense>
      <section aria-label={`${day.label} 行程事件`} className="day-events">
        <ol className="day-event-list">
          {visibleEvents.map((event) => (
            <DayEventCard event={event} key={event.id} onOpenReservation={onOpenReservation} />
          ))}
        </ol>
        {query && visibleEvents.length === 0 && <p className="journey-search-empty" role="status">当天没有匹配的行程。</p>}
      </section>
    </div>
  );
}

function JourneyPage({ journey }) {
  const archived = journey.status === 'completed';
  const { dates: journeyDates, dayEvents: journeyDayEvents, sectionLabels: journeySectionLabels, documentChecklist, packingChecklistGroups } = journey;
  const [searchParams, setSearchParams] = useSearchParams();
  const [openPanel, setOpenPanel] = useState(null);
  const [openMapStop, setOpenMapStop] = useState(null);
  const [openReservation, setOpenReservation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [tabOverflow, setTabOverflow] = useState({ left: false, right: false });
  const dayTabsRef = useRef(null);

  const todayIndex = getFocusedJourneyDayIndex(journey, journeyDates, now);
  const activeDay = resolveJourneyDayIndex(journeyDates, searchParams.get('date'), archived ? 0 : todayIndex);
  const setActiveDay = index => {
    const next = new URLSearchParams(searchParams);
    next.set('date', journeyDates[index].key);
    setSearchParams(next, { preventScrollReset: true });
  };
  const todayDay = journeyDates[todayIndex];
  const todayEvents = journeyDayEvents[todayDay.key] ?? [];
  const todayFocus = getCurrentEventFocus(todayEvents, now, todayDay.key);

  useEffect(() => {
    if (archived) return undefined;
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, [archived]);

  useEffect(() => {
    const tabList = dayTabsRef.current;
    if (!tabList) return undefined;

    const updateOverflow = () => {
      const next = {
        left: tabList.scrollLeft > 2,
        right: tabList.scrollLeft + tabList.clientWidth < tabList.scrollWidth - 2,
      };
      setTabOverflow((current) => (
        current.left === next.left && current.right === next.right ? current : next
      ));
    };

    updateOverflow();
    tabList.addEventListener('scroll', updateOverflow, { passive: true });
    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(tabList);

    return () => {
      tabList.removeEventListener('scroll', updateOverflow);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const tabList = dayTabsRef.current;
    const selectedTab = document.getElementById(`day-${activeDay + 1}-tab`);

    if (tabList && selectedTab) {
      tabList.scrollTo({
        left: selectedTab.offsetLeft - (tabList.clientWidth - selectedTab.offsetWidth) / 2,
        behavior: 'smooth',
      });
    }
  }, [activeDay]);

  return (
    <div className={`page ongoing-page${archived ? ' archived-journey-page' : ''}`}>
      <main className="ongoing-shell">
        <header className="notebook-header">
          <SiteTitle linked />
          {archived && <Link className="archive-back" to="/?log=trip">← Trip log</Link>}
          <div className="journey-overview">
            <div className="journey-heading">
              <div className="journey-heading__title">
                <h1>{journey.title ?? journey.destinations.join(' ')}</h1>
              </div>
              {archived && <p className="journey-archive-meta">{archiveDateRange(journey.startsOn, journey.endsOn)}<span>已完成</span></p>}
            </div>
            <div className="journey-tools" aria-label="行程工具">
              <button
                aria-label="交通"
                aria-controls="transport-modal"
                aria-expanded={openPanel === 'transport'}
                aria-haspopup="dialog"
                className="journey-tool-button"
                onClick={() => setOpenPanel('transport')}
                type="button"
              >
                <TransportIcon />
                <span>交通</span>
              </button>
              <button
                aria-label="住宿"
                aria-controls="stay-modal"
                aria-expanded={openPanel === 'stay'}
                aria-haspopup="dialog"
                className="journey-tool-button"
                onClick={() => setOpenPanel('stay')}
                type="button"
              >
                <StayIcon />
                <span>住宿</span>
              </button>
              <div className="journey-search">
                <SearchIcon />
                <input
                  aria-label="搜索当日行程"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索当日行程"
                  type="search"
                  value={searchQuery}
                />
                {searchQuery && (
                  <button
                    aria-label="清空搜索"
                    className="journey-search__clear"
                    onClick={() => setSearchQuery('')}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setSearchQuery('');
                    }}
                    type="button"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="notebook-content">
          {!archived && <section className="notebook-section" aria-label="当日行程">
            <TodayFocusCard
              dayIndex={todayIndex}
              focus={todayFocus}
            />
          </section>}

          <section className="notebook-section" aria-label="所有行程">
            <div
              className={`day-tabs${tabOverflow.left ? ' has-left-overflow' : ''}${tabOverflow.right ? ' has-right-overflow' : ''}`}
              ref={dayTabsRef}
              role="tablist"
              aria-label="每日行程"
            >
              {journeyDates.map((day, index) => (
                <Fragment key={day.key}>
                {journeySectionLabels[day.key] && <span className="day-tabs__country" role="presentation">{journeySectionLabels[day.key]}</span>}
                {journey.sectionDividers?.includes(day.key) && <span className="day-tabs__divider" aria-hidden="true" />}
                <button
                  aria-controls={`day-${index + 1}-panel`}
                  aria-selected={activeDay === index}
                  className={activeDay === index ? 'is-active' : ''}
                  id={`day-${index + 1}-tab`}
                  key={day.key}
                  onClick={() => setActiveDay(index)}
                  role="tab"
                  type="button"
                >
                  {day.label}
                </button>
                </Fragment>
              ))}
            </div>
            {journeyDates.map((day, index) => (
              <section
                aria-labelledby={`day-${index + 1}-tab`}
                className="day-panel"
                hidden={activeDay !== index}
                id={`day-${index + 1}-panel`}
                key={`${day.key}-panel`}
                role="tabpanel"
              >
                {activeDay === index && <DayItinerary
                  day={day}
                  events={journeyDayEvents[day.key] ?? []}
                  searchQuery={searchQuery}
                  onOpenReservation={setOpenReservation}
                  onOpenStop={setOpenMapStop}
                />}
              </section>
            ))}
          </section>

          <section className="notebook-section">
            <SectionHeading>Checklist</SectionHeading>
            <div className="checklist-surface">
              <ChecklistGroup storageId={journey.startsOn} items={documentChecklist} title="证件" variant="documents" />
              <ChecklistGroup storageId={journey.startsOn} groups={packingChecklistGroups} title="行李" variant="packing" />
            </div>
          </section>

          <section className="notebook-section" aria-labelledby="album-title">
            <header className="notebook-section__heading">
              <h2 id="album-title">Album</h2>
            </header>
            <div className="album-empty">
              <span className="album-empty__icon"><LinkIcon /></span>
              <div>
                <h3>尚未添加相册链接</h3>
                <p>之后可以在这里关联网盘或其他存储地址。</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      {openPanel && <InfoModal panel={openPanel} records={openPanel === 'transport' ? journey.transportRecords : journey.stayRecords} archived={archived} onClose={() => setOpenPanel(null)} />}
      {openReservation && (
        <ReservationModal event={openReservation} onClose={() => setOpenReservation(null)} />
      )}
      {openMapStop && <MapStopModal onClose={() => setOpenMapStop(null)} selection={openMapStop} />}
    </div>
  );
}

function TripPage() {
  const { tripId } = useParams();
  const journey = findJourney(tripId);
  if (!journey) return <div className="page"><main className="ongoing-shell"><SiteTitle linked /><Link className="archive-back" to="/?log=trip">← Trip log</Link><h1>尚未收录这次旅行</h1></main></div>;
  return <JourneyPage key={journey.id} journey={journey} />;
}

function LegacyJourneyRedirect() {
  const { search } = useLocation();
  const journey = journeys.find(item => isJourneyOngoing(item)) ?? journeys.find(item => item.status === 'completed');
  return <Navigate replace to={journey ? `${tripUrl(journey)}${search}` : '/'} />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ongoing" element={<LegacyJourneyRedirect />} />
        <Route path="/trips/:tripId" element={<TripPage />} />
        <Route path="/countries/:countrySlug" element={<CountryArchivePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default App;
import { CopyIcon, CheckIcon } from './components/CopyIcons';
