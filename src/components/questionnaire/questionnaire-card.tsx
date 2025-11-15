"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  | { status: "submitted" }
  | { status: "error"; message: string };

export default function QuestionnaireCard() {
  const [state, setState] = useState<CardState>({ status: "loading" });
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

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
            })),
          }),
        });

        setState({ status: "submitted" });
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
      <section className="px-6 py-8">
        <div className="rounded-[28px] bg-gradient-to-b from-[#1b1b1f] to-[#0f0f12] p-6 border border-white/5 text-center space-y-3">
          <p className="text-xl font-semibold">오늘의 루틴 완료!</p>
          <p className="text-sm text-white/60">답변이 저장되었습니다.</p>
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
          <p className="text-sm text-white/60 mt-3">
            {state.currentQuestion.questionGroup}
          </p>
        </div>

        <textarea
          rows={5}
          value={state.answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="rounded-2xl border border-white/10 bg-black/30 p-4 min-h-[120px] text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-[#ff8237]/70"
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
