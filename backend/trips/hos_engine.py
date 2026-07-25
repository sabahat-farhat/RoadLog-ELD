"""
Hours of Service (HOS) simulation engine for property-carrying, 70hr/8day drivers.

Rules implemented (per FMCSA Interstate Truck Driver's Guide to HOS, Apr 2022):
- 11-hour driving limit within a 14-hour on-duty window (Sec. 395.3(a))
- 30-minute break required after 8 cumulative hours of driving (Sec. 395.3(a)(3)(ii))
- 10 consecutive hours off duty required to reset the 11/14-hour clocks
- 70-hour / 8-day cycle limit (Sec. 395.3(b)); a 34-consecutive-hour break resets it
- No adverse driving conditions exception applied (per assessment assumptions)
- 1 hour on-duty (not driving) for pickup, 1 hour for drop-off
- Fuel stop (30 min on-duty, not driving) at least every 1,000 miles

The engine is a discrete event simulation: it walks each driving leg in bounded
chunks, always advancing by whichever limit is closest (break threshold, driving
limit, window limit, fuel marker, or leg end), and inserts the mandatory
non-driving event whenever a limit is hit.

Known simplifications (intentional, given a single scalar "current cycle used"
input rather than a day-by-day duty history):
- The 70-hour/8-day limit is modeled as a flat running total, not a true rolling
  window where the oldest day's hours drop off daily. This makes the planner
  conservative: it may schedule a 34-hour restart in a spot where a driver with
  known daily history could legally keep going as hours roll off. It will never
  under-count available hours, only (rarely) over-restrict them.
- Once the cycle budget is exhausted, a 34-hour restart is always taken. The
  regulation treats the restart as optional, but without rolling-window data
  the engine has no other legal way to free up hours, so this is the only safe
  choice available to it.
- No sleeper-berth split-duty optimization, adverse driving conditions
  extension, or short-haul exceptions — every rest is a monolithic off-duty
  block. Safe/conservative, not maximally efficient for real-world dispatch.
"""
from dataclasses import dataclass
from datetime import timedelta

from .geo_utils import RoutePolyline

MAX_DRIVING_HOURS = 11.0
MAX_WINDOW_HOURS = 14.0
BREAK_TRIGGER_HOURS = 8.0
BREAK_DURATION_HOURS = 0.5
DAILY_RESET_HOURS = 10.0
MAX_CYCLE_HOURS = 70.0
CYCLE_RESET_HOURS = 34.0
FUEL_INTERVAL_MILES = 1000.0
FUEL_STOP_DURATION_HOURS = 0.5
PICKUP_DROPOFF_DURATION_HOURS = 1.0

EPS = 1e-6

STATUS_OFF_DUTY = "off_duty"
STATUS_SLEEPER = "sleeper_berth"
STATUS_DRIVING = "driving"
STATUS_ON_DUTY = "on_duty"


@dataclass
class Leg:
    label: str  # description e.g. "Current -> Pickup"
    distance_miles: float
    duration_hours: float
    polyline: RoutePolyline
    end_location: dict  # {"label", "lat", "lon"}


@dataclass
class Segment:
    status: str
    start: object  # datetime
    end: object  # datetime
    location: dict
    remark: str = ""
    distance_miles: float = 0.0


