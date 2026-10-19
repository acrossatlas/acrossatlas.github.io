import { Link } from 'react-router-dom';
import CountryMapCover from './CountryMapCover';
import TravelSummary from './TravelSummary';
import TripSummary from './TripSummary';
import dottedWorldUrl from '../assets/travel-world-dots.svg';
import countryDotsUrl from '../assets/travel-country-dots.svg';
import countryDotBounds from '../data/country-dot-bounds.json';
import { archiveCountries, archiveDateRange, countryOnlyVisits, countryVisits, journeys, tripLogRecords, tripUrl } from '../data/archive';
import { getJourneyDayCount } from '../lib/journey-dates';

const countryByCode = new Map(archiveCountries.map(country => [country.code, country]));

// Crops the dotted world map to the visited countries, padded so neighbors give context.
function tripViewBox(countryCodes) {
  const boxes = countryCodes.map(code => countryDotBounds[code]).filter(Boolean);
  if (!boxes.length) return '0 12 800 364';
  const [x0, y0, x1, y1] = [Math.min(...boxes.map(b => b[0])), Math.min(...boxes.map(b => b[1])), Math.max(...boxes.map(b => b[2])), Math.max(...boxes.map(b => b[3]))];
  // The map panel is wide, so frame a wide window; slice-cropping then trims only the margins.
  const height = Math.min(Math.max(y1 - y0 + 60, 100), 444);
  const width = Math.min(Math.max(x1 - x0 + 120, 220, height * 2.2), 800);
  const left = Math.min(Math.max((x0 + x1) / 2 - width / 2, 0), 800 - width);
  const top = Math.min(Math.max((y0 + y1) / 2 - height / 2, 0), 444 - height);
  return [left, top, width, height].map(value => Math.round(value * 10) / 10).join(' ');
}

function TripWorldCover({ countryCodes }) {
  return <div className="trip-card__map" aria-hidden="true">
    <svg viewBox={tripViewBox(countryCodes)} preserveAspectRatio="xMidYMid slice" focusable="false">
      <use href={`${dottedWorldUrl}#world-dots`} className="trip-card__land" />
      {countryCodes.map(code => <use key={code} href={`${countryDotsUrl}#dots-country-${code}`} className="trip-card__visited" style={{ '--dot': countryByCode.get(code)?.color }} />)}
    </svg>
  </div>;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function readableDateRange(startsOn, endsOn) {
  const [sy, sm, sd] = startsOn.split('-').map(Number);
  const [ey, em, ed] = endsOn.split('-').map(Number);
  const start = `${MONTHS[sm - 1]} ${sd}`;
  if (sy !== ey) return `${start}, ${sy} – ${MONTHS[em - 1]} ${ed}, ${ey}`;
  if (sm !== em) return `${start} – ${MONTHS[em - 1]} ${ed}, ${ey}`;
  if (sd !== ed) return `${start} – ${ed}, ${ey}`;
  return `${start}, ${ey}`;
}

function CountryCard({ country }) {
  const visits = countryVisits(country.code, journeys, countryOnlyVisits);
  const visit = visits[0];
  const hasDates = Boolean(visit.startsOn && visit.endsOn);
  const dayCount = hasDates ? getJourneyDayCount(visit) : null;
  const label = dayCount === null ? country.name : `${country.name} · ${archiveDateRange(visit.startsOn, visit.endsOn)} · ${dayCount} ${dayCount === 1 ? 'day' : 'days'}`;
  return <Link className="archive-card country-card" to={`/countries/${country.slug}`} aria-label={label}>
    <div className="country-card__cover">
      <CountryMapCover country={country} fill />
      <span className="country-card__code" aria-hidden="true">{country.code}</span>
    </div>
    <div className="country-card__copy">
      <div className="country-card__text">
        <h3>{country.name}</h3>
        {hasDates && <p>{readableDateRange(visit.startsOn, visit.endsOn)}</p>}
      </div>
      {dayCount !== null && <span className="country-card__days" aria-hidden="true"><strong>{dayCount}</strong>{dayCount === 1 ? 'day' : 'days'}</span>}
    </div>
  </Link>;
}

export function TripArchiveCard({ journey, visit }) {
  const countryCodes = [...new Set(journey.countries)];
  const dayCount = getJourneyDayCount(journey);
  const stops = journey.visits?.length ? journey.visits : countryCodes.map(country => ({ country }));
  // Country-only trips have no itinerary page, so their card opens the country page.
  const to = journey.countryOnly ? `/countries/${journey.countrySlug}` : tripUrl(journey, visit?.startsOn);
  return <Link className="archive-card trip-card" to={to}>
    <div className="trip-card__body">
      <p className="trip-card__meta">
        <span>{readableDateRange(journey.startsOn, journey.endsOn)}</span>
        <span aria-hidden="true">·</span>
        <span>{dayCount} {dayCount === 1 ? 'day' : 'days'}</span>
      </p>
      <h3>{journey.title}</h3>
      <ol className="trip-card__route" aria-label={`${countryCodes.length} ${countryCodes.length === 1 ? 'country' : 'countries'}`}>
        {stops.map((stop, index) => {
          const country = countryByCode.get(stop.country);
          const days = stop.startsOn && stop.endsOn ? getJourneyDayCount(stop) : null;
          return <li key={`${stop.country}-${index}`}>
            <span>{country?.name ?? stop.country}</span>
            {days !== null && <small>{days}d</small>}
          </li>;
        })}
      </ol>
    </div>
    <TripWorldCover countryCodes={countryCodes} />
  </Link>;
}

export function ArchivePanel({ type }) {
  const countries = archiveCountries.filter(country => countryVisits(country.code, journeys, countryOnlyVisits).length);
  return <div role="tabpanel" id={`${type}-panel`} aria-labelledby={`${type}-tab`} className="archive-panel" tabIndex={0}>
    <section className="archive-group" aria-label={type === 'map' ? 'Travel summary' : 'Trip summary'}>
      {type === 'map' ? <TravelSummary /> : <TripSummary />}
    </section>
    <section className="archive-group" aria-labelledby={`${type}-records-title`}>
      <h2 className="archive-group__title" id={`${type}-records-title`}>{type === 'map' ? 'Countries' : 'Trips'}</h2>
      {type === 'map' ? <div className="country-card-grid">{countries.map(country => <CountryCard country={country} key={country.code} />)}</div>
        : <div className="trip-card-list">{tripLogRecords.map(journey => <TripArchiveCard journey={journey} key={journey.id} />)}</div>}
    </section>
  </div>;
}
