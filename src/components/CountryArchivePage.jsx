import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { archiveCountries, archiveDateRange, countryRegions, countryVisits, tripUrl } from '../data/archive';
import { TripArchiveCard } from './ArchiveCards';

const CountryArchiveMap = lazy(() => import('./CountryArchiveMap'));

function CountryArchiveContent({ country }) {
  const [selected, setSelected] = useState(null);
  const visits = useMemo(() => countryVisits(country.code), [country.code]);
  const regions = useMemo(() => countryRegions(country.code), [country.code]);
  const first = visits.at(-1), last = visits[0];

  return (
    <div className="page country-archive-page">
      <main className="ongoing-shell">
        <header className="notebook-header">
          <div className="title-row"><Link to="/" aria-label="across home">across</Link></div>
          <Link className="archive-back" to="/?log=map">← Map log</Link>
          <div className="country-archive-heading">
            <div><h1>{country.name}</h1><p>{country.label} · {visits.length} 次旅行</p></div>
            <span>{first && archiveDateRange(first.startsOn, last.endsOn)}</span>
          </div>
        </header>

        <section className="country-archive-explorer" aria-label={`${country.label}行程地图`}>
          <Suspense fallback={<div className="day-map daily-map__loading">正在加载地图…</div>}>
            <CountryArchiveMap country={country} regions={regions} selected={selected} onSelect={setSelected} />
          </Suspense>
          <div className="country-region-list">
            <h2>城市与区域</h2>
            {regions.map((region, index) => (
              <article key={region.id} className={`country-region${selected === region.id ? ' is-selected' : ''}`}>
                <button type="button" aria-pressed={selected === region.id} onClick={() => setSelected(selected === region.id ? null : region.id)}>
                  <span className="country-region__number">{index + 1}</span>
                  <span><strong>{region.name}</strong><small>{region.label}</small></span>
                </button>
                <p>{region.description}</p>
                <Link to={tripUrl(region.journey, region.firstDate)}>{region.firstDate.slice(5).replace('-', '.')} · 查看行程 →</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="country-visits" aria-labelledby="country-visits-title">
          <div className="notebook-section__heading"><h2 id="country-visits-title">旅行记录</h2></div>
          <div className="trip-card-list">
            {visits.map(visit => <TripArchiveCard key={`${visit.journey.id}-${visit.startsOn}`} journey={visit.journey} visit={visit} />)}
          </div>
        </section>
        <p className="archive-content-note">地图按原行程整理，实际到访与跳过的地点之后补充。</p>
      </main>
    </div>
  );
}

export default function CountryArchivePage() {
  const { countrySlug } = useParams();
  const country = archiveCountries.find(item => item.slug === countrySlug);
  if (!country) return <div className="page"><main className="ongoing-shell"><Link to="/?log=map">← Map log</Link><h1>尚未收录这个国家</h1></main></div>;
  return <CountryArchiveContent key={country.code} country={country} />;
}
