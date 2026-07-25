import { useRef, type PropsWithChildren, type MouseEvent } from "react";
import clsx from "clsx";

interface Props {
  className?: string;
  spotlightColor?: string;
}

export default function SpotlightCard({
  children,
  className,
  spotlightColor = "255, 106, 57",
}: PropsWithChildren<Props>) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={clsx("group relative overflow-hidden", className)}
      style={{ "--spot-color": spotlightColor } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(480px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(var(--spot-color), 0.10), transparent 65%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
