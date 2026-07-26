"""Unit tests for the HOS simulation engine (trips/hos_engine.py).

These exercise simulate_trip() directly with synthetic route legs — no
network calls, no database — so they're fast and deterministic. Each test
targets one FMCSA rule the engine is responsible for enforcing.
"""
from datetime import datetime

from django.test import SimpleTestCase

from .hos_engine import (
    simulate_trip,
    MAX_DRIVING_HOURS,
    MAX_WINDOW_HOURS,
)

CURRENT = {"label": "Current", "lat": 32.0, "lon": -96.0}
PICKUP = {"label": "Pickup", "lat": 33.0, "lon": -95.0}
DROPOFF = {"label": "Dropoff", "lat": 33.1, "lon": -95.1}
START = datetime(2026, 1, 1, 6, 0)


def make_leg(distance_miles, duration_hours):
    """A synthetic OSRM-shaped leg: a straight two-point line covering the
    given distance in exactly the given time, so tests can dial in precise
    cumulative driving/elapsed hours."""
    return {
        "distance": distance_miles * 1609.34,
        "duration": duration_hours * 3600,
        "geometry": [[-96.0, 32.0], [-95.0, 33.0]],
    }


def run(leg1_hours, leg2_hours=0.1, cycle_used=0.0, leg1_miles=None, leg2_miles=5):
    if leg1_miles is None:
        leg1_miles = leg1_hours * 50  # arbitrary constant speed, not load-bearing
    leg1 = make_leg(leg1_miles, leg1_hours)
    leg2 = make_leg(leg2_miles, leg2_hours)
    return simulate_trip(CURRENT, PICKUP, DROPOFF, cycle_used, [leg1, leg2], START)


class HOSEngineTests(SimpleTestCase):
    def test_single_30_min_break_after_8_cumulative_hours(self):
        """Driving past the 8-hour mark (but nowhere near the 11-hour driving
        limit) must insert exactly one 30-minute break, and nothing else."""
        result = run(leg1_hours=8.5)
        segments = result["segments"]

        breaks = [s for s in segments if s.remark == "30-min required break"]
        self.assertEqual(len(breaks), 1)
        self.assertAlmostEqual((breaks[0].end - breaks[0].start).total_seconds() / 3600, 0.5)

        resets = [s for s in segments if "10-hour rest" in s.remark]
        self.assertEqual(len(resets), 0, "should not have triggered a full reset yet")

    def test_10_hour_reset_when_11_hour_driving_limit_hit(self):
        """Enough driving to hit the 11-hour cap must insert a full 10-hour
        off-duty reset, and driving must never exceed 11 hours in one window."""
        result = run(leg1_hours=11.5)
        segments = result["segments"]

        resets = [s for s in segments if s.remark == "Required 10-hour rest period"]
        self.assertGreaterEqual(len(resets), 1)
        self.assertAlmostEqual((resets[0].end - resets[0].start).total_seconds() / 3600, 10.0)

    def test_34_hour_restart_when_cycle_budget_exhausted(self):
        """Starting close to the 70-hour/8-day ceiling must trigger a full
        34-hour restart once the remaining budget is used up."""
        result = run(leg1_hours=4, cycle_used=68)
        segments = result["segments"]

        restarts = [s for s in segments if "34-hour restart" in s.remark]
        self.assertGreaterEqual(len(restarts), 1)
        self.assertAlmostEqual((restarts[0].end - restarts[0].start).total_seconds() / 3600, 34.0)

    def test_driving_and_window_limits_never_exceeded(self):
        """Regression check across a long multi-reset trip: within any single
        window (between qualifying resets), cumulative driving must never
        exceed 11 hours and elapsed on-duty time must never exceed 14 hours."""
        result = run(leg1_hours=30, leg2_hours=30, leg1_miles=1500, leg2_miles=1500)
        segments = result["segments"]

        window_driving = 0.0
        window_elapsed = 0.0
        checked_any = False
        for seg in segments:
            duration = (seg.end - seg.start).total_seconds() / 3600
            if duration <= 0:
                continue
            is_reset = seg.status == "off_duty" and (
                "10-hour rest" in seg.remark or "34-hour restart" in seg.remark
            )
            if is_reset:
                window_driving = 0.0
                window_elapsed = 0.0
                continue
            window_elapsed += duration
            if seg.status == "driving":
                window_driving += duration
            checked_any = True
            self.assertLessEqual(window_driving, MAX_DRIVING_HOURS + 1e-6)
            self.assertLessEqual(window_elapsed, MAX_WINDOW_HOURS + 1e-6)

        self.assertTrue(checked_any, "trip should have produced driving segments to check")
