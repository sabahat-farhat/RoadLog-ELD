import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

type Tag = "div" | "h1" | "h2" | "h3" | "p" | "span";

interface Props {
  as?: Tag;
  className?: string;
  delay?: number;
  y?: number;
}

const MOTION_TAGS = { div: motion.div, h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p, span: motion.span };

export default function RevealText({ children, as = "div", className, delay = 0, y = 18 }: PropsWithChildren<Props>) {
  const MotionTag = MOTION_TAGS[as];
  return (
    <MotionTag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
