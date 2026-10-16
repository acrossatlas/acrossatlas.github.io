import { useState } from 'react';
import { ArrowDown, ArrowUp, Globe, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import DottedWorldMap from './DottedWorldMap';
import CountryTicketPrinter from './CountryTicketPrinter';
import { archiveCountries, countryOnlyVisits, countryVisits, journeys } from '../data/archive';
import { getArchiveSummary } from '../lib/archive-summary';

const summary = getArchiveSummary(journeys, archiveCountries, countryOnlyVisits);
const CONTINENT_TOTAL = 7;

function WorldSummaryCard() {
  return <article className="stat-card summary-world" aria-label={`Visited continents: ${summary.continents.join(', ') || 'none'}`}>
    <div className="summary-world__panel">
      <header className="summary-world__header">
        <h3>Continents visited</h3>
        <span className="summary-world__count">{summary.continentCount}<small> / {CONTINENT_TOTAL}</small></span>
      </header>
      <div className="summary-world__art" aria-hidden="true">
        <DottedWorldMap continents={summary.continents} landClassName="summary-world__unvisited" highlightClassName="summary-world__visited" />
      </div>
      {summary.continents.length ? <ul className="summary-world__continents">
        {summary.continents.map(continent => <li key={continent}>{continent}</li>)}
      </ul> : <p className="summary-world__empty">A world to explore</p>}
    </div>
  </article>;
}

function StatCard({ label, value, note, Icon, tone, children }) {
  return <div className={`stat-card summary-stat summary-stat--${tone}`}>
    <dt>{label}</dt>
    <dd>{value}</dd>
    {note && <p className="summary-stat__note">{note}</p>}
    <span className="stat-card__icon" aria-hidden="true"><Icon strokeWidth={1.9} /></span>
    {children}
  </div>;
}

// Places the latitude on a pole-to-pole scale so north and south read at a glance.
function LatitudeGauge({ latitude }) {
  const position = `${((90 - latitude) / 180) * 100}%`;
  return <span className="summary-latitude__gauge" aria-hidden="true">
    <span className="summary-latitude__pole">N</span>
    <span className="summary-latitude__track">
      <span className="summary-latitude__equator" />
      <span className="summary-latitude__marker" style={{ top: position }} />
    </span>
    <span className="summary-latitude__pole">S</span>
  </span>;
}

function LatitudeCard({ place, direction }) {
  const Tag = place ? Link : 'article';
  const destination = place ? { to: `/countries/${place.country.slug}${place.date && place.journeyId ? `?date=${encodeURIComponent(place.date)}&trip=${encodeURIComponent(place.journeyId)}` : ''}` } : {};
  const latitude = place ? `${Math.abs(place.latitude).toFixed(2)}° ${place.latitude < 0 ? 'S' : 'N'}` : '';
  const label = direction === 'north' ? 'Farthest north' : 'Farthest south';
  const Arrow = direction === 'north' ? ArrowUp : ArrowDown;

  return <Tag className={`stat-card summary-latitude summary-latitude--${direction}`} {...destination} aria-label={place ? `${label}: ${place.name}, ${place.country.name}, ${latitude}. ${place.journeyId ? 'Open itinerary' : 'Open country'}` : `${label}: no places yet`}>
    <div className="summary-latitude__copy">
      <span className="summary-latitude__label"><Arrow aria-hidden="true" strokeWidth={2.2} />{label}</span>
      <strong>{place?.name ?? '—'}</strong>
      {place && <small>{latitude} · {place.country.name}</small>}
    </div>
    {place && <LatitudeGauge latitude={place.latitude} />}
  </Tag>;
}

export default function TravelSummary() {
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const countries = archiveCountries.filter(country => countryVisits(country.code, journeys, countryOnlyVisits).length);

  return <><section className="travel-summary" aria-label="Travel overview">
    <WorldSummaryCard />
    <div className="travel-summary__details">
      <dl className="summary-stats">
        <StatCard label="Countries" value={summary.countryCount} note="Print tickets" Icon={Printer} tone="tickets">
          <button className="summary-stat__trigger" type="button" title="Print country tickets" aria-label={`Print travel tickets for ${summary.countryCount} countries`} aria-haspopup="dialog" aria-expanded={ticketsOpen} disabled={!summary.countryCount} onClick={() => setTicketsOpen(true)} />
        </StatCard>
        <StatCard label="Continents" value={summary.continentCount} note={`of ${CONTINENT_TOTAL}`} Icon={Globe} tone="continents" />
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
