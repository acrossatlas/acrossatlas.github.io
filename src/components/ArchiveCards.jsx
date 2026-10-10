import { Link } from 'react-router-dom';
import shapes from '../data/migration-countries.json';
import { archiveCountries, archiveDateRange, countryRegions, countryVisits, journeys, tripUrl } from '../data/archive';
import { countryFeatures } from '../lib/archive-geography';

const project = ([lng, lat]) => [lng, -Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI];
const polygonsFor = country => countryFeatures(shapes, country).flatMap(feature => (
  feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates]
));

export function ArchiveCover({ countries, regions, className = '' }) {
  const width = 520, height = 270, padding = 30;
  const polygons = countries.flatMap(country => polygonsFor(country).map(rings => ({ rings: rings.map(ring => ring.map(project)) })));
  const markers = regions ?? countries.flatMap(country => countryRegions(country.code).map(region => ({ ...region, color: country.color })));
  const points = polygons.flatMap(polygon => polygon.rings.flat());
  const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min((width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY));
  const toCanvas = ([x, y]) => [(x - (minX + maxX) / 2) * scale + width / 2, (y - (minY + maxY) / 2) * scale + height / 2];
  return <div className={`archive-cover ${className}`} aria-hidden="true">
    <svg viewBox={`0 0 ${width} ${height}`} focusable="false">
      {polygons.map(({ rings }, index) => <path key={index} d={rings.map(ring => `${ring.map((point, i) => `${i ? 'L' : 'M'}${toCanvas(point).map(value => value.toFixed(2)).join(',')}`).join(' ')}Z`).join(' ')} fill="white" stroke="#d4dce5" strokeWidth="1.2" fillRule="evenodd" />)}
      {markers.map(region => {
        const [x, y] = toCanvas(project(region.coordinates));
        return <g key={region.id}><circle cx={x} cy={y} r="8" fill={region.color} opacity=".13" /><circle cx={x} cy={y} r="3.5" fill={region.color} stroke="white" strokeWidth="1.5" /></g>;
      })}
    </svg>
  </div>;
}

function CountryCard({ country }) {
  const visits = countryVisits(country.code);
  const regions = countryRegions(country.code);
  return <Link className="archive-card country-card" to={`/countries/${country.slug}`}>
    <ArchiveCover countries={[country]} />
    <div className="archive-card__body">
      <div className="archive-card__title"><h2>{country.name}</h2><span className="archive-card__arrow" aria-hidden="true">↗</span></div>
      <p className="archive-card__subtitle">{country.label} · {visits.length} 次旅行</p>
      <p className="archive-card__places">{regions.map(region => region.label).join(' · ')}</p>
      <p className="archive-card__dates">{archiveDateRange(visits[0].startsOn, visits[0].endsOn)}</p>
    </div>
  </Link>;
}

export function TripArchiveCard({ journey, visit }) {
  const countries = archiveCountries.filter(country => journey.countries.includes(country.code));
  const regions = journey.visits.flatMap(item => item.regions.map(region => ({ ...region, color: countries.find(country => country.code === item.country)?.color })));
  return <Link className="archive-card trip-card" to={tripUrl(journey, visit?.startsOn)}>
    <ArchiveCover countries={countries} regions={regions} />
    <div className="archive-card__body">
      <p className="archive-card__eyebrow">{visit ? '这次旅行中的一段' : 'Trip log'} · {journey.startsOn.slice(0, 4)}</p>
      <div className="archive-card__title"><h2>{journey.title}</h2><span className="archive-card__arrow" aria-hidden="true">↗</span></div>
      <p className="archive-card__subtitle">{countries.map(country => country.label).join(' · ')}</p>
      <p className="archive-card__dates">{archiveDateRange(journey.startsOn, journey.endsOn)}</p>
      {visit && <p className="archive-card__places">本段 {archiveDateRange(visit.startsOn, visit.endsOn)} · 查看行程 →</p>}
    </div>
  </Link>;
}

export function ArchivePanel({ type }) {
  const completed = journeys.filter(journey => journey.status === 'completed');
  const countries = archiveCountries.filter(country => countryVisits(country.code).length);
  return <div role="tabpanel" id={`${type}-panel`} aria-labelledby={`${type}-tab`} className="archive-panel" tabIndex={0}>
    {type === 'map' ? <div className="country-card-grid">{countries.map(country => <CountryCard country={country} key={country.code} />)}</div>
      : <div className="trip-card-list">{completed.map(journey => <TripArchiveCard journey={journey} key={journey.id} />)}</div>}
    <p className="archive-content-note">先按原行程归档，实际到访与调整待补充。</p>
  </div>;
}
