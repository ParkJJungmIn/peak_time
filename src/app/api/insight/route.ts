import { NextResponse } from "next/server";

const FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/openai-completion`;

const FUNCTION_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function POST(request: Request) {
  if (!FUNCTION_URL) {
    return NextResponse.json(
      { error: "FUNCTION_URL이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  let prompt = "";
  try {
    const body = await request.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    prompt = "";
  }

  if (!prompt) {
    return NextResponse.json({ error: "prompt가 필요합니다." }, { status: 400 });
  }

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: FUNCTION_KEY,
        Authorization: `Bearer ${FUNCTION_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error ?? "인사이트 생성에 실패했습니다.");
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "인사이트 생성 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
