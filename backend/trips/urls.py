from django.urls import path

from .views import TripCreateView

# TripListView / TripDetailView exist in views.py but aren't routed here —
# the app is stateless for now (no persistent database). Restore these two
# routes when trip history comes back:
#   path("trips/history/", TripListView.as_view(), name="trip-list"),
#   path("trips/<int:pk>/", TripDetailView.as_view(), name="trip-detail"),
urlpatterns = [
    path("trips/", TripCreateView.as_view(), name="trip-create"),
]
