import { Route, Clock, CalendarDays, Gauge } from "lucide-react";
import CountUp from "./ui/CountUp";
import SpotlightCard from "./ui/SpotlightCard";

interface Props {
  totalMiles: number;
  totalDriveHours: number;
  totalDays: number;
  cycleUsed: number;
}

export default function StatsCards({ totalMiles, totalDriveHours, totalDays, cycleUsed }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <SpotlightCard className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <Route size={17} className="text-[var(--color-accent)]" />
        <div className="mt-3 font-display text-3xl font-bold tabular-nums text-[var(--color-ink)]">
          <CountUp value={totalMiles} decimals={0} suffix=" mi" />
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
          Total Distance
        </div>
      </SpotlightCard>

      <SpotlightCard className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <Clock size={16} className="text-[var(--color-ink-muted)]" />
        <div className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[var(--color-ink)]">
          <CountUp value={totalDriveHours} decimals={1} suffix="h" />
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
          Driving Time
        </div>
      </SpotlightCard>

      <SpotlightCard className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <CalendarDays size={16} className="text-[var(--color-ink-muted)]" />
        <div className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[var(--color-ink)]">
          {totalDays}
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
          Log Sheet{totalDays === 1 ? "" : "s"}
        </div>
      </SpotlightCard>

      <SpotlightCard className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <Gauge size={16} className="text-[var(--color-ink-muted)]" />
        <div className="mt-3 font-mono text-2xl font-semibold tabular-nums text-[var(--color-ink)]">
          {cycleUsed}<span className="text-[var(--color-ink-faint)]">/70h</span>
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
          Cycle Used (Start)
        </div>
      </SpotlightCard>
    </div>
  );
}
