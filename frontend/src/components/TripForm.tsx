import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  PackageCheck,
  Flag,
  Gauge,
  Clock,
  User,
  Truck,
  FileText,
  ChevronDown,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import LocationAutocomplete from "./LocationAutocomplete";
import MagneticButton from "./ui/MagneticButton";
import type { GeocodeResult } from "../api/client";

interface Props {
  onSubmit: (payload: {
    current: GeocodeResult;
    pickup: GeocodeResult;
    dropoff: GeocodeResult;
    cycleUsed: number;
    departureTime: string;
    driverName: string;
    truckNumber: string;
    shippingDocNumber: string;
  }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Sensible default: the next top-of-the-hour from now, in the format a
// datetime-local input expects (no timezone — see TripRequest.departure_time).
function defaultDepartureLocal() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TripForm({ onSubmit, loading, error }: Props) {
  const [current, setCurrent] = useState<GeocodeResult | null>(null);
  const [pickup, setPickup] = useState<GeocodeResult | null>(null);
  const [dropoff, setDropoff] = useState<GeocodeResult | null>(null);
  const [cycleUsed, setCycleUsed] = useState<string>("0");
  const [departureTime, setDepartureTime] = useState<string>(defaultDepartureLocal);
  const [driverName, setDriverName] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [shippingDocNumber, setShippingDocNumber] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const canSubmit = current && pickup && dropoff && cycleUsed !== "" && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !pickup || !dropoff) return;
    await onSubmit({
      current,
      pickup,
      dropoff,
      cycleUsed: parseFloat(cycleUsed),
      departureTime,
      driverName,
      truckNumber,
      shippingDocNumber,
    });
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Current Cycle Used (Hrs)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-3 transition-colors focus-within:border-[var(--color-accent)]/50">
              <Gauge size={15} className="shrink-0 text-[var(--color-ink-faint)]" />
              <input
                type="number"
                min={0}
                max={70}
                step={0.5}
                value={cycleUsed}
                onChange={(e) => setCycleUsed(e.target.value)}
                className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] focus:outline-none"
                placeholder="0"
              />
              <span className="shrink-0 font-mono text-[11px] text-[var(--color-ink-faint)]">/ 70h</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              Departure
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-3 transition-colors focus-within:border-[var(--color-accent)]/50">
              <Clock size={15} className="shrink-0 text-[var(--color-ink-faint)]" />
              <input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center gap-1.5 self-start text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink-muted)]"
        >
          <ChevronDown size={13} className={`transition-transform ${showOptional ? "rotate-180" : ""}`} />
          Driver &amp; shipment details (optional)
        </button>

        <AnimatePresence initial={false}>
          {showOptional && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid gap-3 pt-1 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                    Driver Name
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-3 transition-colors focus-within:border-[var(--color-accent)]/50">
                    <User size={15} className="shrink-0 text-[var(--color-ink-faint)]" />
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="J. Doe"
                      className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                    Truck / Trailer #
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-3 transition-colors focus-within:border-[var(--color-accent)]/50">
                    <Truck size={15} className="shrink-0 text-[var(--color-ink-faint)]" />
                    <input
                      type="text"
                      value={truckNumber}
                      onChange={(e) => setTruckNumber(e.target.value)}
                      placeholder="Unit 4471"
                      className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                    Shipping Doc #
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-3 transition-colors focus-within:border-[var(--color-accent)]/50">
                    <FileText size={15} className="shrink-0 text-[var(--color-ink-faint)]" />
                    <input
                      type="text"
                      value={shippingDocNumber}
                      onChange={(e) => setShippingDocNumber(e.target.value)}
                      placeholder="BOL-00123"
                      className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
