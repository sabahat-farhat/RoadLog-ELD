import type { PropsWithChildren, ElementType, CSSProperties } from "react";
import clsx from "clsx";

type Tag = "div" | "h1" | "h2" | "h3" | "p" | "span";

interface Props {
  as?: Tag;
  className?: string;
  delay?: number;
}

export default function RevealText({ children, as = "div", className, delay = 0 }: PropsWithChildren<Props>) {
  const Tag = as as ElementType;
  return (
    <Tag className={clsx("animate-fade-up", className)} style={{ animationDelay: `${delay}s` } as CSSProperties}>
      {children}
    </Tag>
  );
}
