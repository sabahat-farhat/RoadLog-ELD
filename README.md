# RoadLog ELD

A full-stack trip planner for property-carrying truck drivers. Enter a current location, pickup,
dropoff, and how many hours of the 70-hour/8-day cycle are already used — it plans a
compliant route with every mandated stop mapped out, and auto-draws FMCSA daily log sheets,
ready to export.

**Live demo:** [road-log-eld-view.vercel.app](https://road-log-eld-view.vercel.app/)

## Features

- Route planning across current → pickup → dropoff, with fuel stops, mandatory breaks, and
  rest periods placed automatically along the way
- An Hours-of-Service engine enforcing the 11-hour driving limit, 14-hour on-duty window,
  30-minute break rule, and 70-hour/8-day cycle limit
- Interactive map with color-coded stop markers and a trip timeline strip
- Daily log sheets rendered as SVG, matching the official FMCSA Driver's Daily Log grid —
  duty-status step line, remarks, totals, and multi-day splitting for longer trips
- One-click PNG / PDF export of the generated logs
- Trip history, saved and browsable

## Stack

- **Backend:** Django + Django REST Framework, Postgres
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4, Framer Motion, Lenis smooth scroll
- **Routing/Geocoding:** OSRM + Nominatim (OpenStreetMap) — free, no API key required
- **Map:** Leaflet / react-leaflet
- **Log export:** `html-to-image` + `jsPDF`

## How it works

1. The frontend geocodes the three trip locations client-side against Nominatim's public
   search API (autocomplete), so the backend only ever receives resolved lat/lon pairs.
2. The backend requests two OSRM routes (current→pickup, pickup→dropoff) and hands the legs to
   a discrete-event HOS simulator, which walks the trip in bounded time chunks — always
   advancing to whichever limit is closest — and inserts the mandatory non-driving event
   whenever a limit is hit:
   - 11-hour driving limit / 14-hour on-duty window
   - 30-minute break after 8 cumulative hours of driving
   - 10 consecutive hours off duty to reset the 11/14-hour clocks
   - 70-hour/8-day cycle limit, reduced by the driver's starting "cycle used" hours
   - 34-hour restart once the cycle budget is exhausted
   - 1 hour on-duty for pickup, 1 hour for drop-off
   - A fuel stop at least every 1,000 miles
3. That continuous timeline is sliced into calendar-day log sheets, with off-duty time padded
   before the first and after the last activity so every sheet totals a clean 24 hours — the
   way a real driver's log reads.
4. The frontend renders the route on a map and draws each day's log as an SVG grid with the
   duty-status step-line, remarks, and totals, pixel-matched to the official paper form.

### Known simplifications

The 70-hour/8-day limit is modeled as a running total rather than a true rolling window, since
the only input available is a single "hours already used" number rather than day-by-day duty
history. This makes the planner conservative — it may schedule a 34-hour restart where a driver
with known daily history could legally keep going — but it will never *under*-count available
hours. Sleeper-berth split-duty scheduling and short-haul/adverse-conditions exceptions are out
of scope; every rest is a monolithic off-duty block, which is always compliant, just not always
the most efficient dispatch.

## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/trips/` | Create a trip: `{current_location, pickup_location, dropoff_location, current_cycle_used}` (each location is `{label, lat, lon}`); returns the full computed trip — route geometry, stops, and daily logs |
| `GET` | `/api/trips/history/` | List saved trips (summary fields) |
| `GET` | `/api/trips/:id/` | Full trip detail — route geometry, stops, daily logs |

## Assumptions

Property-carrying driver, 70-hour/8-day cycle, no adverse driving conditions, fueling at least
once every 1,000 miles, 1 hour each for pickup and drop-off.
