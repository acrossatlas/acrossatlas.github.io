import ChecklistGroup from './components/ChecklistGroup';
import ThemeToggle from './components/ThemeToggle';
import { ArrowIcon, CloseIcon, CopyableAddress, CopyableEventTitle, EventFlightDetails, FlightLegCaption, getReservationHeading, ReservationDetails, ReservationModal, useModalBehavior } from './components/JourneyEvents';
import TemplatesPage from './components/TemplatesPage';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DayItinerary from './components/DayItinerary';
import DayTabs from './components/DayTabs';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { journeys, archiveDateRange, tripUrl, findJourney } from './data/archive';
import { dateFromKey, getJourneyDayCount, resolveJourneyDayIndex } from './lib/journey-dates';
import { ArchivePanel } from './components/ArchiveCards';
import CountryArchivePage from './components/CountryArchivePage';
import { createLocalNotebook, useNotebook } from './lib/use-notebook.js';
import { useNotebookCatalog } from './lib/use-notebook-catalog.js';
import { NewTripDialog, SectionDialog, TripDatesDialog } from './components/TripSettings';
import { deleteEvent, journeyFromNotebook, reorderEvent, resizeNotebookDates, saveEvent } from './lib/notebook.js';
import ItineraryEditor from './components/ItineraryEditor';
import ChecklistEditor from './components/ChecklistEditor';
import NotebookAlbum from './components/NotebookAlbum';
import NotebookOptions, { versionName } from './components/NotebookOptions';

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
  if (!event.startsAt) return event.timeNote || '时间待定';
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
        <h2>{journey.title ?? journey.destinations.join(' ')}</h2>
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
  const catalog = useNotebookCatalog();
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('log') === 'trip' ? 'trip' : 'map';
  const ongoingJourney = catalog.journeys.find(journey => isJourneyOngoing(journey));
  const setActiveTab = tab => setSearchParams({ log: tab }, { preventScrollReset: true });

  return (
    <div className={`page home-page${ongoingJourney ? '' : ' home-page--archive'}`}>
      <nav className="home-navigation" aria-label="主导航">
        <button className="theme-toggle" type="button" aria-label="新建旅行" title="新建旅行" onClick={() => setCreating(true)}><PlusIcon /></button>
        <Link className="home-template-link" to="/templates" aria-label="打开旅行模板" title="模板">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.6663 4C11.4027 4 12.0003 4.5976 12.0003 5.33398V11.334H10.6663V6.27734L4.47198 12.4717L3.52863 11.5283L9.72296 5.33398H4.66632V4H10.6663Z" fill="currentColor" /></svg>
        </Link>
      </nav>
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

          <ArchivePanel type={activeTab} records={catalog.journeys} />
        </section>
      </main>
      {creating && <NewTripDialog onClose={() => setCreating(false)} onCreate={async seed => { await createLocalNotebook(seed); navigate(`/trips/${seed.id}`); }} />}
    </div>
  );
}

function CurrentIndicator({ visible }) {
  return visible ? <span className="info-card__current">当前</span> : null;
}

