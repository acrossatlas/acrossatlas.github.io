import countryMapsUrl from '../assets/country-map-covers.svg';

export default function CountryMapCover({ country, fill = false }) {
  return <svg className="country-map-cover" viewBox="0 0 420 328" preserveAspectRatio={fill ? 'xMidYMid slice' : undefined} focusable="false" aria-hidden="true">
    <use href={`${countryMapsUrl}#cover-${country.code}`} />
  </svg>;
}
