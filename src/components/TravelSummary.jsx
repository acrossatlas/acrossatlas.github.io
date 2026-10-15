import { useId, useState } from 'react';
import { Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import DottedWorldMap from './DottedWorldMap';
import CountryTicketPrinter from './CountryTicketPrinter';
import { archiveCountries, countryOnlyVisits, countryVisits, journeys } from '../data/archive';
import { getArchiveSummary } from '../lib/archive-summary';

const summary = getArchiveSummary(journeys, archiveCountries, countryOnlyVisits);

function WorldSummaryCard() {
  const chevronId = useId();

  return <article className="summary-world" aria-label={`Visited continents: ${summary.continents.join(', ') || 'none'}`}>
    <div className="summary-world__face">
      <header className="summary-world__header">
        <div className="summary-world__heading">
          <svg viewBox="0 0 600 24" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
            <defs><pattern id={chevronId} width="14" height="24" patternUnits="userSpaceOnUse"><path d="m10 3-7 9 7 9" /></pattern></defs>
            <rect width="600" height="24" fill={`url(#${chevronId})`} />
          </svg>
          <h3>Continents visited</h3>
        </div>
      </header>
      <div className="summary-world__art" aria-hidden="true">
        <DottedWorldMap continents={summary.continents} landClassName="summary-world__unvisited" highlightClassName="summary-world__visited" />
      </div>
      <div className="summary-world__footer">
        {summary.continents.length ? <ul className="summary-world__continents">
          {summary.continents.map(continent => <li key={continent}>{continent}</li>)}
        </ul> : <span>A world to explore</span>}
      </div>
    </div>
  </article>;
}

function ContinentIcon({ strokeWidth = 2.1, ...props }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m2.5 6 3-2 4 .5 1.5 3-3 2 .5 2.5-2 1.5-1.5-3-2.5-1Z" />
    <path d="m8 14 3 1-1 4-2 2-1-3Z" />
    <path d="m14 4 4-1 3.5 4-1 3-3.5-1-3 2-1.5-4Z" />
    <path d="m14 13 4 .5.5 3.5-2.5 4-2-4Z" />
  </svg>;
}

function CompassTicks() {
  return <svg className="summary-compass__ticks" viewBox="0 0 480 152" preserveAspectRatio="none" aria-hidden="true">
    {Array.from({ length: 39 }, (_, index) => {
      const x = 12 + index * 12;
      const length = index % 5 === 4 ? 16 : 9;
      return <path key={`x-${x}`} d={`M${x} 0v${length}M${x} 152v-${length}`} />;
    })}
    {Array.from({ length: 11 }, (_, index) => {
      const y = 16 + index * 12;
      const length = index === 5 ? 17 : 9;
      return <path key={`y-${y}`} d={`M0 ${y}h${length}M480 ${y}h-${length}`} />;
    })}
  </svg>;
}

function LatitudeCard({ place, direction }) {
  const Tag = place ? Link : 'article';
  const destination = place ? { to: `/countries/${place.country.slug}${place.date && place.journeyId ? `?date=${encodeURIComponent(place.date)}&trip=${encodeURIComponent(place.journeyId)}` : ''}` } : {};
  const latitude = place ? `${Math.abs(place.latitude).toFixed(2)}° ${place.latitude < 0 ? 'S' : 'N'}` : '';
  const label = direction === 'north' ? 'Farthest north' : 'Farthest south';

  return <Tag className={`summary-compass summary-compass--${direction}`} {...destination} aria-label={place ? `${label}: ${place.name}, ${place.country.name}, ${latitude}. ${place.journeyId ? 'Open itinerary' : 'Open country'}` : `${label}: no places yet`}>
    <CompassTicks />
    <span className="summary-compass__direction summary-compass__direction--n" aria-hidden="true">N</span>
    <span className="summary-compass__direction summary-compass__direction--e" aria-hidden="true">E</span>
    <span className="summary-compass__direction summary-compass__direction--s" aria-hidden="true">S</span>
    <span className="summary-compass__direction summary-compass__direction--w" aria-hidden="true">W</span>
    <div className="summary-compass__content">
      <strong>{place?.name ?? '—'}</strong>
      <span>{label}</span>
      {place && <small>{latitude} · {place.country.name}</small>}
    </div>
  </Tag>;
}

export default function TravelSummary() {
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const countries = archiveCountries.filter(country => countryVisits(country.code, journeys, countryOnlyVisits).length);
  const stats = [
    { label: 'Countries', value: summary.countryCount, Icon: Printer, tickets: true },
    { label: 'Continents', value: summary.continentCount, Icon: ContinentIcon },
  ];

  return <><section className="travel-summary" aria-label="Travel overview">
    <WorldSummaryCard />
    <div className="travel-summary__details">
      <dl className="summary-stats">
        {stats.map(({ label, value, Icon, tickets }) => <div className={`summary-stat${tickets ? ' summary-stat--tickets' : ''}`} key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
          <Icon aria-hidden="true" strokeWidth={2.1} />
          {tickets && <button className="summary-stat__trigger" type="button" title="Print country tickets" aria-label={`Print travel tickets for ${value} countries`} aria-haspopup="dialog" aria-expanded={ticketsOpen} disabled={!value} onClick={() => setTicketsOpen(true)} />}
        </div>)}
      </dl>
      <div className="summary-extremes">
        <LatitudeCard place={summary.northernmost} direction="north" />
        <LatitudeCard place={summary.southernmost} direction="south" />
      </div>
    </div>
  </section>
    {ticketsOpen && <CountryTicketPrinter countries={countries} onClose={() => setTicketsOpen(false)} />}
  </>;
}
