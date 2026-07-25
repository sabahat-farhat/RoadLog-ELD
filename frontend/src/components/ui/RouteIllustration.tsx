import { motion } from "framer-motion";

const PATH = "M 20 340 C 90 340 100 260 160 240 C 240 214 260 120 340 100 C 400 86 420 40 460 20";

export default function RouteIllustration() {
  return (
    <svg viewBox="0 0 480 360" fill="none" className="h-full w-full" aria-hidden>
      <defs>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="var(--color-line)" strokeWidth="1" />
        </pattern>
        <linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="1" />
        </linearGradient>
      </defs>

      <rect width="480" height="360" fill="url(#grid)" opacity="0.5" />

      <motion.path
        d={PATH}
        stroke="url(#routeGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="8 8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      />

      {/* start pin */}
      <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <circle cx="20" cy="340" r="6" fill="var(--color-status-onduty)" />
        <circle cx="20" cy="340" r="11" fill="none" stroke="var(--color-status-onduty)" strokeWidth="1.5" opacity="0.4" />
      </motion.g>

      {/* mid pin (pickup) */}
      <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.1, duration: 0.4 }}>
        <circle cx="250" cy="207" r="5" fill="var(--color-ink)" />
      </motion.g>

      {/* end pin (dropoff) */}
      <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.9, duration: 0.5 }}>
        <circle cx="460" cy="20" r="7" fill="var(--color-accent)" />
        <circle cx="460" cy="20" r="13" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.5">
          <animate attributeName="r" values="10;18;10" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </motion.g>
    </svg>
  );
}