class HOSSimulator:
    def __init__(self, start_time, cycle_hours_used):
        self.time = start_time
        self.segments = []
        self.driving_since_break = 0.0
        self.driving_in_window = 0.0
        self.window_elapsed = 0.0
        self.cycle_hours_used = cycle_hours_used
        self.total_miles = 0.0
        self.miles_since_fuel = 0.0
        self.window_open = False

    def _add(self, status, hours, location, remark="", distance_miles=0.0):
        if hours <= 0:
            return
        start = self.time
        end = self.time + timedelta(hours=hours)
        self.segments.append(Segment(status, start, end, location, remark, distance_miles))
        self.time = end

    def _open_window_if_needed(self):
        if not self.window_open:
            self.window_open = True
            self.driving_in_window = 0.0
            self.window_elapsed = 0.0
            self.driving_since_break = 0.0

    def do_on_duty(self, hours, location, remark):
        self._open_window_if_needed()
        self._add(STATUS_ON_DUTY, hours, location, remark)
        self.window_elapsed += hours
        self.cycle_hours_used += hours
        # Any consecutive >=30-min interruption of driving (loading, paperwork,
        # fueling) satisfies the 30-min break requirement, not just fuel stops.
        if hours >= BREAK_DURATION_HOURS - EPS:
            self.driving_since_break = 0.0

    def do_off_duty_reset(self, hours, location, remark, sleeper=False):
        status = STATUS_SLEEPER if sleeper else STATUS_OFF_DUTY
        self._add(status, hours, location, remark)
        self.window_open = False
        self.driving_in_window = 0.0
        self.window_elapsed = 0.0
        self.driving_since_break = 0.0

    def do_break_or_reset(self, location):
        """Take the mandatory 30-min break, unless the 14-hour window would run
        out mid-break — in that case driving couldn't resume anyway, so the
        break is superseded by the full 10-hour reset instead."""
        if self.window_elapsed + BREAK_DURATION_HOURS > MAX_WINDOW_HOURS + EPS:
            self.do_off_duty_reset(DAILY_RESET_HOURS, location, "Required 10-hour rest period")
            self._open_window_if_needed()
        else:
            self._add(STATUS_OFF_DUTY, BREAK_DURATION_HOURS, location, "30-min required break")
            self.window_elapsed += BREAK_DURATION_HOURS
            self.driving_since_break = 0.0

    def _cycle_available(self):
        return max(0.0, MAX_CYCLE_HOURS - self.cycle_hours_used)

    def drive_leg(self, leg: Leg):
        self._open_window_if_needed()
        remaining_leg_hours = leg.duration_hours
        avg_speed = leg.distance_miles / leg.duration_hours if leg.duration_hours > 0 else 0
        leg_elapsed_hours = 0.0

        while remaining_leg_hours > EPS:
            miles_to_next_fuel = FUEL_INTERVAL_MILES - self.miles_since_fuel
            hours_to_next_fuel = (miles_to_next_fuel / avg_speed) if avg_speed > 0 else float("inf")

            limits = {
                "break": BREAK_TRIGGER_HOURS - self.driving_since_break,
                "driving_limit": MAX_DRIVING_HOURS - self.driving_in_window,
                "window_limit": MAX_WINDOW_HOURS - self.window_elapsed,
                "fuel": hours_to_next_fuel,
                "leg_end": remaining_leg_hours,
                "cycle": self._cycle_available(),
            }
            chunk = min(limits.values())
            chunk = max(chunk, 0.0)

            if chunk <= EPS:
                # A limit is already exhausted; resolve it without driving further.
                self._resolve_zero_chunk(limits, leg, leg_elapsed_hours, avg_speed)
                continue

            location_now = self._location_on_leg(leg, leg_elapsed_hours + chunk, avg_speed)
            self._add(STATUS_DRIVING, chunk, location_now, distance_miles=chunk * avg_speed)
            self.driving_since_break += chunk
            self.driving_in_window += chunk
            self.window_elapsed += chunk
            self.cycle_hours_used += chunk
            self.total_miles += chunk * avg_speed
            self.miles_since_fuel += chunk * avg_speed
            leg_elapsed_hours += chunk
            remaining_leg_hours -= chunk

            binding = min(limits, key=limits.get)

            if remaining_leg_hours <= EPS:
                break

            if binding == "fuel":
                loc = self._location_on_leg(leg, leg_elapsed_hours, avg_speed)
                self.do_on_duty(FUEL_STOP_DURATION_HOURS, loc, "Fuel stop")
                self.miles_since_fuel = 0.0
            elif binding == "break":
                loc = self._location_on_leg(leg, leg_elapsed_hours, avg_speed)
                self.do_break_or_reset(loc)
            elif binding in ("driving_limit", "window_limit"):
                loc = self._location_on_leg(leg, leg_elapsed_hours, avg_speed)
                self.do_off_duty_reset(
                    DAILY_RESET_HOURS, loc, "Required 10-hour rest period"
                )
                self._open_window_if_needed()
            elif binding == "cycle":
                loc = self._location_on_leg(leg, leg_elapsed_hours, avg_speed)
                self.do_off_duty_reset(
                    CYCLE_RESET_HOURS,
                    loc,
                    "70-hour/8-day limit reached: 34-hour restart",
                )
                self.cycle_hours_used = 0.0
                self._open_window_if_needed()

        return self._location_on_leg(leg, leg.duration_hours, avg_speed)

    def _resolve_zero_chunk(self, limits, leg, leg_elapsed_hours, avg_speed):
        binding = min(limits, key=limits.get)
        loc = self._location_on_leg(leg, leg_elapsed_hours, avg_speed)
        if binding == "fuel":
            self.do_on_duty(FUEL_STOP_DURATION_HOURS, loc, "Fuel stop")
            self.miles_since_fuel = 0.0
        elif binding == "break":
            self.do_break_or_reset(loc)
        elif binding in ("driving_limit", "window_limit"):
            self.do_off_duty_reset(DAILY_RESET_HOURS, loc, "Required 10-hour rest period")
            self._open_window_if_needed()
        elif binding == "cycle":
            self.do_off_duty_reset(
                CYCLE_RESET_HOURS, loc, "70-hour/8-day limit reached: 34-hour restart"
            )
            self.cycle_hours_used = 0.0
            self._open_window_if_needed()
        else:
            # leg_end with ~0 remaining; nothing to do, loop will exit.
            pass

    @staticmethod
    def _location_on_leg(leg: Leg, elapsed_hours, avg_speed):
        miles_in = min(leg.distance_miles, elapsed_hours * avg_speed)
        pt = leg.polyline.point_at_miles(miles_in)
        if pt is None:
            return leg.end_location
        return {"lat": pt["lat"], "lon": pt["lon"], "label": None}


