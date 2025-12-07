"use client";

import type { ReactNode } from "react";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  tone?: "card" | "panel";
};

export function Surface({ children, className, tone = "card" }: SurfaceProps) {
  const styles =
    tone === "panel"
      ? "bg-[#101014]  border-white/10"
      : "bg-[var(--card-bg)]  border-[var(--card-border)] shadow-[var(--card-shadow)]";

  return (
    <div
      className={[
        "rounded-[var(--card-radius)]",
        styles,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
