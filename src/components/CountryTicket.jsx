import { useId } from 'react';
import { getJourneyDayCount } from '../lib/journey-dates';

const ticketDesigns = {
  NL: { background: '#ae1c28', ink: '#ffffff', accent: '#21468b' },
  IS: { background: '#02529c', ink: '#ffffff', accent: '#dc1e35' },
  NO: { background: '#ba0c2f', ink: '#ffffff', accent: '#00205b' },
  SG: { background: '#ef3340', ink: '#ffffff', accent: '#f79ba1' },
  TH: { background: '#2d2a4a', ink: '#ffffff', accent: '#d84656' },
};

// The two concave arcs cut the paper itself at the date stub, like a ticket.
const ticketOutline = 'M52 0H124A20 20 0 0 0 164 0H668A52 52 0 0 1 720 52V248A52 52 0 0 1 668 300H164A20 20 0 0 0 124 300H52A52 52 0 0 1 0 248V52A52 52 0 0 1 52 0Z';

function CountryMotif({ code, color, background }) {
  if (code === 'NL') return <g fill={color} transform="translate(0 0)">
    <path d="M88 72L128 16L148 36L96 80Z M88 88L144 128L124 148L80 96Z M72 88L32 144L12 124L64 80Z M72 72L16 32L36 12L80 64Z" />
    <circle cx="80" cy="80" r="9" />
  </g>;
  if (code === 'IS') return <g transform="translate(0 0)">
    <path fill={color} d="M16 144L50 36L80 88L108 18L148 144Z" />
    <path fill="#003b73" d="M108 18L82 104L106 144H148Z" />
  </g>;
  if (code === 'SG') return <g fill={color} transform="translate(-2 -14)">
    <path d="M37 18C46 8 61 5 75 9C89 7 101 19 104 32C115 41 115 56 108 66L112 78C111 87 104 94 94 96C92 107 94 117 104 124C117 133 132 125 136 112L132 100C144 105 154 102 160 92C161 106 154 119 144 125L158 139C144 143 133 139 124 133C115 151 94 160 76 153C57 146 49 129 54 110L58 93C48 96 39 91 36 83L28 80C20 79 15 73 16 67L26 62H14C8 62 6 58 10 54L23 47C26 34 29 25 37 18Z" />
    <path d="M20 64C0 60-14 75-20 98" fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
    <path fill={background} d="M60 22C42 28 38 46 49 60C58 70 62 78 57 88C72 82 69 66 60 56C50 45 51 32 60 22Z M85 41C73 49 73 64 83 73C88 78 89 84 85 91C100 85 99 73 90 65C82 59 80 50 85 41Z" />
    <g fill="none" stroke={background} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M27 62H36L41 58" />
      <path d="M63 106Q70 114 77 106Q84 114 91 106M60 122Q67 130 74 122Q81 130 88 122Q95 130 102 122M75 138Q82 146 89 138Q96 146 103 138" />
      <path d="M138 114L150 105M141 130L149 135" strokeWidth="3" />
    </g>
    <path fill={background} d="M31 42Q38 36 45 41Q38 47 31 42Z M68 24C67 17 78 15 82 22C86 29 79 35 72 32L73 27Q78 29 78 25Q77 20 72 24Z" />
    <circle cx="19" cy="54" r="2.5" fill={background} />
  </g>;
  if (code === 'TH') return <g fill={color} transform="translate(0 0)">
    <path d="M80 10L91 43L132 68H28L69 43Z M80 58L148 103H12Z M36 112H124V144H36Z" />
  </g>;
  return <g transform="translate(0 0)">
    <path fill={color} d="M12 38L44 18H72Q72 50 60 78Q48 104 60 144H12Z M100 18H126L148 40V144H100Q80 116 92 86Q104 56 100 18Z" />
    <path fill="#ffffff" d="M72 18H100Q104 56 92 86Q80 116 100 144H60Q48 104 60 78Q72 50 72 18Z" />
  </g>;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const SANS = "'PingFang SC', 'PingFang TC', 'PingFang HK', 'Noto Sans SC', 'Microsoft YaHei', sans-serif";

function ticketDate(key) {
  if (!key) return null;
  const [year, month, day] = key.split('-').map(Number);
  return { day: `${MONTHS[month - 1]} ${day}`, year };
}

// Long names shrink so they always fit beside the stub without touching the motif row.
function nameSize(name) {
  return Math.min(64, Math.floor(460 / (name.length * .64)));
}

export default function CountryTicket({ country, visit }) {
  const faceId = useId();
  const outlineId = useId();
  const design = ticketDesigns[country.code] ?? ticketDesigns.NL;
  const start = ticketDate(visit.startsOn);
  const end = ticketDate(visit.endsOn);
  const dayCount = visit.startsOn && visit.endsOn ? getJourneyDayCount(visit) : null;
  const dates = start && end ? `${start.day}${start.year !== end.year ? `, ${start.year}` : ''} — ${end.day}, ${end.year}` : 'UNDATED';
  const name = country.name.toUpperCase();

  return <svg className="country-ticket" viewBox="0 0 720 300" aria-hidden="true" focusable="false" data-country={country.code}>
    <defs>
      <clipPath id={outlineId}><path d={ticketOutline} /></clipPath>
      <clipPath id={faceId}><rect x="160" y="16" width="544" height="268" rx="30" /></clipPath>
    </defs>
    <g clipPath={`url(#${outlineId})`}>
      <path className="country-ticket__paper" d={ticketOutline} fill="#f7f6f2" />

      <g className="country-ticket__stub" fontFamily={SANS} textAnchor="middle" fill="#202020">
        <text x="72" y="58" fontSize="12" fontWeight="600" letterSpacing="3" fill="#9a9a9f">ADMIT ONE</text>
        <text x="72" y="168" fontSize="64" fontWeight="800" letterSpacing="-1">{country.code}</text>
        <text x="72" y="236" fontSize="30" fontWeight="800" letterSpacing="-.5">{dayCount ?? '—'}</text>
        <text x="72" y="258" fontSize="12" fontWeight="600" letterSpacing="3" fill="#9a9a9f">{dayCount === 1 ? 'DAY' : 'DAYS'}</text>
      </g>
      <path d="M144 26V274" stroke="#c9c8c2" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />

      <g clipPath={`url(#${faceId})`}>
        <rect x="160" y="16" width="544" height="268" fill={design.background} />
        <g transform="translate(556 34) scale(.8)" opacity=".95">
          <CountryMotif code={country.code} color={design.accent} background={design.background} />
        </g>
        <g fill={design.ink} fontFamily={SANS}>
          <text x="190" y="66" fontSize="15" fontWeight="600" letterSpacing="3.5" opacity=".72">{country.continent?.toUpperCase()}</text>
          <text className="country-ticket__name" x="188" y="222" fontSize={nameSize(name)} fontWeight="800" letterSpacing="-1.5">{name}</text>
          <text className="country-ticket__date" x="190" y="258" fontSize="17" fontWeight="600" letterSpacing="1.5" opacity=".85">{dates}</text>
        </g>
      </g>
    </g>
  </svg>;
}
