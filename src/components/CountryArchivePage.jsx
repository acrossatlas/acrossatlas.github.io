import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { archiveCountries, archiveDateRange, countryItineraryDays, countryOnlyVisits, countryVisits, journeys } from '../data/archive';
import CountryMapCover from './CountryMapCover';
import { ReservationModal } from './JourneyEvents';
import DayTabs from './DayTabs';
import DayItinerary from './DayItinerary';
import { useNotebook } from '../lib/use-notebook.js';
import { useNotebookCatalog } from '../lib/use-notebook-catalog.js';

function SavedCountryDay({ entry, country, onOpenReservation }) {
  const notebook = useNotebook(entry.journey);
  const events = (notebook.record?.document ?? notebook.seed).days.find(day => day.date === entry.day.key)?.events ?? [];
  return <DayItinerary day={entry.day} events={events.filter(event => event.country === undefined || event.country === country)} originalEvents={entry.events} country={country} onOpenReservation={onOpenReservation} />;
}

function CountryArchiveContent({ country }) {
  const catalog = useNotebookCatalog();
  const records = useMemo(() => journeys.filter(journey => !catalog.deletedIds.includes(journey.id)), [catalog.deletedIds.join(',')]);
  const [openReservation, setOpenReservation] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const visits = useMemo(() => countryVisits(country.code, records, countryOnlyVisits), [country.code, records]);
  const days = useMemo(() => countryItineraryDays(country.code, records), [country.code, records]);
  const dates = useMemo(() => days.map(entry => ({ ...entry.day, id: entry.id })), [days]);
  const datedVisits = visits.filter(visit => visit.startsOn && visit.endsOn);
  const first = datedVisits.at(-1), last = datedVisits[0];
  const activeIndex = Math.max(0, days.findIndex(entry => entry.day.key === searchParams.get('date')
    && (!searchParams.get('trip') || entry.journey.id === searchParams.get('trip'))));

  const selectDay = index => {
    const entry = days[index];
    const next = new URLSearchParams(searchParams);
    next.set('date', entry.day.key);
    next.set('trip', entry.journey.id);
    setSearchParams(next, { preventScrollReset: true });
    setOpenReservation(null);
  };

  return <div className="page country-archive-page">
    <main className="ongoing-shell">
      <header className="notebook-header">
        <div className="title-row"><Link to="/" aria-label="across home">across</Link></div>
        <div className="country-archive-heading">
          <h1>{country.name}</h1>
          {first && <p>{archiveDateRange(first.startsOn, last.endsOn)}</p>}
        </div>
      </header>
      {days.length ? <section className="country-archive-itinerary" aria-label={`${country.label}每日行程`}>
        <DayTabs days={dates} activeIndex={activeIndex} onSelect={selectDay} idPrefix="country-day" label={`${country.label}行程日期`} />
        {days.map((entry, index) => <section className="day-panel" role="tabpanel" id={`country-day-${index + 1}-panel`} aria-labelledby={`country-day-${index + 1}-tab`} hidden={index !== activeIndex} key={entry.id}>
          {index === activeIndex && <SavedCountryDay entry={entry} country={country.code} onOpenReservation={setOpenReservation} />}
        </section>)}
      </section> : visits[0] && <div className="country-archive-memory"><CountryMapCover country={country} /></div>}
    </main>
    {openReservation && <ReservationModal event={openReservation} onClose={() => setOpenReservation(null)} />}
  </div>;
}

export default function CountryArchivePage() {
  const { countrySlug } = useParams();
  const country = archiveCountries.find(item => item.slug === countrySlug);
  if (!country) return <div className="page"><main className="ongoing-shell"><div className="title-row"><Link to="/" aria-label="across home">across</Link></div><h1>尚未收录这个国家</h1></main></div>;
  return <CountryArchiveContent key={country.code} country={country} />;
}
