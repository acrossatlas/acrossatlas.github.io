# across

A personal travel fieldbook for public guides, trip records, map-based memories, and landscape photography.

## Current status

The home page archives completed journeys in two views: Map log groups them by country, while Trip log keeps each journey together. Country pages show regional maps and date-specific links to the shared trip notebook. An ongoing card appears only for an active, unfinished journey; without one, the archive follows directly beneath the title.

The Netherlands–Iceland–Norway journey (2026-09-24–10-07) is archived with its original itinerary, maps, transport, stays, checklist, and Travel zine entry. Actual visits and skipped stops will be reviewed separately. See [the archive guide](docs/TRAVEL-ARCHIVE.md) for routes and the content structure.

Trip notebooks support direct card editing saved locally when you press 完成. Add entries at the bottom, drag cards to reorder, and click checklist text to edit while keeping checkbox toggles separate. Forms support transport segments and PDF/image booking attachments. Album accepts photos grouped by date. The More menu offers undo and a version history you can switch between. Cloud accounts and cross-device synchronization are not configured. See [editing and control references](docs/NOTEBOOK-EDITING.md) for behavior and current limits.

The editor forms share one component set in `src/components/form/`. Open `/components` from the component icon at the top right of the home page for live examples, or read [the component reference](docs/COMPONENTS.md).

## Local preview

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Travel zine

Open **Travel zine → 打开手帐画布** on a journey page, or visit `/trips/2026-netherlands-iceland-norway/journal` in the local preview. The editor uses TN regular pages (110 × 210 mm), with single-page and spread templates, editable text, and grey photo placeholders. Upload photos into the bottom tray, drag them onto a page or an existing frame, then adjust position, crop, rotation, and dimensions in millimetres.

Work saves automatically in the current browser using IndexedDB, including uploaded photos. New journals start with empty photo frames and no demo assets. Photos are stored on this device only; there is no cloud upload or cross-device sync, and local development and the live site have separate storage. The left sidebar selects templates; the right sidebar edits the selected page, photo, or text. Page controls include paper color, adding content, duplication, and deletion.

**导出打印 PDF** creates A4 photo sheets at each frame’s exact size, with photo/page numbers and optional crop marks. In **打印预览**, choose **手帐整页** to export the complete layout as 110 × 210 mm pages instead. A separate CSV lists photo dimensions and positions. Print PDFs at **Actual size / 100%**.

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
