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
    <div className="min-h-dvh bg-slate-950 text-white flex justify-center">
      <div
        className={[
          "w-full min-h-dvh flex flex-col",
          "bg-slate-950",
          maxWidthClassName,
        ].join(" ")}
      >
        {header && <MobileHeader {...header} />}
        <main className="flex-1 overflow-y-auto px-4 py-6">{children}</main>
        {footer && <footer className="px-4 pb-6">{footer}</footer>}
      </div>
    </div>
  );
}
