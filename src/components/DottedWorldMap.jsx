import dottedWorldUrl from '../assets/travel-world-dots.svg';
import countryDotsUrl from '../assets/travel-country-dots.svg';

export default function DottedWorldMap({ countryCodes = [], continents = [], landClassName, highlightClassName, viewBox = '0 0 800 444' }) {
  return <svg viewBox={viewBox} focusable="false" aria-hidden="true">
    <use href={`${dottedWorldUrl}#world-dots`} className={landClassName} />
    {continents.map(continent => <use key={continent} href={`${dottedWorldUrl}#dots-${continent.replaceAll(' ', '-')}`} className={highlightClassName} data-continent={continent} />)}
    {countryCodes.map(code => <use key={code} href={`${countryDotsUrl}#dots-country-${code}`} className={highlightClassName} data-country={code} />)}
  </svg>;
}
