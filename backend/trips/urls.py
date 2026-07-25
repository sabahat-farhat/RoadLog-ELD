from django.urls import path

from .views import TripCreateView, TripListView, TripDetailView

urlpatterns = [
    path("trips/", TripCreateView.as_view(), name="trip-create"),
    path("trips/history/", TripListView.as_view(), name="trip-list"),
    path("trips/<int:pk>/", TripDetailView.as_view(), name="trip-detail"),
]