def build_legs(route_legs_raw, waypoint_labels):
    """route_legs_raw: OSRM legs (list of dicts with distance(m)/duration(s)/geometry coords).
    waypoint_labels: labels for [current, pickup, dropoff]."""
    legs = []
    names = [
        f"{waypoint_labels[0]} -> {waypoint_labels[1]}",
        f"{waypoint_labels[1]} -> {waypoint_labels[2]}",
    ]
    for i, raw in enumerate(route_legs_raw):
        distance_miles = raw["distance"] / 1609.34
        duration_hours = raw["duration"] / 3600.0
        coords = raw["geometry"]  # list of [lon, lat]
        polyline = RoutePolyline(coords)
        end_loc = {
            "label": waypoint_labels[i + 1],
            "lat": coords[-1][1],
            "lon": coords[-1][0],
        }
        legs.append(Leg(names[i], distance_miles, duration_hours, polyline, end_loc))
    return legs


def simulate_trip(current, pickup, dropoff, cycle_hours_used, route_legs_raw, start_time):
    """
    current/pickup/dropoff: {"label","lat","lon"}
    route_legs_raw: OSRM 'legs' array (2 legs: current->pickup, pickup->dropoff),
                    each leg dict must include 'geometry' as list of [lon,lat] coords.
    """
    labels = [current["label"], pickup["label"], dropoff["label"]]
    legs = build_legs(route_legs_raw, labels)

    sim = HOSSimulator(start_time, cycle_hours_used)

    start_loc = {"lat": current["lat"], "lon": current["lon"], "label": current["label"]}
    sim.segments.append(Segment(STATUS_OFF_DUTY, start_time, start_time, start_loc, "Trip start"))

    sim.drive_leg(legs[0])
    pickup_loc = {"lat": pickup["lat"], "lon": pickup["lon"], "label": pickup["label"]}
    sim.do_on_duty(PICKUP_DROPOFF_DURATION_HOURS, pickup_loc, "Pickup (loading)")

    sim.drive_leg(legs[1])
    dropoff_loc = {"lat": dropoff["lat"], "lon": dropoff["lon"], "label": dropoff["label"]}
    sim.do_on_duty(PICKUP_DROPOFF_DURATION_HOURS, dropoff_loc, "Drop-off (unloading)")

    return {
        "segments": sim.segments,
        "total_miles": sim.total_miles,
        "total_drive_hours": sum(
            (s.end - s.start).total_seconds() / 3600 for s in sim.segments if s.status == STATUS_DRIVING
        ),
        "end_time": sim.time,
    }
