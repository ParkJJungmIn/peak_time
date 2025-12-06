"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type HeroHeaderProps = {
  leftLabel?: ReactNode;
  rightLabel?: ReactNode;
  leftHref?: string;
  rightHref?: string;
  className?: string;
};

const baseButton =
  "rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold shadow-[0_0_20px_rgba(255,70,20,0.3)]";

export function HeroHeader({
  leftLabel = "🔥 피크타임",
  rightLabel = "보관함",
  leftHref = "/",
  rightHref = "/archive",
  className = "",
}: HeroHeaderProps) {
  return (
    <div
      className={[
        "flex items-center justify-between px-5 pt-5 pb-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        href={leftHref}
        className={`${baseButton} bg-black/50 text-white hover:border-white/30`}
      >
        {leftLabel}
      </Link>
      <Link
        href={rightHref}
        className={`${baseButton} bg-black/40 text-[#ff8a9a] hover:border-white/30`}
      >
        {rightLabel}
      </Link>
    </div>
  );
}
