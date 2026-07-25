"""Splits a continuous HOS segment timeline into per-calendar-day log sheets,
matching the FMCSA Driver's Daily Log grid (Off Duty / Sleeper Berth / Driving /
On Duty rows across a midnight-to-midnight, quarter-hour-resolution graph)."""
from datetime import datetime, timedelta
from types import SimpleNamespace

STATUS_LABELS = {
    "off_duty": "Off Duty",
    "sleeper_berth": "Sleeper Berth",
    "driving": "Driving",
    "on_duty": "On Duty (Not Driving)",
}


def _day_start(dt):
    return datetime(dt.year, dt.month, dt.day)


def _pad_off_duty(start, end, location):
    return SimpleNamespace(
        status="off_duty", start=start, end=end, location=location, remark="", distance_miles=0.0
    )


def build_daily_logs(segments):
    real_segments = [s for s in segments if s.end > s.start]
    if not real_segments:
        return []

    # A real driver's log always covers a full midnight-to-midnight day: pad
    # off-duty time before the trip's first logged activity and after its last.
    first, last = real_segments[0], real_segments[-1]
    first_day_start = _day_start(first.start)
    last_day_end = _day_start(last.end) + timedelta(days=1)

    padded = list(real_segments)
    if first.start > first_day_start:
        padded.insert(0, _pad_off_duty(first_day_start, first.start, first.location))
    if last.end < last_day_end:
        padded.append(_pad_off_duty(last.end, last_day_end, last.location))

    segments = padded
    days = {}

    def get_day(day_key):
        if day_key not in days:
            days[day_key] = {
                "date": day_key.strftime("%Y-%m-%d"),
                "segments": [],
                "totals": {"off_duty": 0.0, "sleeper_berth": 0.0, "driving": 0.0, "on_duty": 0.0},
                "total_miles": 0.0,
                "remarks": [],
            }
        return days[day_key]

    for seg in segments:
        if seg.end <= seg.start:
            continue
        cursor = seg.start
        while cursor < seg.end:
            day_key = _day_start(cursor)
            next_midnight = day_key + timedelta(days=1)
            piece_end = min(seg.end, next_midnight)
            hours = (piece_end - cursor).total_seconds() / 3600.0

            day = get_day(day_key)
            start_hour = (cursor - day_key).total_seconds() / 3600.0
            end_hour = (piece_end - day_key).total_seconds() / 3600.0

            day["segments"].append(
                {
                    "status": seg.status,
                    "status_label": STATUS_LABELS[seg.status],
                    "start_hour": round(start_hour, 4),
                    "end_hour": round(end_hour, 4),
                    "location": seg.location,
                }
            )
            day["totals"][seg.status] += hours

            fraction = hours / ((seg.end - seg.start).total_seconds() / 3600.0)
            day["total_miles"] += seg.distance_miles * fraction

            if seg.remark or cursor == seg.start:
                loc_label = None
                if seg.location:
                    loc_label = seg.location.get("label")
                day["remarks"].append(
                    {
                        "time_hour": round(start_hour, 4),
                        "time_str": cursor.strftime("%H:%M"),
                        "label": seg.remark or STATUS_LABELS[seg.status],
                        "location": loc_label,
                    }
                )

            cursor = piece_end

    ordered_keys = sorted(days.keys())
    result = []
    for k in ordered_keys:
        d = days[k]
        for key in d["totals"]:
            d["totals"][key] = round(d["totals"][key], 2)
        d["total_miles"] = round(d["total_miles"], 1)
        result.append(d)
    return result
