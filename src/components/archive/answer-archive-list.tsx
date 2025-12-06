"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AnswerGroupSummary } from "@/types/questionnaire";

type State =
  | { status: "loading" }
  | { status: "ready"; groups: AnswerGroupSummary[] }
  | { status: "empty" }
  | { status: "error"; message: string };

const formatDate = (value: string | null) => {
  if (!value) {
    return "알 수 없음";
  }

  const date = new Date(value);
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

export function AnswerArchiveList() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch("/api/answers", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "보관함을 불러오지 못했습니다.");
        }

        if (!payload.groups?.length) {
          setState({ status: "empty" });
          return;
        }

        setState({ status: "ready", groups: payload.groups });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "오류가 발생했습니다.",
        });
      }
    };

    void load();
  }, [router, supabase]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-20 rounded-2xl bg-slate-900 animate-pulse border border-white/5"
          />
        ))}
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="text-center text-sm text-slate-400 rounded-2xl border border-white/10 py-10">
        아직 작성된 기록이 없습니다.
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="text-center text-sm text-red-300 rounded-2xl border border-white/10 py-10">
        {state.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.groups.map((group) => (
        <button
          key={group.answerGroupId}
          onClick={() => router.push(`/archive/${group.answerGroupId}`)}
          className="w-full text-left rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-2 hover:border-white/30 transition"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {formatDate(group.answeredDate)}
          </p>
          <p className="text-base font-semibold text-white/90 leading-snug">
            {group.preview}
          </p>
          <p className="text-xs text-slate-500">
            {group.questionText ?? "질문"} · {group.totalAnswers}개의 답변
          </p>
        </button>
      ))}
    </div>
  );
}
