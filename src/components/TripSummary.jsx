import { useId, useState } from 'react';
import { Luggage, Snowflake, Sprout, Sun } from 'lucide-react';
import { archiveCountries, journeys } from '../data/archive';
import { getTripSummary } from '../lib/trip-summary';

const summary = getTripSummary(journeys);
const destinations = [...summary.years].reverse().flatMap(({ year, countries }) => countries.map(code => ({
  year, code, name: archiveCountries.find(country => country.code === code)?.name ?? code,
})));

function TravelYearsCard() {
  const tooltipId = useId();
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const inspected = hovered ?? focused;
  const dotCount = Math.max(140, Math.ceil(destinations.length / 20) * 20);
  const inspect = (destination, button) => {
    const card = button.closest('.summary-years').getBoundingClientRect();
    const dot = button.getBoundingClientRect();
    const below = dot.bottom - card.top + 7;
    return { ...destination, left: Math.max(88, Math.min(card.width - 88, dot.left - card.left + dot.width / 2)), top: below + 64 > card.height - 12 ? dot.top - card.top - 64 : below };
  };

  return <article className="trip-summary-card summary-years">
    <h3>Travel by year</h3>
    <div className="summary-years__calendar" role="group" aria-label="Countries visited by departure year">
      {Array.from({ length: dotCount }, (_, index) => {
        const destination = destinations[index];
        if (!destination) return <span className="summary-years__cell" aria-hidden="true" key={`empty-${index}`}><span className="summary-years__dot" /></span>;
        const key = `${destination.year}-${destination.code}`;
        return <button className="summary-years__cell is-lit" type="button" key={key}
          data-year={destination.year} data-country={destination.code}
          aria-label={`${destination.year} · ${destination.name}`}
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
    {inspected && <div className="summary-years__tooltip" id={tooltipId} role="tooltip" style={{ left: inspected.left, top: inspected.top }}>
      <span>{inspected.year}</span><strong>{inspected.name}</strong>
    </div>}
  </article>;
}

function SeasonMotif({ season }) {
  const Icon = { spring: Sprout, summer: Sun, winter: Snowflake }[season];
  if (Icon) return <Icon className="summary-season__icon" aria-hidden="true" strokeWidth={1.5} />;
  return <svg className="summary-season__icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    {season === 'autumn' ? <>
      <path fill="currentColor" d="M32 4L39 19L49 12L46 27L59 25L51 38L56 44L37 47L34 60H30L29 47L10 44L15 38L7 25L20 27L17 12L27 19Z" />
      <path className="summary-season__vein" d="M32 18V47M32 31L23 25M32 39L43 30" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </> : <g fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="32" cy="32" r="22" /><path d="M32 10V54M10 32H54" />
    </g>}
  </svg>;
}

function TravelSeasonCard() {
  const favourite = summary.favouriteSeasons;
  const single = favourite.length === 1 ? favourite[0] : null;
  return <article className="trip-summary-card summary-season">
    <h3>Top travel season</h3>
    <SeasonMotif season={single?.id} />
    <div className="summary-season__value">
      <strong>{single?.label ?? (favourite.length === 4 ? 'All seasons' : favourite.length ? 'Mixed' : '—')}</strong>
      <span>{single ? single.range : favourite.map(season => season.label).join(' · ') || 'A season to discover'}</span>
    </div>
  </article>;
}

export default function TripSummary() {
  return <div className="trip-summary">
    <article className="trip-summary-card summary-trip-count">
      <h3>Trips</h3>
      <strong>{summary.tripCount}</strong>
      <Luggage aria-hidden="true" strokeWidth={1.8} />
    </article>
    <TravelYearsCard />
    <TravelSeasonCard />
  </div>;
}
