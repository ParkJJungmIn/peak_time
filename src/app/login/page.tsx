"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { Provider } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { MobileScreen } from "@/components/mobile/mobile-screen";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const providers: Array<{ name: string; provider: Provider }> = [
  { name: "Google로 계속하기", provider: "google" },
  { name: "Kakao로 계속하기", provider: "kakao" },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authCheckMessage, setAuthCheckMessage] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(false);

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

  const handleOAuth = useCallback(
    async (provider: Provider) => {
      setStatusMessage("");
      setLoadingProvider(provider);

      try {
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
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

  const handleAuthorizationCheck = useCallback(async () => {
    setCheckingAuth(true);
    setAuthCheckMessage("");

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!session) {
        setAuthCheckMessage("세션이 없습니다. 다시 로그인해 주세요.");
        return;
      }

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: session.access_token }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setAuthCheckMessage(
          payload?.error ?? "인가 확인에 실패했습니다. 관리자에게 문의하세요.",
        );
        return;
      }

      setAuthCheckMessage(`인가 확인 완료: ${payload.user.email ?? "알 수 없음"}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "인가 확인 중 오류가 발생했습니다.";
      setAuthCheckMessage(message);
    } finally {
      setCheckingAuth(false);
    }
  }, [supabase]);

  const headerRight = useMemo(
    () => (
      <button
        type="button"
        onClick={() => router.push("/questionnaire")}
        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold hover:border-white/40"
      >
        보관함
      </button>
    ),
    [router],
  );

  return (
    <MobileScreen
      header={{
        leftSlot: (
          <div>
            <p className="text-lg font-semibold">Memo</p>
            <p className="text-xs text-slate-400">당신의 생각 저장소</p>
          </div>
        ),
        rightSlot: headerRight,
      }}
    >
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Memo Project
          </p>
          <div>
            <h1 className="text-3xl font-semibold">로그인</h1>
            <p className="text-sm text-slate-400 mt-1">
              Kakao 또는 Google 계정으로 안전하게 로그인하세요.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          {providers.map(({ name, provider }) => (
            <button
              key={provider}
              type="button"
              onClick={() => handleOAuth(provider)}
              disabled={loadingProvider !== null}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-slate-900 py-3 font-medium hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingProvider === provider ? "연결 중…" : name}
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 p-4 bg-slate-900/40 space-y-2">
          <p className="text-sm font-semibold text-white">상태</p>
          <p className="text-sm text-slate-300 min-h-[24px]">
            {statusMessage || "아직 로그인되지 않았습니다."}
          </p>
          {sessionEmail && (
            <p className="text-xs text-emerald-400">세션 이메일: {sessionEmail}</p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">인가 인증 확인</p>
            <button
              type="button"
              onClick={handleAuthorizationCheck}
              disabled={checkingAuth}
              className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 disabled:opacity-60"
            >
              {checkingAuth ? "확인 중…" : "확인하기"}
            </button>
          </div>
          <div className="min-h-[48px] rounded-2xl border border-white/10 p-3 bg-slate-900/40 text-sm text-slate-200">
            {authCheckMessage || "확인하기를 누르면 현재 세션의 인가를 검증합니다."}
          </div>
        </section>

        <p className="text-xs text-center text-slate-500">
          최초 로그인 시 Supabase 대시보드에서 Kakao/Google OAuth를 활성화하고
          callback URL에 `https://YOUR_DOMAIN/auth/callback`을 등록하세요.
        </p>
      </div>
    </MobileScreen>
  );
}
