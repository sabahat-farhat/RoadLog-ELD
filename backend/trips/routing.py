"""Thin clients for the free, key-less OSRM (routing) and Nominatim (geocoding)
public demo services."""
import requests

OSRM_BASE = "https://router.project-osrm.org"
NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
USER_AGENT = "RoadLog-ELD/1.0 (FMCSA HOS trip planner; https://github.com/roadlog-eld)"

_session = requests.Session()
_session.headers.update({"User-Agent": USER_AGENT})


class RoutingError(Exception):
    pass


def get_route_leg(point_a, point_b):
    """point_a/point_b: {"lat","lon"}. Returns {distance_m, duration_s, geometry:[[lon,lat],...]}."""
    coords = f"{point_a['lon']},{point_a['lat']};{point_b['lon']},{point_b['lat']}"
    url = f"{OSRM_BASE}/route/v1/driving/{coords}"
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}
    resp = _session.get(url, params=params, timeout=20)
    if resp.status_code != 200:
        raise RoutingError(f"OSRM error {resp.status_code}: {resp.text[:200]}")
    data = resp.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError(f"OSRM could not find a route: {data.get('message', data.get('code'))}")
    route = data["routes"][0]
    return {
        "distance": route["distance"],
        "duration": route["duration"],
        "geometry": route["geometry"]["coordinates"],
    }


def reverse_geocode(lat, lon):
    """Best-effort human-readable label for a lat/lon. Returns None on failure."""
    try:
        url = f"{NOMINATIM_BASE}/reverse"
        params = {"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 10}
        resp = _session.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            addr = data.get("address", {})
            city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county")
            state = addr.get("state")
            if city and state:
                return f"{city}, {state}"
            return data.get("display_name", "").split(",")[0] or None
    except requests.RequestException:
        return None
    return None
