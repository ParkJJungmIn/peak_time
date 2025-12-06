"use client";

import type { ReactNode } from "react";

import { MobileHeader, type MobileHeaderProps } from "@/components/mobile/mobile-header";

type MobileScreenProps = {
  header?: MobileHeaderProps;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
};

export function MobileScreen({
  header,
  children,
  footer,
  maxWidthClassName = "max-w-md",
}: MobileScreenProps) {
  return (
    <div className="min-h-dvh bg-slate-950 text-white flex justify-center items-stretch px-0 py-0 sm:px-4 sm:py-6">
      <div
        className={[
          "w-full max-w-[430px] min-h-dvh flex flex-col overflow-hidden",
          "bg-slate-950 rounded-none sm:rounded-[28px] border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
          maxWidthClassName,
        ].join(" ")}
      >
        {header && (
          <div className="shrink-0 sticky top-0 z-20 px-4 pt-[calc(16px+env(safe-area-inset-top,0px))] pb-3 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 border-b border-white/5">
            <MobileHeader {...header} />
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col min-h-full px-4 py-6">
            <div className="flex-1">{children}</div>
            {footer && (
              <footer className="mt-auto pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
                {footer}
              </footer>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
