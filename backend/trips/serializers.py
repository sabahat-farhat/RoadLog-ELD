from rest_framework import serializers

from .models import Trip


class LocationInputSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=255)
    lat = serializers.FloatField(min_value=-90, max_value=90)
    lon = serializers.FloatField(min_value=-180, max_value=180)


class TripCreateSerializer(serializers.Serializer):
    current_location = LocationInputSerializer()
    pickup_location = LocationInputSerializer()
    dropoff_location = LocationInputSerializer()
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)
    # Optional "YYYY-MM-DDTHH:MM" from an HTML datetime-local input — a naive
    # wall-clock value with no timezone, matching how the HOS engine and the
    # FMCSA log itself work in home-terminal time rather than any real UTC
    # instant. Left as a plain string (not DRF's DateTimeField) specifically
    # to avoid Django's USE_TZ machinery attaching or shifting a timezone.
    departure_time = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    driver_name = serializers.CharField(required=False, allow_blank=True, max_length=255, default="")
    truck_number = serializers.CharField(required=False, allow_blank=True, max_length=100, default="")
    shipping_doc_number = serializers.CharField(required=False, allow_blank=True, max_length=100, default="")


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id",
            "created_at",
            "current_label",
            "current_lat",
            "current_lon",
            "pickup_label",
            "pickup_lat",
            "pickup_lon",
            "dropoff_label",
            "dropoff_lat",
            "dropoff_lon",
            "current_cycle_used",
            "driver_name",
            "truck_number",
            "shipping_doc_number",
            "total_miles",
            "total_drive_hours",
            "total_days",
            "route_geometry",
            "stops",
            "daily_logs",
        ]


class TripListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id",
            "created_at",
            "current_label",
            "pickup_label",
            "dropoff_label",
            "total_miles",
            "total_drive_hours",
            "total_days",
        ]
