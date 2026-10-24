# across

A personal travel fieldbook for public guides, trip records, map-based memories, and landscape photography.

## Current status

The home page archives completed journeys in two views: Map log groups them by country, while Trip log keeps each journey together. Country pages show regional maps and date-specific links to the shared trip notebook. An ongoing card appears only for an active, unfinished journey; without one, the archive follows directly beneath the title.

The Netherlands–Iceland–Norway journey (2026-09-24–10-07) is archived with its original itinerary, maps, transport, stays, checklist, and album section. Actual visits and skipped stops will be reviewed separately. See [the archive guide](docs/TRAVEL-ARCHIVE.md) for routes and the content structure.

Trip notebooks now support direct card editing with automatic local saving. Add entries at the bottom, drag cards to reorder, and click checklist text to edit while keeping checkbox toggles separate. Type-first forms support transport segments and PDF/image booking attachments. Album accepts photos grouped by date. The More menu offers undo, complete backups, and version-checked JSON exchange with an external AI. Cloud accounts and cross-device synchronization are not configured. See [editing and control references](docs/NOTEBOOK-EDITING.md) for behavior and current limits.

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

## Travel templates

Open `/templates` from the top-right home navigation to preview four reusable day structures: driving, city, transfer, and outdoor. Download the standard journey data from the page, or copy `public/templates/journey.json`. See [the reuse guide](docs/TRAVEL-TEMPLATE.md) for fields, map/event references, and current integration limits.
