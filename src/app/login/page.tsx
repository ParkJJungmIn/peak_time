"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { Provider } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { HeroShell } from "@/components/layouts/hero-shell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const providers: Array<{ name: string; provider: Provider; icon?: React.ReactNode }> = [
  { name: "Google 로그인", provider: "google" },
];

const detectWebView = (ua: string) =>
  /FBAN|FBAV|Instagram|KAKAOTALK|NAVER|Line|WebView|wv/i.test(ua);

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      if (session?.user?.email) {
        setSessionEmail(session.user.email);
        setStatusMessage("이미 로그인 상태입니다.");
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setSessionEmail(session.user.email);
        setStatusMessage("로그인에 성공했습니다.");
        router.replace("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    const ua = typeof window !== "undefined" ? navigator.userAgent : "";
    setIsWebView(detectWebView(ua));
  }, []);

  const handleOpenExternal = () => {
    const ua = typeof window !== "undefined" ? navigator.userAgent : "";
    const url = typeof window !== "undefined" ? window.location.href.replace(/^http:/, "https:") : "";

    if (/android/i.test(ua) && url) {
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      setTimeout(() => {
        window.location.href = url;
      }, 800);
      return;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleOAuth = useCallback(
    async (provider: Provider) => {
      setStatusMessage("");
      setLoadingProvider(provider);

      try {
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/`
            : undefined;

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            scopes:
              provider === "google"
                ? "email profile"
                : "profile_nickname profile_image account_email",
          },
        });

        if (error) {
          setStatusMessage(error.message);
        } else {
          setStatusMessage("리다이렉트중…");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        setStatusMessage(message);
      } finally {
        setLoadingProvider(null);
      }
    },
    [supabase],
  );


  return (
    <HeroShell
      tagline={null}
      footerLinks={[
        "로그인 시 피크타임의 이용약관 및 개인정보 처리방침에 동의하게 됩니다.",
      ]}
      header={' '}
    >
      <div className="flex flex-col items-center text-center px-6 py-10 gap-10">
        <div className="space-y-3">
          <div className="text-2xl font-semibold flex items-center justify-center gap-2">
            <span>🔥</span>
            <span>피크타임</span>
          </div>
          <p className="text-sm text-white/60">
            당신의 불편을 아이디어로 바꾸는 5분 루틴
          </p>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold">시작할 준비가 되셨나요?</h1>
          <p className="text-base text-white/70 leading-relaxed">
            일상의 불편을 기록하고,{"\n"}나만의 사업 아이디어 씨앗을 모아보세요.
          </p>
        </div>

        <section className="w-full space-y-3">
          {providers.map(({ name, provider }) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleOAuth(provider)}
              disabled={loadingProvider !== null || isWebView}
              className="w-full flex items-center justify-center gap-3 rounded-[20px] bg-white text-slate-900 py-3.5 text-base font-semibold shadow-[0_12px_35px_rgba(0,0,0,0.25)] hover:bg-white/95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
              {loadingProvider === provider ? "연결 중…" : name}
            </button>
          ))}
        </section>

        {isWebView && (
          <div className="space-y-2 text-xs text-red-200">
            <p>인앱/웹뷰에서는 Google 로그인이 차단될 수 있습니다.</p>
            <button
              type="button"
              onClick={handleOpenExternal}
              className="w-full rounded-xl bg-white text-black py-2 font-semibold"
            >
              브라우저에서 열기
            </button>
          </div>
        )}

        <div className="space-y-2 text-xs text-white/60">
          <p>
            로그인 시 피크타임의{" "}
            <span className="text-indigo-300 font-semibold">이용약관</span> 및{" "}
            <span className="text-indigo-300 font-semibold">개인정보 처리방침</span>에
            동의하게 됩니다.
          </p>
          {statusMessage && <p className="text-red-300">{statusMessage}</p>}
          {sessionEmail && (
            <p className="text-emerald-300 text-xs">세션 이메일: {sessionEmail}</p>
          )}
        </div>
      </div>
    </HeroShell>
  );
}
