import { Link } from 'react-router-dom';
import CountryMapCover from './CountryMapCover';
import TravelSummary from './TravelSummary';
import TripSummary from './TripSummary';
import DottedWorldMap from './DottedWorldMap';
import { archiveCountries, archiveDateRange, countryOnlyVisits, countryVisits, journeys, tripUrl } from '../data/archive';
import { getJourneyDayCount } from '../lib/journey-dates';

function TripWorldCover({ countryCodes }) {
  return <div className="archive-cover trip-world-cover" aria-hidden="true">
    <DottedWorldMap countryCodes={countryCodes} landClassName="trip-world-cover__land" highlightClassName="trip-world-cover__highlight" viewBox="0 12 800 364" />
  </div>;
}

function CountryCard({ country }) {
  const visits = countryVisits(country.code, journeys, countryOnlyVisits);
  const visit = visits[0];
  const dayCount = visit.startsOn && visit.endsOn ? getJourneyDayCount(visit) : null;
  const label = dayCount === null ? country.name : `${country.name} · ${archiveDateRange(visit.startsOn, visit.endsOn)} · ${dayCount} ${dayCount === 1 ? 'day' : 'days'}`;
  return <Link className="archive-card country-card" to={`/countries/${country.slug}`} aria-label={label}>
    <CountryMapCover country={country} />
    <div className="country-card__copy">
      <h3>{country.name}</h3>
      {visit.startsOn && visit.endsOn && <p>{archiveDateRange(visit.startsOn, visit.endsOn)}</p>}
    </div>
  </Link>;
}

export function TripArchiveCard({ journey, visit }) {
  const countryCodes = [...new Set(journey.countries)];
  const countryCount = countryCodes.length;
  return <Link className="archive-card trip-card" to={tripUrl(journey, visit?.startsOn)}>
    <TripWorldCover countryCodes={countryCodes} />
    <div className="archive-card__body">
      <div className="trip-card__heading">
        <div className="archive-card__title"><h3>{journey.title}</h3></div>
        <p className="archive-card__dates">{archiveDateRange(journey.startsOn, journey.endsOn)}</p>
      </div>
      <div className="trip-card__footer">
        <p className="archive-card__country-count">{countryCount} {countryCount === 1 ? 'country' : 'countries'}</p>
      </div>
    </div>
  </Link>;
}

export function ArchivePanel({ type }) {
  const completed = journeys.filter(journey => journey.status === 'completed');
  const countries = archiveCountries.filter(country => countryVisits(country.code, journeys, countryOnlyVisits).length);
  return <div role="tabpanel" id={`${type}-panel`} aria-labelledby={`${type}-tab`} className="archive-panel" tabIndex={0}>
    <section className="archive-group" aria-label={type === 'map' ? 'Travel summary' : 'Trip summary'}>
      {type === 'map' ? <TravelSummary /> : <TripSummary />}
    </section>
    <section className="archive-group" aria-labelledby={`${type}-records-title`}>
      <h2 className="archive-group__title" id={`${type}-records-title`}>{type === 'map' ? 'Countries' : 'Journeys'}</h2>
      {type === 'map' ? <div className="country-card-grid">{countries.map(country => <CountryCard country={country} key={country.code} />)}</div>
        : <div className="trip-card-list">{completed.map(journey => <TripArchiveCard journey={journey} key={journey.id} />)}</div>}
    </section>
  </div>;
}
