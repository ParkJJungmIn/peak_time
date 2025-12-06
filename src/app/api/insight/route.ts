import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api/response";
import { insightSchema } from "@/lib/api/validation";

const FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/openai-completion`;

const FUNCTION_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function POST(request: Request) {
  if (!FUNCTION_URL) {
    return jsonError("FUNCTION_URL이 설정되지 않았습니다.", 500);
  }

  const body = (await request.json().catch(() => ({}))) as unknown;
  const parsed = insightSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "prompt가 필요합니다.", 400);
  }

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: FUNCTION_KEY,
        Authorization: `Bearer ${FUNCTION_KEY}`,
      },
      body: JSON.stringify({ prompt: parsed.data.prompt }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error ?? "인사이트 생성에 실패했습니다.");
    }

    return NextResponse.json(data);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "인사이트 생성 중 오류가 발생했습니다.",
      500,
    );
  }
}
