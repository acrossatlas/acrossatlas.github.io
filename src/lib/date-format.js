const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Sep 25 – 27, 2026", "Sep 27 – Oct 1, 2026", "Dec 30, 2025 – Jan 5, 2026".
export function readableDateRange(startsOn, endsOn) {
  const [sy, sm, sd] = startsOn.split('-').map(Number);
  const [ey, em, ed] = endsOn.split('-').map(Number);
  const start = `${MONTHS[sm - 1]} ${sd}`;
  if (sy !== ey) return `${start}, ${sy} – ${MONTHS[em - 1]} ${ed}, ${ey}`;
  if (sm !== em) return `${start} – ${MONTHS[em - 1]} ${ed}, ${ey}`;
  if (sd !== ed) return `${start} – ${ed}, ${ey}`;
  return `${start}, ${ey}`;
}
