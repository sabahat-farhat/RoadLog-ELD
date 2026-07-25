import { useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Download, FileDown, ArrowLeft, Loader2, MapPinOff } from "lucide-react";
import type { Trip } from "../types";
import StatsCards from "../components/StatsCards";
import RouteMap from "../components/RouteMap";
import StopTimeline from "../components/StopTimeline";
import LogSheet from "../components/LogSheet";
import MagneticButton from "../components/ui/MagneticButton";
import RevealText from "../components/ui/RevealText";

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-[11px] text-[var(--color-accent)]">{n}</span>
      <span className="h-px flex-1 bg-[var(--color-line)]" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">{title}</span>
    </div>
  );
}

export default function ResultsPage() {
  // Stateless app: the trip that was just computed rides in via router state
  // (set by HomePage on navigate) rather than being fetched by an id. That
  // means a direct link or a page refresh won't have it — handled below with
  // an empty state rather than an error, since it's an expected case, not a
  // failure.
  const location = useLocation();
  const trip = (location.state as { trip?: Trip } | null)?.trip ?? null;
  const sheetRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [exportingAll, setExportingAll] = useState(false);

  // On narrow viewports the log sheet's hour grid scrolls horizontally inside
  // its card (by design, for on-screen use). html-to-image only rasterizes what's
  // visible, so a naive capture crops the grid. Fix: temporarily force the card
  // to its natural full width (overriding the responsive clipping) before
  // capturing, then restore it so on-screen layout is untouched.
  async function captureLogSheet(node: HTMLDivElement) {
    const prevWidth = node.style.width;
    const prevMaxWidth = node.style.maxWidth;
    node.style.width = "max-content";
    node.style.maxWidth = "none";
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      return await toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff", skipFonts: true });
    } finally {
      node.style.width = prevWidth;
      node.style.maxWidth = prevMaxWidth;
    }
  }

  async function downloadDayPng(dayIndex: number, date: string) {
    const node = sheetRefs.current[dayIndex];
    if (!node) return;
    const dataUrl = await captureLogSheet(node);
    const link = document.createElement("a");
    link.download = `daily-log-${date}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function downloadAllPdf() {
    if (!trip) return;
    setExportingAll(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 24;

      for (let i = 0; i < trip.daily_logs.length; i++) {
        const node = sheetRefs.current[i];
        if (!node) continue;
        const dataUrl = await captureLogSheet(node);
        const img = new Image();
        img.src = dataUrl;
        await new Promise((res) => (img.onload = res));
        const availW = pageW - margin * 2;
        const availH = pageH - margin * 2;
        const scale = Math.min(availW / img.width, availH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        if (i > 0) doc.addPage();
        doc.addImage(dataUrl, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
      }
      const dest = trip?.dropoff_label.split(",")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      doc.save(`eld-logs-${dest || "trip"}.pdf`);
    } finally {
      setExportingAll(false);
    }
  }

  if (!trip) {
    return (
      <div className="mx-auto flex min-h-[60svh] max-w-md flex-col items-center justify-center px-6 text-center">
        <MapPinOff size={26} className="mb-4 text-[var(--color-ink-faint)]" />
        <h1 className="font-display text-lg font-semibold text-[var(--color-ink)]">No trip loaded</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Results aren't saved between visits — plan a trip and you'll land here with it.
        </p>
        <Link
          to="/"
          className="mt-6 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-[var(--color-accent-ink)] transition hover:brightness-110"
        >
          Plan a trip
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-line)] pb-6">
        <div>
          <Link to="/" className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)]">
            <ArrowLeft size={13} /> Plan another trip
          </Link>
          <h1 className="font-display text-[1.9rem] font-semibold tracking-tight text-[var(--color-ink)]">
            {trip.current_label.split(",")[0]} <span className="text-[var(--color-accent)]">&rarr;</span>{" "}
            {trip.pickup_label.split(",")[0]} <span className="text-[var(--color-accent)]">&rarr;</span>{" "}
            {trip.dropoff_label.split(",")[0]}
          </h1>
        </div>
        <MagneticButton
          onClick={downloadAllPdf}
          disabled={exportingAll}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-bold text-[var(--color-accent-ink)] transition-shadow hover:shadow-[0_8px_28px_-8px_var(--color-accent)] disabled:opacity-50"
        >
          {exportingAll ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
          Download All Logs (PDF)
        </MagneticButton>
      </div>

      <div className="mb-10">
        <StatsCards
          totalMiles={trip.total_miles}
          totalDriveHours={trip.total_drive_hours}
          totalDays={trip.total_days}
          cycleUsed={trip.current_cycle_used}
        />
      </div>

      <RevealText>
        <SectionLabel n="01" title="Route Overview" />
      </RevealText>
      <div className="mb-10 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <RouteMap
          route={trip.route_geometry}
          stops={trip.stops}
          current={{ label: trip.current_label, lat: trip.current_lat, lon: trip.current_lon }}
          className="h-[420px] overflow-hidden rounded-2xl border border-[var(--color-line)]"
        />
        <div className="flex flex-col gap-4">
          <MapLegend />
        </div>
      </div>

      <RevealText>
        <SectionLabel n="02" title="Trip Timeline" />
      </RevealText>
      <div className="mb-10">
        <StopTimeline stops={trip.stops} currentLabel={trip.current_label} />
      </div>

      <RevealText>
        <SectionLabel n="03" title="Daily Log Sheets" />
      </RevealText>
      <div className="flex flex-col gap-8">
        {trip.daily_logs.map((log, i) => (
          <div key={log.date} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 4) * 0.08}s` }}>
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => downloadDayPng(i, log.date)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-ink)]"
              >
                <Download size={13} /> PNG
              </button>
            </div>
            <LogSheet
              ref={(el) => {
                sheetRefs.current[i] = el;
              }}
              log={log}
              dayIndex={i}
              totalDays={trip.daily_logs.length}
              meta={{
                currentLabel: trip.current_label,
                pickupLabel: trip.pickup_label,
                dropoffLabel: trip.dropoff_label,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MapLegend() {
  const items: { color: string; label: string }[] = [
    { color: "#4fd1c5", label: "Start / Pickup" },
    { color: "#4ade80", label: "Drop-off" },
    { color: "#ff6a39", label: "Fuel Stop (every 1,000 mi)" },
    { color: "#6b7280", label: "30-min Break" },
    { color: "#a78bfa", label: "10-hr Rest" },
    { color: "#f87171", label: "34-hr Restart" },
  ];
  return (
    <div className="flex-1 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Map Legend</div>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-sm text-[var(--color-ink-muted)]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
