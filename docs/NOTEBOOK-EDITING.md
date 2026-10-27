# Notebook editing — local first version

Starting point: upstream main `5a72b9003c6b029c8094d2153b04b40784bb4ebf`.
The old workspace-root prototype is not this application.

## Experience

There is no global editing mode. Click an itinerary card to edit it and use the
always-visible Add action at the bottom of the day's list. Drag a card or its
small grip to reorder; on touch devices use the grip so page scrolling remains
available. Keyboard users can focus the grip and use up/down arrows.

New entries start as 行程; the four compact type tabs switch type. Card fields
are name, time, address and description, each with its label on the left. The
selected day supplies the date; start and end times share one capsule of 24-hour
fields (type `930` or `21:30`; arrow keys step 5 minutes). An unprovided time
remains empty; vague source times stay in timeNote. Overnight legacy arrival
labels are converted to actual end dates when edited.

Activity, Stay and Dining edit the same fields already visible on a card:
name, time, address and description. There are no extra room, cuisine, duration
or other metadata inputs. Older extra-field values are folded into description
when saved, so removing the inputs does not discard entered text.

Transport starts with exactly one leg, as three capsules split into equal
halves that line up: route (from → to), time (start — end) and mode · code.
Add leg creates a second leg; removing it returns to the same single-leg form.
No separate overall endpoints or duplicate overall time inputs are shown. The
card title is derived from the first departure and final destination as A - B.

New booking and payment statuses are null. Both are compact tag selects at the
top right of the editor, beside close. Empty booking details show as a grey
「添加预订信息」 bar that expands to the link and uploads. Existing confirmed source statuses are preserved. Each event supports
up to 10 PDF/JPEG/PNG/WebP booking attachments, 20 MB each. Files are retained
locally and can be opened with the browser. Upload does not parse tickets or
infer status. Manual entry and JSON exchange use the same event schema.

