import { useId, useState } from 'react';
import { archiveCountries, tripLogRecords } from '../data/archive';
import { getJourneyDayCount } from '../lib/journey-dates';
import { getTripSummary } from '../lib/trip-summary';
import { readableDateRange } from '../lib/date-format';

const countryByCode = new Map(archiveCountries.map(country => [country.code, country]));
// Dated stays per country and year, oldest first, for the Travel by year tooltip.
const staysFor = (completed, code, year) => completed.flatMap(journey => (journey.visits ?? [])
  .filter(visit => visit.country === code && visit.startsOn?.startsWith(String(year)))
  .map(visit => [visit.startsOn, visit.endsOn ?? visit.startsOn]))
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([startsOn, endsOn]) => readableDateRange(startsOn, endsOn));

const YEAR_ROWS = 4;
const DOTS_PER_YEAR = 16;
function TripCountCard({ summary, completed }) {
  const daysOnTheRoad = completed.reduce((total, journey) => total + getJourneyDayCount(journey), 0);
  const countriesVisited = new Set(completed.flatMap(journey => journey.countries ?? [])).size;
  return <article className="stat-card trip-summary-card summary-trip-count">
    <h3>Trips</h3>
    <strong>{summary.tripCount}</strong>
    <p className="summary-trip-count__note">
      <span>{daysOnTheRoad} {daysOnTheRoad === 1 ? 'day' : 'days'} traveled</span>
      <span>{countriesVisited} {countriesVisited === 1 ? 'country' : 'countries'}</span>
    </p>
  </article>;
}

function TravelYearsCard({ summary, completed }) {
  const firstYear = summary.years.at(-1)?.year ?? new Date().getFullYear();
  const lastYear = Math.max(firstYear + YEAR_ROWS - 1, summary.years[0]?.year ?? firstYear);
  const yearRows = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
    const year = firstYear + index, record = summary.years.find(item => item.year === year);
    return { year, trips: record?.count ?? 0, destinations: (record?.countries ?? []).map(code => ({ year, code, name: countryByCode.get(code)?.name ?? code, dates: staysFor(completed, code, year) })) };
  });
  const tooltipId = useId();
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const inspected = hovered ?? focused;
  const inspect = (destination, button) => {
    const card = button.closest('.summary-years').getBoundingClientRect();
    const dot = button.getBoundingClientRect();
    const below = dot.bottom - card.top + 8;
    return { ...destination, left: Math.max(84, Math.min(card.width - 84, dot.left - card.left + dot.width / 2)), top: below + 60 > card.height - 8 ? dot.top - card.top - 60 : below };
  };

  return <article className="stat-card trip-summary-card summary-years">
    <header className="summary-years__header">
      <h3>Travel by year</h3>
      <span>{firstYear} – {lastYear}</span>
    </header>
    <div className="summary-years__rows" role="group" aria-label="Countries visited by departure year">
      {yearRows.map(({ year, trips, destinations }) => <div className={`summary-years__row${trips ? ' has-trips' : ''}`} key={year}>
        <span className="summary-years__year">{year}</span>
        <div className="summary-years__track">
          {Array.from({ length: DOTS_PER_YEAR }, (_, index) => {
            const destination = destinations[index];
            if (!destination) return <span className="summary-years__cell" aria-hidden="true" key={`empty-${index}`}><span className="summary-years__dot" /></span>;
            const key = `${destination.year}-${destination.code}`;
            return <button className="summary-years__cell is-lit" type="button" key={key}
              aria-label={`${destination.name} · ${destination.dates.join(', ') || destination.year}`}
              aria-describedby={inspected?.key === key ? tooltipId : undefined}
              onMouseEnter={event => setHovered({ ...inspect(destination, event.currentTarget), key })}
              onMouseLeave={() => setHovered(null)}
              onFocus={event => setFocused({ ...inspect(destination, event.currentTarget), key })}
              onBlur={() => setFocused(null)}
              onKeyDown={event => { if (event.key === 'Escape') { setHovered(null); setFocused(null); } }}>
              <span className="summary-years__dot" aria-hidden="true" />
            </button>;
          })}
        </div>
        <span className="summary-years__total">{destinations.length || '–'}</span>
      </div>)}
    </div>
    {inspected && <div className="summary-years__tooltip" id={tooltipId} role="tooltip" style={{ left: inspected.left, top: inspected.top }}>
      <strong>{inspected.name}</strong>{inspected.dates.length ? inspected.dates.map(date => <span key={date}>{date}</span>) : <span>{inspected.year}</span>}
    </div>}
  </article>;
}

function TravelSeasonCard({ summary }) {
  const favourite = summary.favouriteSeasons;
  const single = favourite.length === 1 ? favourite[0] : null;
  return <article className={`stat-card trip-summary-card summary-season${single ? ` summary-season--${single.id}` : ''}`}>
    <h3>Top travel season</h3>
    <div className="summary-season__value">
      <strong>{single?.label ?? (favourite.length === 4 ? 'All seasons' : favourite.length ? 'Mixed' : '—')}</strong>
      <span>{single ? single.range.replace(' — ', ' – ') : favourite.map(season => season.label).join(' · ') || 'A season to discover'}</span>
    </div>
    <ol className="summary-season__scale" aria-label="Trips by departure season">
      {summary.seasons.map(season => <li className={favourite.some(item => item.id === season.id) ? 'is-top' : ''} data-season={season.id} key={season.id}
        aria-label={`${season.label}: ${season.days} ${season.days === 1 ? 'day' : 'days'} traveled`}>
        <span aria-hidden="true">{season.label.slice(0, 3)}</span>
      </li>)}
    </ol>
  </article>;
}

export default function TripSummary({ records = tripLogRecords }) {
  const completed = records.filter(journey => journey.status === 'completed');
  const summary = getTripSummary(completed);
  return <div className="trip-summary">
    <TripCountCard summary={summary} completed={completed} />
    <TravelYearsCard summary={summary} completed={completed} />
    <TravelSeasonCard summary={summary} />
  </div>;
}
