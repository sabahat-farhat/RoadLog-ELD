import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Stop } from "../types";
import { formatTripTime } from "../lib/tripTime";

const STOP_META: Record<Stop["type"] | "current", { color: string; label: string }> = {
  current: { color: "#4fd1c5", label: "Start" },
  pickup: { color: "#4fd1c5", label: "Pickup" },
  dropoff: { color: "#4ade80", label: "Drop-off" },
  fuel: { color: "#ff6a39", label: "Fuel Stop" },
  break: { color: "#6b7280", label: "30-min Break" },
  rest: { color: "#a78bfa", label: "10-hr Rest" },
  restart: { color: "#f87171", label: "34-hr Restart" },
};

function makeIcon(color: string, big = false) {
  const size = big ? 16 : 12;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};
      border:2px solid rgba(8,9,13,0.9);
      box-shadow:0 0 0 3px ${color}33, 0 2px 6px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length < 2) return;
    const id = requestAnimationFrame(() => {
      map.invalidateSize();
      map.fitBounds(positions, { padding: [48, 48] });
    });
    return () => cancelAnimationFrame(id);
  }, [positions, map]);
  return null;
}

interface Props {
  route: [number, number][];
  stops: Stop[];
  current: { label: string; lat: number; lon: number };
  className?: string;
}

export default function RouteMap({ route, stops, current, className }: Props) {
  const center = useMemo<[number, number]>(() => {
    if (route.length) return route[Math.floor(route.length / 2)];
    return [current.lat, current.lon];
  }, [route, current]);

  return (
    <div className={className} data-lenis-prevent>
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: "#0d0f16" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Polyline
          positions={route}
          pathOptions={{ color: "#ff6a39", weight: 4, opacity: 0.35 }}
        />
        <Polyline
          positions={route}
          pathOptions={{ color: "#ff6a39", weight: 2.5, opacity: 0.95 }}
        />

        <Marker position={[current.lat, current.lon]} icon={makeIcon(STOP_META.current.color, true)}>
          <Popup>
            <strong>Start:</strong> {current.label}
          </Popup>
        </Marker>

        {stops.map((s, i) => (
          <Marker key={i} position={[s.lat, s.lon]} icon={makeIcon(STOP_META[s.type].color, s.type === "pickup" || s.type === "dropoff")}>
            <Popup>
              <strong>{STOP_META[s.type].label}</strong>
              <br />
              {s.label}
              <br />
              <span style={{ opacity: 0.7 }}>
                {formatTripTime(s.start)} &middot; {s.duration_hours}h
              </span>
            </Popup>
          </Marker>
        ))}

        <FitBounds positions={route} />
      </MapContainer>
    </div>
  );
}