Editors save only on 完成, after checking required fields (a name, or a
transport's first departure and final destination) and showing any problem
inline. Closing never saves: once anything has changed, including the type, the
close button turns into 「放弃修改」 in place and a second press discards; Escape
or further editing backs out. 删除 sits beside 完成 as a secondary button and
turns into 「确认删除」 in place. While a draft is unsaved, beforeunload
protects against an accidental page exit. Each save is one undo step.

Checklist text opens the same editor. Only the separate checkbox
changes the checked state. Small group-header plus buttons add entries. Old
localStorage selections migrate when the notebook is first created.

Album accepts up to 20 images per batch and 25 MB per source file. Pick the date
in the existing modal shell. Supported inputs are JPEG, PNG and WebP; HEIC/HEIF
also work when the browser can decode them. Images are resized to a maximum
2048px edge and re-encoded as JPEG, stripping source metadata. Original files
are not uploaded or committed. Images can be opened and deleted; deletion can
be undone.

More is a short menu: 撤销上次修改, 版本记录 and 删除行程. Every saved change
is a version (the last 20 are kept) with its time, what changed and its source.
版本记录 expands to that list: choosing a version switches the trip to it and
choosing 最新 switches back; nothing is downloaded and nothing is discarded.
While an older version is shown, the trip page says so and offers 回到最新.
Editing from an older version starts from it and keeps the previous latest as a
version. 撤销上次修改 steps back one version the same way. Version logic lives in
`src/lib/notebook-versions.js`; older undo history is migrated when read.

删除行程 confirms in place: the row turns into 确认删除整趟行程.
Deletion removes the complete local notebook, undo history and its photo and
booking attachment blobs in one transaction, then returns to Trip log. A small
deletion marker prevents source journeys and stale tabs from recreating it.
Catalogs, summaries and country views exclude deleted trips. This action cannot
be undone from the application.

## Existing control references

| Added use | Existing reference |
| --- | --- |
| More, Add and Done buttons | `journey-tool-button` in `src/styles.css`; existing Transport / Stay tools |
| Card click / title action | Existing event card and title; no extra edit button |
| Drag grip and add icons | `theme-toggle`; existing quiet icon control |
| Editor shell, headings and close button | `journey-modal`, `journey-modal__header`, `journey-modal__body`; existing Transport / Stay dialogs |
| Modal focus, Escape and focus restoration | Native dialog pattern in `CountryTicketPrinter.jsx` |
| Input surface | `journey-search`; existing search field |
| Type tabs | `day-tabs`; existing date pills |
| Advanced fields disclosure | `photo-spots`; existing expandable photo-spot section |
| Confirmation body | `reservation-state`; existing reservation detail state |
| Footer | `ticket-printer__footer`; existing ticket dialog |
| Save/restore options | `info-card`, `journey-modal__list`; existing information cards |
| Album empty state and picker | `album-empty`, `album-empty__icon`; existing Album placeholder |
| Map update notice | `daily-map__load-status`; existing map status notice |

There were no complete equivalents for the grouped native date/time fields,
multiline editing, drag sorting, photo grid/lightbox or backup/restore interaction. Those behaviors
are new. Their surfaces, spacing, radii, typography and colors extend the
references above through `src/notebook-editor.css`; they introduce no new
palette or typography. Both existing themes are supported.

## Data and reliability

The public source journey files remain the seed. `notebookFromJourney` migrates
them to versioned notebook data and `journeyFromNotebook` adapts saved content
to existing views. Trip and country pages read the same IndexedDB record.
Browser tabs receive update notifications; an editor checks the revision it
opened before saving. IndexedDB also compares revisions within its transaction,
so stale writes cannot replace a newer edit even if notifications are delayed.

Photos, booking attachments and metadata save in one IndexedDB transaction. The page changes only
after successful commit. Errors leave the editor and its input open. Photo
blobs remain while referenced by the current document or undo history; old
unreferenced blobs are collected.

Edited maps follow the existing template conventions. Transfers keep country
outlines and dashed air/sea connections, without floating country cards. City stops
reuse the original pins; ground connections require saved or newly calculated
road/trail geometry, with no straight-line fallback. Known addresses and airports
reuse the source coordinates. New addresses resolve through Photon; explicit
coordinates and supported map marker links also work. Driving and walking legs
use separate routing profiles. Only place input changes or route order changes
affect geography. Lookup responses are keyed to their input, cancelled after
subsequent edits, and cached locally. Missing places can be edited or retried.
Map selections highlight the corresponding card with the template's selected
card style. Photon and OSRM are external public services; availability is not
guaranteed. The providers can be replaced with VITE_GEOCODER_URL/VITE_ROUTER_URL.
The geographic lookup cache belongs to this browser and is not part of backups.


## Editing with an external AI (not in the interface)

The menu no longer offers AI exchange or backup files. The library code remains
(`notebook-exchange.js`, `notebook-backup.js`, covered by unit tests) for a
later entry point.

The exchange format is an ordinary JSON file with format
`across-itinerary`, version 1, bookId, baseRevision, ordered days/events and the
checklist. It contains attachment references but no binary file data. Retain
IDs for existing events; new events need unique IDs. Null means no booking or
payment status. Common fields are title, schedule, navigation, description, statuses, link and
attachments; transport contains its ordered segments. Native source journeys remain the initial public seed.

Applying it validates the JSON, rejects outdated revisions and unknown
attachment references, and preserves current photos and attachment bytes.
Across does not call an AI service.

## Limits and next infrastructure step

This version saves to one browser origin. It is not cross-device synchronization,
an offline-installable app, or a cloud photo service. Clearing browser website
data removes local content, including all versions. Editing does not publish to
the public site.

Trip names and date ranges are editable in the header; the home plus creates
a new local notebook. Date changes retain content in day order and refuse to
truncate days containing events or photos. Named date separators are editable.
Country archive membership and summary statistics still originate
from public archive metadata. Current country pages show saved event edits
within existing country dates. Planning/import, reconciliation
of actual visits, and editing Stay summary records are separate later work.

Cloud persistence requires an authenticated per-owner data store and private
photo storage, plus conflict handling equivalent to the local revision checks.
There is no account configuration available in this checkout; no cloud service
has been created and nothing has been deployed.

## Validation

`node --test 'src/lib/*.test.js'` runs existing archive/map tests and notebook
migration, cross-day move, linked flight, validation and immutability checks.

`scripts/verify-notebook.mjs` uses Playwright against a running preview. Supply
Playwright normally or set `PLAYWRIGHT_MODULE` to its module path. It uses isolated
browser contexts and does not alter a user's Safari/local preview data. Checks
cover direct card editing, discard confirmation and save on 完成, 24-hour
times, type-specific forms, transport segments, uploads, pointer drag,
checklist state, version switching and undo, and concurrent-edit protection.
It captures desktop/mobile/light/dark screenshots for visual review.
