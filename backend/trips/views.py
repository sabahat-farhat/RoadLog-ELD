from datetime import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics

from .models import Trip
from .serializers import TripCreateSerializer, TripSerializer, TripListSerializer
from .routing import get_route_leg, reverse_geocode, RoutingError
from .hos_engine import simulate_trip
from .log_builder import build_daily_logs

STOP_TYPE_BY_REMARK = {
    "Pickup (loading)": "pickup",
    "Drop-off (unloading)": "dropoff",
    "Fuel stop": "fuel",
    "30-min required break": "break",
    "Required 10-hour rest period": "rest",
    "70-hour/8-day limit reached: 34-hour restart": "restart",
}

MAX_REVERSE_GEOCODE_CALLS = 10


def build_stops(segments):
    stops = []
    geocode_calls = 0
    for seg in segments:
        if seg.status == "driving":
            continue
        if seg.end <= seg.start:
            continue
        stop_type = STOP_TYPE_BY_REMARK.get(seg.remark)
        if stop_type is None:
            continue

        label = seg.location.get("label") if seg.location else None
        if not label and geocode_calls < MAX_REVERSE_GEOCODE_CALLS:
            label = reverse_geocode(seg.location["lat"], seg.location["lon"])
            geocode_calls += 1
        if not label:
            label = f"En route ({seg.location['lat']:.3f}, {seg.location['lon']:.3f})"

        stops.append(
            {
                "type": stop_type,
                "label": label,
                "lat": seg.location["lat"],
                "lon": seg.location["lon"],
                "start": seg.start.isoformat(),
                "end": seg.end.isoformat(),
                "duration_hours": round((seg.end - seg.start).total_seconds() / 3600, 2),
            }
        )
    return stops


def merge_geometry(leg_a_geom, leg_b_geom):
    """Both are lists of [lon,lat]. Returns list of [lat,lon] for Leaflet, deduped join point."""
    coords = list(leg_a_geom)
    if leg_b_geom:
        coords += leg_b_geom[1:] if coords and coords[-1] == leg_b_geom[0] else leg_b_geom
    return [[lat, lon] for lon, lat in coords]


class TripCreateView(APIView):
    def post(self, request):
        serializer = TripCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        current = data["current_location"]
        pickup = data["pickup_location"]
        dropoff = data["dropoff_location"]
        cycle_used = data["current_cycle_used"]
        driver_name = data.get("driver_name", "")
        truck_number = data.get("truck_number", "")
        shipping_doc_number = data.get("shipping_doc_number", "")

        departure_time_raw = data.get("departure_time")
        if departure_time_raw:
            try:
                start_time = datetime.fromisoformat(departure_time_raw).replace(second=0, microsecond=0)
            except ValueError:
                return Response(
                    {"detail": "departure_time must be an ISO datetime string (e.g. 2026-07-28T09:00)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # No departure given: default to now, rounded to the top of the
            # hour for a clean-looking log rather than an arbitrary minute.
            start_time = datetime.now().replace(minute=0, second=0, microsecond=0)

        try:
            leg1 = get_route_leg(current, pickup)
            leg2 = get_route_leg(pickup, dropoff)
        except RoutingError as e:
            return Response({"detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        route_legs_raw = [leg1, leg2]

        result = simulate_trip(current, pickup, dropoff, cycle_used, route_legs_raw, start_time)
        daily_logs = build_daily_logs(result["segments"])
        stops = build_stops(result["segments"])
        route_geometry = merge_geometry(leg1["geometry"], leg2["geometry"])

        trip = Trip.objects.create(
            current_label=current["label"],
            current_lat=current["lat"],
            current_lon=current["lon"],
            pickup_label=pickup["label"],
            pickup_lat=pickup["lat"],
            pickup_lon=pickup["lon"],
            dropoff_label=dropoff["label"],
            dropoff_lat=dropoff["lat"],
            dropoff_lon=dropoff["lon"],
            current_cycle_used=cycle_used,
            driver_name=driver_name,
            truck_number=truck_number,
            shipping_doc_number=shipping_doc_number,
            total_miles=round(result["total_miles"], 1),
            total_drive_hours=round(result["total_drive_hours"], 2),
            total_days=len(daily_logs),
            route_geometry=route_geometry,
            stops=stops,
            daily_logs=daily_logs,
        )

        return Response(TripSerializer(trip).data, status=status.HTTP_201_CREATED)


class TripListView(generics.ListAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripListSerializer


class TripDetailView(generics.RetrieveAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
