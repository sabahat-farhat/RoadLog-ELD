import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPinned, ShieldCheck, FileStack } from "lucide-react";
import TripForm from "../components/TripForm";
import RouteIllustration from "../components/ui/RouteIllustration";
import RevealText from "../components/ui/RevealText";
import { createTrip } from "../api/client";
import type { GeocodeResult } from "../api/client";

const FEATURES = [
  { icon: MapPinned, text: "Free OSRM routing with fuel, break & rest stops mapped along the way" },
  { icon: ShieldCheck, text: "11-hr driving, 14-hr window & 70-hr/8-day limits enforced automatically" },
  { icon: FileStack, text: "Every daily log sheet drawn and ready to export the moment you submit" },
];

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(payload: {
    current: GeocodeResult;
    pickup: GeocodeResult;
    dropoff: GeocodeResult;
    cycleUsed: number;
  }) {
    setLoading(true);
    setError(null);
    try {
      const trip = await createTrip({
        current_location: payload.current,
        pickup_location: payload.pickup,
        dropoff_location: payload.dropoff,
        current_cycle_used: payload.cycleUsed,
      });
      navigate(`/trips/${trip.id}`, { state: { trip } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-14 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
      <div className="relative">
        <div className="pointer-events-none absolute -left-10 top-1/2 hidden h-[420px] w-[520px] -translate-y-1/2 opacity-70 lg:block">
          <RouteIllustration />
        </div>

        <div className="relative">
          <RevealText>
            <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              FMCSA 70-hr / 8-day &middot; Property-Carrying Driver
            </div>
          </RevealText>

          <RevealText delay={0.08}>
            <h1 className="font-display text-balance text-[2.75rem] font-semibold leading-[1.04] tracking-tight text-[var(--color-ink)] sm:text-[3.4rem]">
              Plan the route.
              <br />
              Let the <span className="text-[var(--color-accent)]">log book</span>
              <br />
              fill itself in.
            </h1>
          </RevealText>

          <RevealText delay={0.16}>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
              Drop in your trip and we'll route it, place every mandated stop, and hand
              back FMCSA daily log sheets — ready to print.
            </p>
          </RevealText>

          <RevealText delay={0.24}>
            <ul className="mt-9 flex flex-col gap-4 border-t border-[var(--color-line)] pt-7">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-3 text-[13.5px] text-[var(--color-ink-muted)]">
                  <f.icon size={15} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
                  {f.text}
                </li>
              ))}
            </ul>
          </RevealText>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <TripForm onSubmit={handleSubmit} loading={loading} error={error} />
      </motion.div>
    </div>
  );
}
