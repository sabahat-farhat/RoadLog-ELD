import { Link, useLocation } from "react-router-dom";
import { History, Plus } from "lucide-react";
import clsx from "clsx";

export default function Header() {
  const location = useLocation();

  const navLink = (to: string, label: string, icon: React.ReactNode) => {
    const active = location.pathname === to;
    return (
      <Link to={to} className="group relative flex items-center gap-1.5 px-1 py-1.5 text-[13px] font-semibold uppercase tracking-wide">
        <span className={clsx("flex items-center gap-1.5 transition-colors", active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)] group-hover:text-[var(--color-ink-muted)]")}>
          {icon}
          {label}
        </span>
        <span
          className={clsx(
            "absolute -bottom-[1px] left-0 h-[1.5px] bg-[var(--color-accent)] transition-all duration-300",
            active ? "w-full" : "w-0 group-hover:w-full"
          )}
        />
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-[1100]">
      <div className="h-[2px] w-full bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-dim)] to-transparent" />
      <div className="glass border-b border-[var(--color-line)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-display text-[19px] font-bold tracking-tight text-[var(--color-ink)]">
              RoadLog
            </span>
            <span className="font-mono text-[11px] font-medium text-[var(--color-accent)]">/ELD</span>
          </Link>

          <nav className="flex items-center gap-7">
            {navLink("/", "New Trip", <Plus size={13} />)}
            {navLink("/history", "History", <History size={13} />)}
          </nav>
        </div>
      </div>
    </header>
  );
}
