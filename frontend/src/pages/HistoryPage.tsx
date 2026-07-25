import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Route, Clock, CalendarDays, ChevronRight, Inbox, Loader2 } from "lucide-react";
import { listTrips } from "../api/client";
import type { TripSummary } from "../types";

export default function HistoryPage() {
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTrips()
      .then(setTrips)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load history"));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent)]">Archive</div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)]">Trip History</h1>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Every planned trip and its generated log sheets, saved.</p>

      <div className="mt-8 flex flex-col gap-3">
        {!trips && !error && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[var(--color-accent)]" size={24} />
          </div>
        )}

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

        {trips && trips.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-line)] py-20 text-center">
            <Inbox size={28} className="text-[var(--color-ink-faint)]" />
            <p className="text-sm text-[var(--color-ink-muted)]">No trips planned yet.</p>
            <Link to="/" className="text-sm font-semibold text-[var(--color-accent)] underline">
              Plan your first trip
            </Link>
          </div>
        )}

        {trips?.map((trip, i) => (
          <motion.div
            key={trip.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
          >
            <Link
              to={`/trips/${trip.id}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]/40 sm:p-5"
            >
              <div className="min-w-0">
                <div className="truncate font-display text-[15px] font-semibold text-[var(--color-ink)]">
                  {trip.current_label.split(",")[0]} <span className="text-[var(--color-accent)]">&rarr;</span> {trip.pickup_label.split(",")[0]}{" "}
                  <span className="text-[var(--color-accent)]">&rarr;</span> {trip.dropoff_label.split(",")[0]}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ink-muted)]">
                  <span className="flex items-center gap-1">
                    <Route size={12} /> {trip.total_miles.toLocaleString()} mi
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {trip.total_drive_hours.toFixed(1)} hrs driving
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} /> {trip.total_days} log sheet{trip.total_days === 1 ? "" : "s"}
                  </span>
                  <span>{new Date(trip.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[var(--color-ink-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
