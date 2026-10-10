# Travel archive

Map log and Trip log are two views of the same journey records. Content lives in `src/data/journeys/`; `src/data/archive.js` provides the index and country metadata.

## Routes

- `/?log=map`: one card per country with completed journeys.
- `/?log=trip`: one card per completed journey.
- `/countries/netherlands`, `/countries/iceland`, `/countries/norway`: country overview, cities and regions, and related journey entries.
- `/trips/2026-netherlands-iceland-norway`: the archived notebook. `?date=2026-09-28` selects a specific day and survives refresh and browser history navigation.
- `/ongoing`: redirects to an active journey if available, otherwise the latest archived journey. Existing links remain usable.

## Journey records

Each record has a stable `id`, `status`, title, full date range, country codes, displayed itinerary dates, daily events, country tab labels, transport, stays, and checklists. Set `status: 'completed'` to include it in both archives and remove the notebook's current/upcoming focus card. Completed transport and stay records keep chronological order without a current-record indicator.

`visits` contains one entry per country per journey: the segment's dates and its regions. Each region has a stable `id`, display names, broad map coordinates, a description, relevant `dates`, and `firstDate` for the notebook link. Country pages aggregate completed visits, retaining one marker per region linked to its most recent journey; all journey entries remain listed below the map. Country cover artwork shows the relevant mainland outlines. Trip cover markers belong only to that trip.

## Current content

The autumn 2026 record preserves the existing planned content. `contentStatus: 'original-plan'` records that actual visits and skipped places have not yet been reconciled. No booking or optional-route status was inferred from completion.

The full journey ends on October 7, when the return flight arrives. Daily itinerary tabs still end on October 6, matching the original record; that day's flight card already contains the next-day arrival. Checklist storage uses the original start date to preserve existing local selections.

To add another journey, add a data module and register it in `journeys`. Add country metadata if it introduces a new destination. Review public content against the project charter before publishing.