function LocationCardTitle({ record }) {
  return (
    <div className="info-card__title-block">
      <h3>{record.title}</h3>
      <CopyableAddress label={record.addressLabel ?? '住宿地址'} value={record.navigation} />
    </div>
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

function JourneyPage({ journey: originalJourney }) {
  const notebook = useNotebook(originalJourney);
  const book = notebook.record?.document ?? notebook.seed;
  const journey = journeyFromNotebook(book, originalJourney);
  const [editor, setEditor] = useState(null), [checklistEditor, setChecklistEditor] = useState(null);
  const [editingName, setEditingName] = useState(false), [nameDraft, setNameDraft] = useState(book.title), [datesOpen, setDatesOpen] = useState(false), [sectionEditor, setSectionEditor] = useState(null);
  async function saveName() {
    const title = nameDraft.trim();
    if (!title) { setNameDraft(book.title); setEditingName(false); return; }
    if (title !== book.title) await notebook.commit(book => ({ ...book, title }), '修改旅行名称');
    setEditingName(false);
  }
  async function saveSection(name, remove = false) {
    await notebook.commit(book => {
      const next = structuredClone(book); next.sectionLabels ??= { ...journey.sectionLabels };
      if (remove) delete next.sectionLabels[sectionEditor.key]; else next.sectionLabels[sectionEditor.key] = name;
      return next;
    }, remove ? '删除日期分隔' : '修改日期分隔');
  }
  function openEditor(dayId, event) {
    const country = book.days.find(day => day.id === dayId)?.events.find(event => event.country)?.country;
    setEditor({ dayId, event, country, id: event?.id ?? crypto.randomUUID(), groupId: crypto.randomUUID(), revision: notebook.current.current.localRevision });
  }
  function requireUnchanged(revision) {
    if (notebook.current.current.localRevision !== revision) throw new Error('内容已在另一页面发生变化。本次修改尚未保存，请保留输入并重新核对。');
  }
  async function saveItinerary(dayId, fields, revision, files) {
    requireUnchanged(revision);
    const record = await notebook.commit(book => saveEvent(book, dayId, fields, editor.id, !editor.event), editor.event ? `修改 ${editor.event.title}` : `添加 ${fields.title}`, files, { groupId: editor.groupId });
    setActiveDay(journey.dates.findIndex(day => day.key === dayId));
    return record.localRevision;
  }
  async function removeItinerary(revision) {
    requireUnchanged(revision);
    if (!notebook.current.current.document.days.some(day => day.events.some(event => event.id === editor.id))) return;
    await notebook.commit(book => deleteEvent(book, editor.id), '删除行程');
  }
  function openChecklist(variant, groupId, item) {
    setChecklistEditor({ variant, groupId, item, id: item?.id ?? crypto.randomUUID(), sessionId: crypto.randomUUID(), revision: notebook.current.current.localRevision });
  }
  async function saveChecklist(fields, revision, remove = false) {
    requireUnchanged(revision);
    const record = await notebook.commit(book => {
      const next = structuredClone(book), { variant, groupId, id } = checklistEditor;
      const section = next.checklist.find(group => group.variant === variant);
      const container = groupId ? section.groups.find(group => group.id === groupId) : section;
      if (remove) container.items = container.items.filter(entry => entry.id !== id);
      else if (container.items.some(entry => entry.id === id)) Object.assign(container.items.find(entry => entry.id === id), fields);
      else container.items.push({ id, checked: false, ...fields });
      return next;
    }, remove ? '删除清单条目' : '修改清单条目', [], remove ? {} : { groupId: checklistEditor.sessionId });
    return record.localRevision;
  }

  const archived = journey.status === 'completed';
  const { dates: journeyDates, dayEvents: journeyDayEvents, sectionLabels: journeySectionLabels } = journey;
  const [searchParams, setSearchParams] = useSearchParams();
  const [openPanel, setOpenPanel] = useState(null);
  const [openMapStop, setOpenMapStop] = useState(null);
  const [openReservation, setOpenReservation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(() => new Date());

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

  return (
    <div className={`page ongoing-page${archived ? ' archived-journey-page' : ''}`}>
      <main className="ongoing-shell">
        <header className="notebook-header">
          <SiteTitle linked />
          <div className="journey-overview">
            <div className="journey-heading">
              <div className="journey-heading__title">
                <h1>{editingName ? <input className="notebook-title-input" aria-label="旅行名称" autoFocus required maxLength={500} value={nameDraft} onChange={e => setNameDraft(e.target.value)} onBlur={() => saveName().catch(() => {})} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } if (e.key === 'Escape') setEditingName(false); }} /> : <button className="notebook-title-button" type="button" aria-label="修改旅行名称" disabled={!notebook.record || notebook.busy} onClick={() => { setNameDraft(book.title); setEditingName(true); }}>{journey.title ?? journey.destinations.join(' ')}</button>}</h1>
              </div>
              <p className="journey-archive-meta"><button className="notebook-date-button" type="button" aria-label="修改旅行日期" disabled={!notebook.record || notebook.busy} onClick={() => setDatesOpen(true)}>{archiveDateRange(book.startsOn, book.endsOn)}</button></p>
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
              <NotebookOptions notebook={notebook} />
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

        {notebook.error && <p className="notebook-editor__error" role="alert">{notebook.error}</p>}
        {notebook.record?.checkout && <div className="notebook-version-notice notebook-version-notice--page" role="status">
          <span>正在查看{versionName(notebook.record.current)}</span>
          <button className="journey-tool-button" type="button" disabled={notebook.busy} onClick={() => notebook.switchVersion(notebook.record.checkout.latest.id).catch(() => {})}>回到最新</button>
        </div>}
        <span className="sr-only" role="status">{notebook.busy ? '正在保存修改' : notebook.record?.updatedAt ? '修改已保存在本机' : ''}</span>
        <div className="notebook-content">
          {!archived && <section className="notebook-section" aria-label="当日行程">
            <TodayFocusCard
              dayIndex={todayIndex}
              focus={todayFocus}
            />
          </section>}

          <section className="notebook-section" aria-label="所有行程">
            <div className="notebook-day-nav"><DayTabs days={journeyDates} activeIndex={activeDay} onSelect={setActiveDay} sectionLabels={journeySectionLabels} dividers={journey.sectionDividers} onEditSection={setSectionEditor} /><button className="journey-tool-button notebook-section-add" type="button" aria-label="添加日期分隔" title="在当前日期前添加分隔" disabled={!notebook.record || notebook.busy} onClick={() => setSectionEditor(journeyDates[activeDay])}><Plus size={15} aria-hidden="true" /><span>分隔</span></button></div>
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
                  originalEvents={notebook.seed.days.find(original => original.date === day.key)?.events ?? []}
                  busy={!notebook.record || notebook.busy}
                  bookId={book.id}
                  genericMap={Boolean(originalJourney.localOnly) || book.startsOn !== originalJourney.startsOn || !originalJourney.dates.some(original => original.key === day.key)}
                  onEdit={event => openEditor(day.key, event)}
                  onReorder={(id, target, position) => notebook.commit(book => reorderEvent(book, day.key, id, target, position), '拖动调整行程顺序')}
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
              {book.checklist.map(section => <ChecklistGroup key={section.variant} {...section} persist={false} controlled disabled={!notebook.record || notebook.busy}
                onToggle={(id, checked) => notebook.commit(book => {
                  const next = structuredClone(book), group = next.checklist.find(group => group.variant === section.variant);
                  (group.groups?.flatMap(group => group.items) ?? group.items).find(item => item.id === id).checked = checked;
                  return next;
                }, checked ? '勾选清单' : '取消勾选清单').catch(() => {})}
                onEdit={(item, groupId) => openChecklist(section.variant, groupId, item)}
                onAdd={groupId => openChecklist(section.variant, groupId)} />)}
            </div>
          </section>

          <NotebookAlbum book={book} activeDate={journeyDates[activeDay].key} busy={!notebook.record || notebook.busy} onCommit={notebook.commit} />
        </div>
      </main>
      {datesOpen && <TripDatesDialog startsOn={book.startsOn} endsOn={book.endsOn} onClose={() => setDatesOpen(false)} onSave={async (start, end) => { await notebook.commit(book => resizeNotebookDates({ ...book, sectionLabels: book.sectionLabels ?? journey.sectionLabels, sectionDividers: book.sectionDividers ?? journey.sectionDividers }, start, end), '修改旅行日期'); }} />}
      {sectionEditor && <SectionDialog day={sectionEditor} name={journey.sectionLabels[sectionEditor.key] ?? ''} onClose={() => setSectionEditor(null)} onSave={name => saveSection(name)} onDelete={() => saveSection('', true)} />}
      {editor && <ItineraryEditor key={editor.id} selection={editor} book={book} onClose={() => setEditor(null)} onSave={saveItinerary} onDelete={removeItinerary} />}
      {checklistEditor && <ChecklistEditor key={checklistEditor.id} selection={checklistEditor} onClose={() => setChecklistEditor(null)} onSave={(fields, revision) => saveChecklist(fields, revision)} onDelete={revision => saveChecklist(null, revision, true)} />}
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
  const catalog = useNotebookCatalog();
  if (catalog.deletedIds.includes(tripId)) return <Navigate replace to="/?log=trip" />;
  const journey = findJourney(tripId) ?? catalog.journeys.find(journey => journey.id === tripId);
  if (!journey && catalog.loading) return <div className="page"><main className="ongoing-shell"><SiteTitle linked /></main></div>;
  if (!journey) return <div className="page"><main className="ongoing-shell"><SiteTitle linked /><h1>尚未收录这次旅行</h1></main></div>;
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
      <div className="site-corner"><ThemeToggle /></div>
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
