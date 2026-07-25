from django.contrib import admin

from .models import Trip


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "current_label", "pickup_label", "dropoff_label", "total_miles", "total_days")
