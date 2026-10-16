import countryMapsUrl from '../assets/country-map-covers.svg';
import countryMapsDarkUrl from '../assets/country-map-covers-dark.svg';
import { useTheme } from '../lib/theme';

export default function CountryMapCover({ country, fill = false }) {
  const sprite = useTheme() === 'dark' ? countryMapsDarkUrl : countryMapsUrl;
  return <svg className="country-map-cover" viewBox="0 0 420 328" preserveAspectRatio={fill ? 'xMidYMid slice' : undefined} focusable="false" aria-hidden="true">
    <use href={`${sprite}#cover-${country.code}`} />
  </svg>;
}
