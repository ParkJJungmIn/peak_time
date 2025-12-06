"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import type { Question } from "@/types/questionnaire";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CardState =
  | { status: "loading" }
  | { status: "requires-login" }
  | {
      status: "ready";
      currentQuestion: Question;
      currentIndex: number;
      totalQuestions: number;
      answer: string;
      submitting: boolean;
    }
  | { status: "empty" }
  | { status: "submitted"; answerGroupId?: string }
  | { status: "error"; message: string };

const ideaHints = [
  "불편이 사라지면 어떤 사람들이 제일 좋아할까요?",
  "비슷하게 느낀 적이 다른 영역(학교, 직장, 온라인 등)에도 있나요?",
  "시간이 지나도 같은 패턴이 계속될까요?",
  "산업에 비유한다면 어떤 모습일까요?",
  "이건 사람(운영자, 시스템, 환경) 중 어디의 문제로 보이나요?",
];

export default function QuestionnaireCard() {
  const [state, setState] = useState<CardState>({ status: "loading" });
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setState({ status: "requires-login" });
        return;
      }

      try {
        const response = await fetch("/api/questionnaire", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "질문을 불러오지 못했습니다.");
        }

        if (!payload.questions?.length) {
          setState({ status: "empty" });
          return;
        }

        setQuestions(payload.questions);
        setState({
          status: "ready",
          currentQuestion: payload.questions[0],
          currentIndex: 0,
          totalQuestions: payload.questions.length,
          answer: "",
          submitting: false,
        });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "오류가 발생했습니다.",
        });
      }
    };

    void init();
  }, [supabase]);

  const handleAnswerChange = (value: string) => {
    if (state.status !== "ready") return;
    setState({ ...state, answer: value });
  };

  const handleNext = useCallback(async () => {
    if (state.status !== "ready") return;
    if (!state.answer.trim()) {
      setState({ ...state, submitting: false });
      return;
    }

    const currentQuestion = state.currentQuestion;
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: state.answer,
    };
    setAnswers(updatedAnswers);

    if (state.currentIndex === state.totalQuestions - 1) {
      try {
        setState({ ...state, submitting: true });
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setState({ status: "requires-login" });
          return;
        }

        const groupId = uuid();

        await fetch("/api/questionnaire", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            answers: Object.entries(updatedAnswers).map(([questionId, answerText]) => ({
              questionId: Number(questionId),
              answerText,
              answerGroupId: groupId,
            })),
          }),
        }).then(async (res) => {
          const payload = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(payload?.error ?? "제출에 실패했습니다.");
          }
          return payload;
        });

        setState({ status: "submitted", answerGroupId: groupId });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "제출 중 오류가 발생했습니다.",
        });
      }
      return;
    }

    const nextIndex = state.currentIndex + 1;
    setState({
      status: "ready",
      currentQuestion: questions[nextIndex],
      currentIndex: nextIndex,
      totalQuestions: state.totalQuestions,
      answer: updatedAnswers[questions[nextIndex].id] ?? "",
      submitting: false,
    });
  }, [answers, questions, state, supabase]);

  if (state.status === "loading") {
    return (
      <section className="px-6 py-8 space-y-5">
        <div className="rounded-[28px] bg-gradient-to-b from-[#1b1b1f] to-[#0f0f12] p-6 border border-white/5 animate-pulse h-48" />
      </section>
    );
  }

  if (state.status === "requires-login") {
    return (
      <section className="px-6 py-8">
        <div className="rounded-[28px] bg-black/40 border border-white/5 p-6 text-center text-sm text-white/70 space-y-3">
          <p>질문을 시작하려면 로그인해주세요.</p>
        </div>
      </section>
    );
  }

  if (state.status === "empty") {
    return (
      <section className="px-6 py-8">
        <div className="rounded-[28px] bg-black/40 border border-white/5 p-6 text-center text-sm text-white/70 space-y-3">
          등록된 질문이 없습니다.
        </div>
      </section>
    );
  }

  if (state.status === "submitted") {
    return (
      <section className="px-6 py-10">
        <div className="rounded-[32px] bg-gradient-to-b from-[#121214] to-[#0b0b0d] p-8 border border-white/5 text-center space-y-6 shadow-[0_35px_80px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-3xl">
              ✓
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">저장되었습니다!</p>
            <p className="text-sm text-white/70">
              당신의 불편이 피크보관함에 저장되었어요.
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full rounded-2xl bg-gradient-to-r from-[#ff8237] via-[#ff6737] to-[#ff4f37] py-3 text-center font-semibold text-lg shadow-[0_15px_35px_rgba(255,80,40,0.45)]"
              onClick={() => state.answerGroupId && router.push(`/archive/${state.answerGroupId}`)}
              disabled={!state.answerGroupId}
            >
              ✨✨ AI에게 인사이트 받기 →
            </button>
            <button
              type="button"
              onClick={() => router.push("/archive")}
              className="w-full rounded-2xl border border-white/20 py-3 text-center font-semibold text-white/80 hover:border-white/50 transition"
            >
              보관함으로 이동
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="px-6 py-8">
        <div className="rounded-[28px] bg-black/40 border border-white/5 p-6 text-center text-sm text-red-300 space-y-3">
          <p>{state.message}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8 space-y-5">
      <p className="text-xs uppercase tracking-[0.4em] text-white/40">
        Step {state.currentIndex + 1} / {state.totalQuestions}
      </p>
      <div className="rounded-[28px] bg-gradient-to-b from-[#1b1b1f] to-[#0f0f12] p-6 space-y-5 border border-white/5 shadow-[0_35px_80px_rgba(0,0,0,0.5)]">
        <div>
          <p className="text-xl font-semibold leading-snug">
            {state.currentQuestion.questionText}
          </p>
        </div>

        {state.currentIndex >= 1 && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowHints((prev) => !prev)}
              className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-left text-sm font-semibold text-white/80 flex items-center justify-between"
            >
              <span>💡 아이디어 확장을 도와드려요</span>
              <span className="text-xs text-white/60">{showHints ? "접기" : "펼치기"}</span>
            </button>
            {showHints && (
              <div className="space-y-2">
                {ideaHints.map((hint) => (
                  <div
                    key={hint}
                    className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white/80"
                  >
                    {hint}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <textarea
          rows={5}
          value={state.answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 min-h-[140px] text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-[#ff8237]/70 resize-none"
          placeholder="여기에 답변을 적어보세요…"
        />

        <button
          className="w-full rounded-2xl bg-gradient-to-r from-[#ff8237] via-[#ff6737] to-[#ff4f37] py-3 text-center font-semibold text-lg shadow-[0_15px_35px_rgba(255,80,40,0.45)]"
          onClick={handleNext}
        >
          {state.currentIndex === state.totalQuestions - 1 ? "제출하기" : "다음 질문 →"}
        </button>
      </div>
    </section>
  );
}
