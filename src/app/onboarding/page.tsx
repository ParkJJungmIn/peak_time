"use client";

import { useEffect, useMemo, useState } from "react";
import type { Provider } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { HeroShell } from "@/components/layouts/hero-shell";
import { Surface } from "@/components/ui/surface";
import { useAuth } from "@/contexts/auth-context";

const slides: Array<{
  icon: string;
  title: string;
  description: string;
  extra?: React.ReactNode;
}> = [
  {
    icon: "😠",
    title: "일상의 불편,\n그냥 넘기지 마세요",
    description: "피크타임은 하루 불편했던 순간을 기록하는 앱입니다.\n작은 불편이 아이디어의 씨앗이 됩니다.",
  },
  {
    icon: "💡",
    title: "불편을 기록하면 패턴이 보입니다",
    description: "패턴이 보이면 사업의 기초가 돼요.",
    extra: (
      <Surface tone="panel" className="p-4 text-left text-sm text-white/80 space-y-2">
        <p className="text-xs text-white/60">기록 예시</p>
        <p className="font-semibold">오늘 하루, 가장 불편했던 순간은?</p>
        <p className="text-white/70">예: 점심시간 줄이 너무 길어요.</p>
      </Surface>
    ),
  },
  {
    icon: "✨",
    title: "기록된 불편에서 AI 인사이트를 얻을 수 있어요",
    description: "모든 불편이 보관함에 저장되고,\nAI가 간단한 인사이트를 제공해줘요.",
  },
];

export default function OnboardingPage() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { supabase, session } = useAuth();
  const current = slides[index];

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [router, session]);

  const progressDots = useMemo(
    () =>
      slides.map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i === index ? "bg-red-400" : "bg-white/30"
          }`}
        />
      )),
    [index],
  );

  const handleNext = async () => {
    if (index < slides.length - 1) {
      setIndex((prev) => Math.min(prev + 1, slides.length - 1));
      return;
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/` : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google" as Provider,
      options: {
        redirectTo,
        scopes: "email profile",
      },
    });

    if (error) {
      // Optional: surface error via alert; keeping silent to reduce UI noise
      // eslint-disable-next-line no-alert
      alert(error.message);
    }
  };

  return (
    <HeroShell tagline={null} footerLinks={[]} header={' '}>
      <div className="flex flex-col w-full h-full px-6 py-36 gap-6">
        <div className="relative flex-1 w-full overflow-hidden flex items-center">
          <div
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide) => (
              <div
                key={slide.title}
                className="w-full flex-shrink-0 flex flex-col items-center text-center gap-6"
              >
                <div className="text-3xl">{slide.icon}</div>
                <div className="space-y-3">
                  <h1 className="text-2xl font-bold whitespace-pre-line">{slide.title}</h1>
                  <p className="text-sm text-white/70 whitespace-pre-line">{slide.description}</p>
                </div>
                {slide.extra}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">{progressDots}</div>

        <div className="sticky bottom-6 w-full space-y-3">
          {index === slides.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-2xl bg-white text-black py-3 font-semibold shadow-[0_12px_35px_rgba(0,0,0,0.25)]"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.92h5.48c-.24 1.26-.98 2.33-2.08 3.04v2.54h3.36c1.97-1.82 3.1-4.5 3.1-7.7 0-.74-.07-1.45-.2-2.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21c2.8 0 5.16-.92 6.88-2.5l-3.36-2.54c-.94.63-2.14 1-3.52 1-2.7 0-4.98-1.82-5.8-4.27H2.7v2.68C4.42 18.98 7.94 21 12 21z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M6.2 12c0-.7.12-1.38.32-2.03V7.29H2.7A8.976 8.976 0 0 0 2 12c0 1.44.34 2.8.94 4.01L6.2 12z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12 5.52c1.52 0 2.9.52 3.98 1.54l2.98-2.98C17.16 2.64 14.8 1.7 12 1.7 7.94 1.7 4.42 3.72 2.7 7.29l3.82 2.68C7.02 7.34 9.3 5.52 12 5.52z"
                  />
                </svg>
                Google로 계속하기
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-2xl bg-black/40 border border-white/10 py-3 font-semibold text-white hover:border-white/40 transition"
            >
              다음 →
            </button>
          )}
        </div>
      </div>
    </HeroShell>
  );
}
