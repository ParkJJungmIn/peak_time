"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("세션을 확인하는 중입니다…");
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (hasExchanged.current) {
      return;
    }

    hasExchanged.current = true;

    const exchangeCode = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.href,
      );

      if (error) {
        setMessage(error.message);
        return;
      }

      const email = data.session?.user?.email;
      setMessage(email ? `${email} 님 환영합니다.` : "로그인 성공");

      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    };

    void exchangeCode();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 px-8 py-6 text-center space-y-2">
        <p className="text-sm text-slate-300">{message}</p>
        <p className="text-xs text-slate-500">
          잠시 후 로그인 페이지로 이동합니다…
        </p>
      </div>
    </div>
  );
}
