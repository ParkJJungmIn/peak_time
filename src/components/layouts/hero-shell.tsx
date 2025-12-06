"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { HeroHeader } from "@/components/mobile/hero-header";
import { useAuth } from "@/contexts/auth-context";

const baseFooterLinks = ["피크타임 공유하기", "이용약관", "개인정보 보호정책", "문의하기"];

type HeroShellProps = {
  children: ReactNode;
  tagline?: ReactNode;
  footerLinks?: string[];
  header?: ReactNode;
};

export function HeroShell({
  children,
  tagline = "인생을 바꾸는 하루 5분 루틴",
  footerLinks = baseFooterLinks,
  header,
}: HeroShellProps) {
  const { session, signOut } = useAuth();
  const [hasSession, setHasSession] = useState(false);
  const computedLinks: string[] = Array.isArray(footerLinks) ? footerLinks : baseFooterLinks;
  const links: string[] = hasSession ? [...computedLinks, "로그아웃"] : [...computedLinks];

  useEffect(() => {
    setHasSession(Boolean(session));
  }, [session]);

  const handleFooterClick = async (label: string) => {
    if (label !== "로그아웃") return;
    await signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-dvh flex justify-center items-stretch px-0 py-0 text-white">
      <div className="relative w-full max-w-[430px] min-h-dvh  bg-gradient-to-b from-[#0d0d0f] to-[#040404]  border border-white/5 flex flex-col overflow-hidden">
        <div className="shrink-0 sticky top-0 z-20 rounded-t-[36px] bg-gradient-to-b from-[#0d0d0f] via-[#0d0d0f] to-transparent border-b border-white/10">
          {header ? (
            header
          ) : (
            <>
              <HeroHeader />
              {tagline && (
                <div className="text-center px-6 py-5 text-sm tracking-wide text-white/80 border-t border-white/10">
                  {tagline}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col min-h-full">
            <div className="flex-1">{children}</div>
            {links.length > 0 && (
              <footer className="mt-auto px-6 pb-[calc(32px+env(safe-area-inset-bottom,0px))] pt-6 space-y-4 text-center text-sm text-white/70 bg-gradient-to-b from-transparent to-[#040404]">
                {links.map((link) => (
                  <button
                    key={link}
                    type="button"
                    onClick={() => handleFooterClick(link)}
                    className="w-full hover:text-white transition-colors"
                  >
                    {link}
                  </button>
                ))}
              </footer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
