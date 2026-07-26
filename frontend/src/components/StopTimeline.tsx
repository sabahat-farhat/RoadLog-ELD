import { Fuel, Coffee, BedDouble, RotateCcw, PackageCheck, Flag, Navigation } from "lucide-react";
import type { Stop } from "../types";
import { formatTripTime } from "../lib/tripTime";

const META: Record<Stop["type"], { color: string; icon: typeof Fuel; label: string }> = {
  pickup: { color: "#4fd1c5", icon: PackageCheck, label: "Pickup" },
  dropoff: { color: "#4ade80", icon: Flag, label: "Drop-off" },
  fuel: { color: "#ff6a39", icon: Fuel, label: "Fuel" },
  break: { color: "#6b7280", icon: Coffee, label: "Break" },
  rest: { color: "#a78bfa", icon: BedDouble, label: "Rest" },
  restart: { color: "#f87171", icon: RotateCcw, label: "Restart" },
};

export default function StopTimeline({ stops, currentLabel }: { stops: Stop[]; currentLabel: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
        Trip Timeline
      </div>
      <div className="scrollbar-thin flex items-stretch gap-0 overflow-x-auto pb-1" data-lenis-prevent>
        <TimelineNode color="#4fd1c5" Icon={Navigation} label="Start" sub={currentLabel} first />
        {stops.map((s, i) => {
          const m = META[s.type];
          return (
            <TimelineNode
              key={i}
              color={m.color}
              Icon={m.icon}
              label={m.label}
              sub={s.label}
              time={formatTripTime(s.start, { weekday: "short", hour: "numeric", minute: "2-digit" })}
            />
          );
        })}
      </div>
    </div>
  );
}

function TimelineNode({
  color,
  Icon,
  label,
  sub,
  time,
  first,
}: {
  color: string;
  Icon: typeof Fuel;
  label: string;
  sub: string;
  time?: string;
  first?: boolean;
}) {
  return (
    <div className="flex min-w-[150px] items-start">
      {!first && <div className="mt-4 h-px w-6 shrink-0 self-start bg-[var(--color-line)]" />}
      <div className="flex flex-col items-start px-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
        >
          <Icon size={14} />
        </span>
        <span className="mt-2 text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
          {label}
        </span>
        <span className="max-w-[130px] truncate text-[11.5px] text-[var(--color-ink-muted)]" title={sub}>
          {sub}
        </span>
        {time && <span className="mt-0.5 text-[10px] text-[var(--color-ink-faint)]">{time}</span>}
      </div>
    </div>
  );
}
