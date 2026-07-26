import { forwardRef } from "react";
import type { DailyLog, DutyStatus } from "../types";

const ROW_ORDER: DutyStatus[] = ["off_duty", "sleeper_berth", "driving", "on_duty"];
const ROW_LABELS: Record<DutyStatus, [string, string]> = {
  off_duty: ["1.", "Off Duty"],
  sleeper_berth: ["2.", "Sleeper Berth"],
  driving: ["3.", "Driving"],
  on_duty: ["4.", "On Duty (Not Driving)"],
};

const COL_W = 24;
const ROW_H = 30;
const LEFT_W = 128;
const TOTALS_W = 50;
const TOP_LABEL_H = 16;
const BOTTOM_LABEL_H = 16;
const GRID_W = 24 * COL_W;
const GRID_H = ROW_ORDER.length * ROW_H;
const PAD = 20;

const SVG_W = LEFT_W + GRID_W + TOTALS_W + PAD * 2;
const SVG_H = TOP_LABEL_H + GRID_H + BOTTOM_LABEL_H + PAD * 2;

// Exact pixel width the card needs to fit the SVG grid without horizontal
// scroll — used when exporting to PNG/PDF so the capture uses a known-good
// fixed width instead of letting the browser guess a "max-content" size
// (which can blow up unpredictably with a nested overflow-x-auto child).
export const LOGSHEET_EXPORT_WIDTH = SVG_W + 64;

function hourLabel(h: number) {
  if (h === 0 || h === 24) return "Mid night";
  if (h === 12) return "Noon";
  return String(h);
}

function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function x(hour: number) {
  return PAD + LEFT_W + hour * COL_W;
}

function rowY(status: DutyStatus, center = true) {
  const idx = ROW_ORDER.indexOf(status);
  return PAD + TOP_LABEL_H + idx * ROW_H + (center ? ROW_H / 2 : 0);
}

interface Props {
  log: DailyLog;
  dayIndex: number;
  totalDays: number;
  meta: {
    currentLabel: string;
    pickupLabel: string;
    dropoffLabel: string;
  };
}

