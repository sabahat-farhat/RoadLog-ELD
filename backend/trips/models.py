from django.db import models


class Trip(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    current_label = models.CharField(max_length=255)
    current_lat = models.FloatField()
    current_lon = models.FloatField()

    pickup_label = models.CharField(max_length=255)
    pickup_lat = models.FloatField()
    pickup_lon = models.FloatField()

    dropoff_label = models.CharField(max_length=255)
    dropoff_lat = models.FloatField()
    dropoff_lon = models.FloatField()

    current_cycle_used = models.FloatField()

    total_miles = models.FloatField(default=0)
    total_drive_hours = models.FloatField(default=0)
    total_days = models.IntegerField(default=0)

    route_geometry = models.JSONField(default=list)
    stops = models.JSONField(default=list)
    daily_logs = models.JSONField(default=list)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.current_label} -> {self.pickup_label} -> {self.dropoff_label}"
