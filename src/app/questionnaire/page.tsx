"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { MobileScreen } from "@/components/mobile/mobile-screen";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Question } from "@/types/questionnaire";

export default function QuestionnairePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadQuestions = useCallback(
    async (token: string) => {
      setLoadingQuestions(true);
      setStatusMessage("");

      try {
        const response = await fetch("/api/questionnaire", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "질문을 불러오지 못했습니다.");
        }

        setQuestions(payload.questions);
        setCurrentIndex(0);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        setStatusMessage(message);
      } finally {
        setLoadingQuestions(false);
      }
    },
    [],
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setSession(session);
      await loadQuestions(session.access_token);
    };

    void init();
  }, [loadQuestions, router, supabase]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = async () => {
    if (!currentQuestion) {
      return;
    }

    if (!answers[currentQuestion.id] || answers[currentQuestion.id].trim().length === 0) {
      setStatusMessage("답변을 입력해주세요.");
      return;
    }

    setStatusMessage("");

    if (isLastQuestion) {
      await handleSubmit();
      return;
    }

    setCurrentIndex((index) => Math.min(index + 1, totalQuestions - 1));
  };

  const handlePrevious = () => {
    setStatusMessage("");
    setCurrentIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async () => {
    if (!session) {
      setStatusMessage("세션이 만료되었습니다. 다시 로그인해주세요.");
      router.replace("/login");
      return;
    }

    if (questions.some((question) => !answers[question.id]?.trim())) {
      setStatusMessage("모든 질문에 답변해주세요.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/questionnaire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          answers: questions.map((question) => ({
            questionId: question.id,
            answerText: answers[question.id],
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "제출에 실패했습니다.");
      }

      setStatusMessage("모든 답변이 저장되었습니다.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "제출 중 오류가 발생했습니다.";
      setStatusMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingQuestions) {
    return (
      <MobileScreen header={{ title: "질문지" }}>
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-slate-300">질문을 불러오는 중입니다…</p>
        </div>
      </MobileScreen>
    );
  }

  if (!currentQuestion) {
    return (
      <MobileScreen header={{ title: "질문지", showBackButton: true }}>
        <div className="h-full flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-slate-300">표시할 질문이 없습니다.</p>
          <button
            type="button"
            className="text-sm underline underline-offset-4"
            onClick={() => session && loadQuestions(session.access_token)}
          >
            다시 불러오기
          </button>
        </div>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen
      header={{
        showBackButton: true,
        title: currentQuestion.questionGroup,
        subtitle: `${currentIndex + 1}/${totalQuestions}`,
      }}
    >
      <div className="space-y-6">
        <p className="text-lg text-slate-100">{currentQuestion.questionText}</p>

        <textarea
          rows={6}
          value={answers[currentQuestion.id] ?? ""}
          onChange={(event) => handleAnswerChange(currentQuestion.id, event.target.value)}
          className="w-full rounded-2xl bg-slate-900 border border-white/10 text-white p-4 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          placeholder="답변을 입력해주세요…"
        />

        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{statusMessage}</span>
          {submitting && <span className="text-emerald-300">제출 중…</span>}
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0 || submitting}
            className="flex-1 rounded-2xl border border-white/15 py-3 font-semibold hover:border-white/40 disabled:opacity-50"
          >
            이전
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="flex-1 rounded-2xl bg-emerald-400/90 text-slate-900 py-3 font-semibold hover:bg-emerald-300 disabled:opacity-50"
          >
            {isLastQuestion ? "제출하기" : "다음"}
          </button>
        </div>
      </div>
    </MobileScreen>
  );
}