const LogSheet = forwardRef<HTMLDivElement, Props>(({ log, dayIndex, totalDays, meta }, ref) => {
  const points: { x: number; y: number }[] = [];
  const sorted = [...log.segments].sort((a, b) => a.start_hour - b.start_hour);
  for (const seg of sorted) {
    points.push({ x: x(seg.start_hour), y: rowY(seg.status) });
    points.push({ x: x(seg.end_hour), y: rowY(seg.status) });
  }
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const gridTop = PAD + TOP_LABEL_H;
  const gridBottom = gridTop + GRID_H;
  const gridLeft = PAD + LEFT_W;
  const gridRight = gridLeft + GRID_W;

  const [dateY, dateM, dateD] = log.date.split("-");

  return (
    <div ref={ref} className="rounded-2xl bg-white p-5 text-black shadow-2xl sm:p-7">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-black/50">
            Driver's Daily Log &middot; Day {dayIndex + 1} of {totalDays}
          </div>
          <div className="mt-0.5 text-xl font-extrabold tracking-tight">
            {dateM}/{dateD}/{dateY}
          </div>
        </div>
        <div className="text-right text-[11px] leading-relaxed text-black/60">
          <div>
            <span className="font-semibold text-black/80">From:</span> {meta.currentLabel}
          </div>
          <div>
            <span className="font-semibold text-black/80">To:</span> {meta.dropoffLabel}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoBox label="Total Miles Today" value={`${log.total_miles.toFixed(1)} mi`} />
        <InfoBox label="Carrier" value="RoadLog ELD (Demo)" />
        <InfoBox label="Vehicle" value="Unit — Auto Route" />
        <InfoBox label="Shipper / Commodity" value={meta.pickupLabel} />
      </div>

      <div className="overflow-x-auto" data-lenis-prevent>
        <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="min-w-[760px]">
          {/* top hour labels */}
          {Array.from({ length: 25 }, (_, h) => (
            <text
              key={`top-${h}`}
              x={x(h)}
              y={PAD + TOP_LABEL_H - 5}
              fontSize={8.5}
              textAnchor="middle"
              fill="#111"
              fontFamily="var(--font-mono)"
            >
              {hourLabel(h)}
            </text>
          ))}

          {/* row labels */}
          {ROW_ORDER.map((status) => (
            <text
              key={`label-${status}`}
              x={PAD + LEFT_W - 8}
              y={rowY(status) + 3}
              fontSize={10.5}
              textAnchor="end"
              fill="#111"
              fontWeight={600}
            >
              {ROW_LABELS[status][0]} {ROW_LABELS[status][1]}
            </text>
          ))}

          {/* vertical hour + quarter lines */}
          {Array.from({ length: 24 }, (_, h) => (
            <g key={`vg-${h}`}>
              {[0.25, 0.5, 0.75].map((q) => (
                <line
                  key={q}
                  x1={x(h + q)}
                  x2={x(h + q)}
                  y1={gridTop}
                  y2={gridBottom}
                  stroke="#000"
                  strokeOpacity={0.12}
                  strokeWidth={0.6}
                />
              ))}
              <line x1={x(h)} x2={x(h)} y1={gridTop} y2={gridBottom} stroke="#000" strokeOpacity={0.4} strokeWidth={0.8} />
            </g>
          ))}
          <line x1={gridRight} x2={gridRight} y1={gridTop} y2={gridBottom} stroke="#000" strokeOpacity={0.4} strokeWidth={0.8} />

          {/* horizontal row lines */}
          {ROW_ORDER.map((status, i) => (
            <line
              key={`h-${status}`}
              x1={gridLeft}
              x2={gridRight}
              y1={gridTop + i * ROW_H}
              y2={gridTop + i * ROW_H}
              stroke="#000"
              strokeOpacity={0.5}
              strokeWidth={0.8}
            />
          ))}
          <line x1={gridLeft} x2={gridRight} y1={gridBottom} y2={gridBottom} stroke="#000" strokeOpacity={0.5} strokeWidth={0.8} />

          {/* outer border */}
          <rect x={gridLeft} y={gridTop} width={GRID_W} height={GRID_H} fill="none" stroke="#000" strokeWidth={1.4} />

          {/* the duty-status step line */}
          <polyline points={polylinePoints} fill="none" stroke="#dc2626" strokeWidth={2.25} strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={1.6} fill="#dc2626" />
          ))}

          {/* bottom hour labels */}
          {Array.from({ length: 25 }, (_, h) => (
            <text
              key={`bot-${h}`}
              x={x(h)}
              y={gridBottom + BOTTOM_LABEL_H - 4}
              fontSize={8.5}
              textAnchor="middle"
              fill="#111"
              fontFamily="var(--font-mono)"
            >
              {hourLabel(h)}
            </text>
          ))}

          {/* totals column */}
          <text x={gridRight + TOTALS_W / 2} y={PAD + TOP_LABEL_H - 5} fontSize={8} textAnchor="middle" fill="#111" fontWeight={700}>
            Total
          </text>
          {ROW_ORDER.map((status) => (
            <text
              key={`tot-${status}`}
              x={gridRight + TOTALS_W / 2}
              y={rowY(status) + 3}
              fontSize={11}
              textAnchor="middle"
              fill="#111"
              fontFamily="var(--font-mono)"
              fontWeight={700}
            >
              {log.totals[status].toFixed(2)}
            </text>
          ))}
          <line x1={gridRight} x2={gridRight + TOTALS_W} y1={gridBottom} y2={gridBottom} stroke="#000" strokeWidth={1} />
          <text
            x={gridRight + TOTALS_W / 2}
            y={gridBottom + 12}
            fontSize={9}
            textAnchor="middle"
            fill="#111"
            fontWeight={700}
          >
            {(24).toFixed(0)}h
          </text>
        </svg>
      </div>

      <div className="mt-5 border-t border-black/10 pt-4">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-black/60">Remarks</div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] text-black/70">
          {log.remarks.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-black">{fmtHour(r.time_hour)}</span>
              <span>
                {r.label}
                {r.location ? ` — ${r.location}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

LogSheet.displayName = "LogSheet";

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2">
      <div className="text-[9.5px] font-semibold uppercase tracking-wide text-black/45">{label}</div>
      <div className="truncate text-[12px] font-semibold text-black/85">{value}</div>
    </div>
  );
}

export default LogSheet;
