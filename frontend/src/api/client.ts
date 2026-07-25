import type { Trip, TripRequest, TripSummary } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function createTrip(payload: TripRequest): Promise<Trip> {
  const res = await fetch(`${API_BASE}/trips/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle<Trip>(res);
}

export async function listTrips(): Promise<TripSummary[]> {
  const res = await fetch(`${API_BASE}/trips/history/`);
  return handle<TripSummary[]>(res);
}

export async function getTrip(id: number | string): Promise<Trip> {
  const res = await fetch(`${API_BASE}/trips/${id}/`);
  return handle<Trip>(res);
}

export interface GeocodeResult {
  label: string;
  lat: number;
  lon: number;
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  if (query.trim().length < 3) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "6");
  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((item: { display_name: string; lat: string; lon: string }) => ({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
  }));
}
