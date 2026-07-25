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
