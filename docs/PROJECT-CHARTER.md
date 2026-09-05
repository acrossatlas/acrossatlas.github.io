# Across Atlas — project charter

## Purpose

Across Atlas is a personal travel fieldbook rather than a commercial product or public social network. Its role is to help prepare for a journey, provide useful reference during travel, and preserve a selective public record afterwards.

## Content boundary

### Suitable for the public site

- Destination research and practical guides
- Public-safe plans and checklists
- Notes about transport, food, culture, and places
- Completed trip records
- Map-based place collections
- Processed landscape photographs
- Links to external albums protected by their own access controls

### Must remain private

- Identity documents and scans
- Booking references, QR codes, and tickets
- Exact accommodation details
- Personal contact details
- Live location and sensitive current-travel details
- Personal and family photographs not intended for public viewing
- Original full-resolution photograph archives

## Working vocabulary

The vocabulary is not final, but these concepts have emerged from the discussion:

- **Trip Brief** — useful preparation and on-the-road reference
- **Field Notes** — lightweight observations captured during travel
- **Trip Log** — a journey viewed through time
- **Map Log** — the same journey viewed through place
- **Scenery** — a deliberately public selection of landscape photography
- **Private Album** — an authenticated external destination, never a public file dump

## Portability requirements

- Content should live in ordinary text or structured-data files.
- The build must produce static HTML, CSS, JavaScript, and optimized media.
- Hosting-specific configuration must remain separate from site content.
- The site must not hard-code a `github.io` origin.
- All important source and content must be recoverable with a normal Git clone.
- A second offline form, such as an installable PWA or generated PDF, should be possible.

## Decisions still to make together

- What the home page should show first
- Final information architecture and navigation
- How much current-trip information is safe to publish
- Visual direction and degree of notebook/map metaphor
- Primary language and whether labels should be bilingual
- Static-site technology
- When to register `acrossatlas.cn`
