"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { HeroShell } from "@/components/layouts/hero-shell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AnswerDetail } from "@/types/questionnaire";
import { useInsight } from "@/hooks/use-insight";

type State =
  | { status: "loading" }
  | {
      status: "ready";
      answeredDate: string | null;
      answers: AnswerDetail[];
    }
  | { status: "error"; message: string };

const formatDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export default function ArchiveDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [state, setState] = useState<State>({ status: "loading" });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editAnswers, setEditAnswers] = useState<Record<number, string>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const { loading: insightLoading, error: insightError, text: insight, html: insightHtml, requestInsight } =
    useInsight();

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
        const response = await fetch(`/api/answers/${groupId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "보관함 상세를 불러오지 못했습니다.");
        }

        setState({
          status: "ready",
          answeredDate: payload.answeredDate ?? null,
          answers: payload.answers ?? [],
        });
        const map: Record<number, string> = {};
        (payload.answers ?? []).forEach((a: AnswerDetail) => {
          map[a.questionId] = a.answerText;
        });
        setEditAnswers(map);
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "오류가 발생했습니다.",
        });
      }
    };

    void load();
  }, [groupId, router, supabase]);

  const header = (
    <div className="flex items-center justify-between px-4 py-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-full border border-white/15 p-2 text-white hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
        aria-label="뒤로가기"
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
      <div className="rounded-full bg-black/50 border border-white/15 px-4 py-2 text-sm font-semibold shadow-[0_0_20px_rgba(255,70,20,0.3)]">
        🔥 피크타임
      </div>
      <button
        type="button"
        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80"
      >
        ☆ 즐겨찾기
      </button>
    </div>
  );

  if (state.status === "loading") {
    return (
      <HeroShell tagline={null} footerLinks={[]} header={header}>
        <div className="px-6 py-8 text-center text-sm text-slate-300">불러오는 중…</div>
      </HeroShell>
    );
  }

  if (state.status === "error") {
    return (
      <HeroShell tagline={null} footerLinks={[]} header={header}>
        <div className="px-6 py-8 text-center text-sm text-red-300">{state.message}</div>
      </HeroShell>
    );
  }

  const title =
    state.answers[0]?.questionText ?? state.answers[0]?.answerText.slice(0, 30) ?? "";

  const buildPrompt = () => {
    const lines = state.answers.map(
      (answer, idx) =>
        `${idx + 1}. 질문: ${answer.questionText ?? "질문"}\n답변: ${
          editAnswers[answer.questionId] ?? answer.answerText
        }`,
    );
    return lines.join("\n\n");
  };

  const handleInsight = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const prompt = buildPrompt();
      if (!prompt.trim()) {
        setStatusMessage("전송할 프롬프트가 없습니다.");
        return;
      }
      await requestInsight(prompt);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "인사이트 생성 중 오류가 발생했습니다.",
      );
    }
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
    setStatusMessage("");
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setEditAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSave = async () => {
    if (!state.answers.length) return;
    setSaving(true);
    setStatusMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const payload = state.answers.map((answer) => ({
        questionId: answer.questionId,
        answerText: editAnswers[answer.questionId] ?? answer.answerText,
      }));

      const response = await fetch(`/api/answers/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ answers: payload }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "수정에 실패했습니다.");
      }

      setState((prev) =>
        prev.status === "ready"
          ? {
              ...prev,
              answers: prev.answers.map((answer) => ({
                ...answer,
                answerText: editAnswers[answer.questionId] ?? answer.answerText,
              })),
            }
          : prev,
      );
      setIsEditing(false);
      setStatusMessage("메모가 수정되었습니다.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "수정 중 오류가 발생했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <HeroShell tagline={null} footerLinks={[]} header={header}>
      <div className="px-6 pb-6 space-y-4 pt-2">
        <div className="space-y-1">
          <p className="text-sm text-white/50">{formatDate(state.answeredDate)}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>

        <div className="space-y-4">
          {state.answers.map((answer, index) => (
            <div
              key={answer.questionId ?? index}
              className="rounded-3xl border border-white/10 bg-[#101014] p-5 space-y-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
            >
              <p className="text-sm font-semibold text-white/80">
                {index + 1}. {answer.questionText ?? "질문"}
              </p>
              {isEditing ? (
                <textarea
                  className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-[#ff8237]/70 resize-none"
                  rows={4}
                  value={editAnswers[answer.questionId] ?? answer.answerText}
                  onChange={(e) => handleAnswerChange(answer.questionId, e.target.value)}
                />
              ) : (
                <p className="text-base leading-relaxed text-white">
                  {editAnswers[answer.questionId] ?? answer.answerText}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-8 pb-4">
          <div className="space-y-3 rounded-3xl border border-[#ff4f37]/40 bg-[#0d0d10] p-4">
            <div className="flex items-center gap-2 text-[#ffb347] font-semibold">
              ✨ AI 인사이트
              {insightLoading && <span className="text-xs text-white/60">생성 중…</span>}
            </div>
            {insightError && <p className="text-sm text-red-300">{insightError}</p>}
            {insight ? (
              <div
                className="text-sm text-white leading-relaxed space-y-2"
                dangerouslySetInnerHTML={{ __html: insightHtml || insight }}
              />
            ) : (
              <p className="text-sm text-white/70">
                질문과 답변을 기반으로 인사이트를 생성합니다.
              </p>
            )}
            <button
              type="button"
              onClick={handleInsight}
              disabled={insightLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#ff8237] via-[#ff6737] to-[#ff4f37] py-3 text-center font-semibold text-sm shadow-[0_15px_35px_rgba(255,80,40,0.45)] disabled:opacity-60"
            >
              {insightLoading ? "생성 중…" : "✨ AI에게 인사이트 받기 →"}
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-semibold text-white/80"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    className="flex-1 rounded-2xl bg-gradient-to-r from-[#ff8237] via-[#ff6737] to-[#ff4f37] py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(255,80,40,0.35)] disabled:opacity-60"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "저장 중…" : "저장하기"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-semibold text-white/80"
                    onClick={handleEditToggle}
                  >
                    메모 수정하기
                  </button>
                  <button className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-semibold text-white/80">
                    삭제
                  </button>
                </>
              )}
            </div>
            {statusMessage && (
              <p className="text-xs text-center text-white/70">{statusMessage}</p>
            )}
          </div>
        </div>
      </div>
    </HeroShell>
  );
}
