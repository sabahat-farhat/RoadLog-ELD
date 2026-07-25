"""Geometry helpers for interpolating a point along a route polyline."""
import math


def haversine_miles(lat1, lon1, lat2, lon2):
    r = 3958.8  # earth radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


class RoutePolyline:
    """Wraps a list of [lon, lat] points with precomputed cumulative distance,
    so we can ask "where is the driver after N miles into this leg"."""

    def __init__(self, lonlat_points):
        self.points = lonlat_points
        self.cumulative = [0.0]
        for i in range(1, len(lonlat_points)):
            lon1, lat1 = lonlat_points[i - 1]
            lon2, lat2 = lonlat_points[i]
            d = haversine_miles(lat1, lon1, lat2, lon2)
            self.cumulative.append(self.cumulative[-1] + d)
        self.total_miles = self.cumulative[-1] if self.cumulative else 0.0

    def point_at_miles(self, target_miles):
        if not self.points:
            return None
        if target_miles <= 0:
            lon, lat = self.points[0]
            return {"lat": lat, "lon": lon}
        if target_miles >= self.total_miles:
            lon, lat = self.points[-1]
            return {"lat": lat, "lon": lon}
        for i in range(1, len(self.cumulative)):
            if self.cumulative[i] >= target_miles:
                seg_start = self.cumulative[i - 1]
                seg_end = self.cumulative[i]
                frac = 0.0 if seg_end == seg_start else (target_miles - seg_start) / (seg_end - seg_start)
                lon1, lat1 = self.points[i - 1]
                lon2, lat2 = self.points[i]
                lat = lat1 + (lat2 - lat1) * frac
                lon = lon1 + (lon2 - lon1) * frac
                return {"lat": lat, "lon": lon}
        lon, lat = self.points[-1]
        return {"lat": lat, "lon": lon}
