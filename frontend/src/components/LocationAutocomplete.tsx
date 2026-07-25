import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { searchLocations, type GeocodeResult } from "../api/client";
import { useDebounce } from "../hooks/useDebounce";

interface Props {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: GeocodeResult | null;
  onChange: (value: GeocodeResult | null) => void;
}

export default function LocationAutocomplete({ label, placeholder, icon, value, onChange }: Props) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const controller = new AbortController();
    if (debouncedQuery.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchLocations(debouncedQuery, controller.signal)
      .then((r) => setResults(r))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(r: GeocodeResult) {
    skipNextSearch.current = true;
    onChange(r);
    setQuery(r.label);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 transition-colors ${
          value ? "border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]" : "border-[var(--color-line)] bg-[var(--color-surface-2)] focus-within:border-[var(--color-accent)]/50"
        }`}
      >
        <span className="text-[var(--color-ink-muted)]">{icon}</span>
        <input
          className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {loading && <Loader2 size={14} className="animate-spin text-[var(--color-ink-faint)]" />}
      </div>

      {open && (query.trim().length >= 3) && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl">
          {results.length === 0 && !loading && (
            <div className="px-3.5 py-3 text-sm text-[var(--color-ink-faint)]">No matches found</div>
          )}
          {results.map((r, i) => (
            <button
              type="button"
              key={`${r.lat}-${r.lon}-${i}`}
              onClick={() => select(r)}
              className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-white/5"
            >
              <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
              <span className="text-[var(--color-ink-muted)]">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
