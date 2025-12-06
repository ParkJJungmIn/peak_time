"use client";

import { useState } from "react";
import { marked } from "marked";

type InsightState = {
  loading: boolean;
  error: string | null;
  text: string;
  html: string;
};

export function useInsight() {
  const [state, setState] = useState<InsightState>({
    loading: false,
    error: null,
    text: "",
    html: "",
  });

  const requestInsight = async (prompt: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "인사이트 생성에 실패했습니다.");
      }

      const text =
        typeof data === "string"
          ? data
          : typeof data?.text === "string"
            ? data.text
            : data && typeof data === "object"
              ? JSON.stringify(data)
              : "";

      const htmlRaw = await marked.parse(text ?? "", { breaks: true });
      const html = typeof htmlRaw === "string" ? htmlRaw : String(htmlRaw);

      setState({ loading: false, error: null, text, html });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "인사이트 생성 중 오류",
      }));
    }
  };

  return { ...state, requestInsight };
}
