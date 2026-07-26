/**
 * Trip timestamps from the backend (stop `start`/`end`, etc.) are naive
 * "home-terminal wall-clock" values — no timezone offset, e.g.
 * "2026-07-28T14:30:00" — matching how the HOS engine and a real FMCSA log
 * represent time: always the driver's home terminal, never wherever a
 * particular viewer happens to be sitting.
 *
 * `new Date(isoString)` on a string with no timezone suffix happens to get
 * interpreted as the *browser's* local time per the JS spec, which only
 * looks consistent by coincidence (the digits echo back on a round trip
 * through `.toLocaleString()`) and breaks the moment that assumption is
 * disturbed — e.g. a fractional-seconds value some engines mis-parse, or a
 * future edit that adds a "Z" suffix upstream and silently shifts every
 * displayed time by the viewer's UTC offset.
 *
 * These helpers instead parse the naive components directly and always
 * format with `timeZone: "UTC"`, so the displayed digits are guaranteed to
 * exactly match the naive value, identically, regardless of the viewer's
 * own timezone. Use these instead of `new Date(x).toLocaleString()` anywhere
 * a trip timestamp is rendered, so the map, the timeline, and the log grid
 * all agree.
 */

export function parseTripTime(iso: string): Date {
  const [datePart, timePart = "00:00:00"] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh = 0, mm = 0, ss = 0] = timePart.split(":").map((v) => parseFloat(v));
  return new Date(Date.UTC(y, m - 1, d, hh, mm, Math.floor(ss)));
}

export function formatTripTime(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return parseTripTime(iso).toLocaleString(undefined, { ...opts, timeZone: "UTC" });
}
