"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export type MobileHeaderProps = {
  title?: string;
  subtitle?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  borderless?: boolean;
};

export function MobileHeader({
  title,
  subtitle,
  leftSlot,
  rightSlot,
  showBackButton = false,
  onBack,
  borderless = false,
}: MobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <header
      className={[
        "flex items-center justify-between px-4 py-3 bg-transparent",
        borderless ? "" : "border-b border-white/10",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        {showBackButton && (
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={handleBack}
            className="rounded-full border border-white/15 p-1.5 text-white hover:border-white/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {leftSlot ? (
          <div className="min-w-0">{leftSlot}</div>
        ) : (
          <div className="min-w-0">
            {title && <p className="font-semibold text-white truncate">{title}</p>}
            {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">{rightSlot}</div>
    </header>
  );
}
