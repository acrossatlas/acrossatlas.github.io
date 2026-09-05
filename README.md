# across

A personal travel fieldbook for public guides, trip records, map-based memories, and landscape photography.

## Current status

The React prototype includes two home-screen logs, Map and Trip. A separate Ongoing card appears only while the configured journey dates are active; its notebook route now contains the responsive trip-header, itinerary, checklist, album-link, and travel-detail modal framework.

## Local preview

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Agreed boundaries

- Public website content may include travel guides, non-sensitive trip records, maps, and processed landscape photographs.
- Personal photographs, booking details, identity documents, exact private itineraries, and original media must not be committed to this repository.
- Private albums may be linked only when the storage provider enforces authentication or an explicit access list.
- The finished site must remain portable between GitHub Pages and other static hosting providers.
- Essential travel-reference material should eventually support offline access.

See [`docs/PROJECT-CHARTER.md`](docs/PROJECT-CHARTER.md) before implementation begins.

Environment and account readiness are recorded in [`docs/PREPARATION.md`](docs/PREPARATION.md).
