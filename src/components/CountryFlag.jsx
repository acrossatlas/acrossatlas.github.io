const names = { IS: '冰岛', NL: '荷兰', NO: '挪威' };

export function countriesForDay(date) {
  if (date === '2026-09-27') return ['NL', 'IS'];
  if (date === '2026-10-01') return ['IS', 'NO'];
  if (date >= '2026-09-25' && date <= '2026-09-26') return ['NL'];
  if (date >= '2026-09-28' && date <= '2026-09-30') return ['IS'];
  if (date >= '2026-10-02' && date <= '2026-10-06') return ['NO'];
  return [];
}

export default function CountryFlag({ country }) {
  return <span className="daily-map__country">
    <svg viewBox={country === 'IS' ? '0 0 25 18' : country === 'NO' ? '0 0 22 16' : '0 0 3 2'} aria-hidden="true" focusable="false">
      {country === 'NL' ? <><path fill="#AE1C28" d="M0 0h3v2H0z" /><path fill="#fff" d="M0 .6667h3v.6666H0z" /><path fill="#21468B" d="M0 1.3333h3V2H0z" /></> : country === 'IS' ? <><path fill="#02529C" d="M0 0h25v18H0z" /><path fill="#fff" d="M7 0h4v18H7zM0 7h25v4H0z" /><path fill="#DC1E35" d="M8 0h2v18H8zM0 8h25v2H0z" /></> : <><path fill="#BA0C2F" d="M0 0h22v16H0z" /><path fill="#fff" d="M6 0h4v16H6zM0 6h22v4H0z" /><path fill="#00205B" d="M7 0h2v16H7zM0 7h22v2H0z" /></>}
    </svg>
    <span>{names[country]}</span>
  </span>;
}
