import { useRef, type ButtonHTMLAttributes, type PropsWithChildren } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { strength?: number };

export default function MagneticButton({
  children,
  className,
  strength = 14,
  ...rest
}: PropsWithChildren<Props>) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.4 });

  function handleMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el || rest.disabled) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set((relX / rect.width) * strength);
    y.set((relY / rect.height) * strength);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      className={clsx(className)}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}
