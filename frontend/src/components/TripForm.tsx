import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation, PackageCheck, Flag, Gauge, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import LocationAutocomplete from "./LocationAutocomplete";
import MagneticButton from "./ui/MagneticButton";
import type { GeocodeResult } from "../api/client";

interface Props {
  onSubmit: (payload: {
    current: GeocodeResult;
    pickup: GeocodeResult;
    dropoff: GeocodeResult;
    cycleUsed: number;
  }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function TripForm({ onSubmit, loading, error }: Props) {
  const [current, setCurrent] = useState<GeocodeResult | null>(null);
  const [pickup, setPickup] = useState<GeocodeResult | null>(null);
  const [dropoff, setDropoff] = useState<GeocodeResult | null>(null);
  const [cycleUsed, setCycleUsed] = useState<string>("0");

  const canSubmit = current && pickup && dropoff && cycleUsed !== "" && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !pickup || !dropoff) return;
    await onSubmit({ current, pickup, dropoff, cycleUsed: parseFloat(cycleUsed) });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full overflow-hidden rounded-[20px] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 sm:p-7"
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-accent)] to-transparent" />

      <div className="mb-6 flex items-baseline justify-between">
        <span className="font-display text-[15px] font-semibold text-[var(--color-ink)]">Trip details</span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">01 / 01</span>
      </div>

      <div className="flex flex-col gap-4">
        <LocationAutocomplete
          label="Current Location"
          placeholder="Where are you now?"
          icon={<Navigation size={15} />}
          value={current}
          onChange={setCurrent}
        />
        <LocationAutocomplete
          label="Pickup Location"
          placeholder="Where's the load?"
          icon={<PackageCheck size={15} />}
          value={pickup}
          onChange={setPickup}
        />
        <LocationAutocomplete
          label="Dropoff Location"
          placeholder="Final destination"
          icon={<Flag size={15} />}
          value={dropoff}
          onChange={setDropoff}
        />

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
            Current Cycle Used (Hrs)
          </label>
          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3.5 py-3 transition-colors focus-within:border-[var(--color-accent)]/50">
            <Gauge size={15} className="text-[var(--color-ink-faint)]" />
            <input
              type="number"
              min={0}
              max={70}
              step={0.5}
              value={cycleUsed}
              onChange={(e) => setCycleUsed(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--color-ink)] focus:outline-none"
              placeholder="0"
            />
            <span className="font-mono text-[11px] text-[var(--color-ink-faint)]">/ 70 hrs</span>
          </div>
        </div>
      </div>

      <MagneticButton
        type="submit"
        disabled={!canSubmit}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3.5 text-sm font-bold text-[var(--color-accent-ink)] transition-shadow hover:shadow-[0_8px_28px_-8px_var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Planning route&hellip;
          </>
        ) : (
          <>
            Plan Trip <ArrowRight size={16} />
          </>
        )}
      </MagneticButton>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3.5 py-2.5 text-sm text-[var(--color-danger)]"
        >
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </motion.div>
      )}
    </form>
  );
}
