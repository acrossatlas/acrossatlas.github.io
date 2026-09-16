# Amsterdam public transport, 25–27 September 2026

Source: https://gtfs.ovapi.nl/nl/gtfs-nl.zip, OVapi feed version 9581, retrieved 2026-09-16, validity 2026-09-16–2026-12-12. All times are local Europe/Amsterdam. These are scheduled services, not live departure guarantees.

The JSON stores the selected trip IDs, service dates, stop names, timetable times and shape IDs. Each transit polyline is clipped from its GTFS shape using the boarding/alighting stops' `shape_dist_traveled`. Access/egress walks use https://routing.openstreetmap.de/routed-foot/. Walking times are estimates; they are not treated as scheduled transit time. No car routing or arbitrary curves substitute for transit geometry.

| Date | Segment | Service |
|---|---|---|
| Sep 25 | Knooppunt Noord → Elandsgracht | 397 10:18–10:49 |
| Sep 25 | Leidseplein → Knooppunt Noord | 397 14:41–15:10 |
| Sep 25 | Knooppunt Noord → Museumplein | 397 17:27–17:47 |
| Sep 25 | Museumplein → Knooppunt Noord | 397 23:13–23:33 |
| Sep 26 | Knooppunt Noord → Museumplein | 397 10:40–10:59 |
| Sep 26 | Museumplein → Marnixplein | 5 11:01:29–11:11:42 |
| Sep 26 | Amsterdam Centraal → Schiphol Airport | Sprinter 20:48–21:05 |
| Sep 27 | Knooppunt Noord → Museumplein | 397 09:02–09:19 |
| Sep 27 | Museumplein → Knooppunt Noord | 397 13:09–13:34 |

The Sep 26 selections match the saved 9292 itinerary. Friday/Sunday services were selected from this feed to fit the agreed activity windows. The 5 tram is displayed to minute precision, while the source retains its seconds. The Museumplein platform transfer is about 32 seconds on the foot-routing model, versus 149 scheduled seconds available; a delay can still break the connection.

Private ibis shuttle: the hotel's linked timetable confirms Sep 26 airport departure 21:17 and Sep 27 hotel departure 14:00. It does not publish arrival times or route geometry. Those segments are not drawn, and previously estimated arrival at the hotel remains approximate. Source: https://dq5r178u4t83b.cloudfront.net/wp-content/uploads/sites/97/2026/07/23121119/Hotel-Shuttle-Schedule-jul-2026-.pdf

Validation: all selected trips operate on the requested dates; transit durations are positive; clipped geometry meets boarding/alighting stops within 100 m; adjacent walk/transit parts meet within 100 m. UI focus and build verified.
