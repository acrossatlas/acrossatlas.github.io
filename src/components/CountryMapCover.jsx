import countryMapsUrl from '../assets/country-map-covers.svg';

export default function CountryMapCover({ country }) {
  return <svg className="country-map-cover" viewBox="0 0 420 328" focusable="false" aria-hidden="true">
    <use href={`${countryMapsUrl}#cover-${country.code}`} />
  </svg>;
}
