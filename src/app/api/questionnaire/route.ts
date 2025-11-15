import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";

import { getDb } from "@/db";
import { questionItems, userAnswers } from "@/db/schema";
import { requireRequestUser } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request);

    const db = getDb();
    const questions = await db
      .select({
        id: questionItems.id,
        questionText: questionItems.questionText,
        questionGroup: questionItems.questionGroup,
        sortOrder: questionItems.sortOrder,
      })
      .from(questionItems)
      .orderBy(asc(questionItems.sortOrder), asc(questionItems.id));

    return NextResponse.json({ questions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "질문을 불러오는 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

type AnswerPayload = {
  questionId: number;
  answerText: string;
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);
    const body = (await request.json()) as { answers?: AnswerPayload[] };

    if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json(
        { error: "answers 배열이 필요합니다." },
        { status: 400 },
      );
    }

    const sanitized = body.answers
      .map((answer) => ({
        questionId: Number(answer.questionId),
        answerText: String(answer.answerText ?? "").trim(),
      }))
      .filter((answer) => Number.isFinite(answer.questionId) && answer.answerText.length);

    if (sanitized.length === 0) {
      return NextResponse.json(
        { error: "유효한 질문/답변이 없습니다." },
        { status: 400 },
      );
    }

    const db = getDb();

    await db.insert(userAnswers).values(
      sanitized.map((answer) => ({
        userId: user.id,
        questionId: answer.questionId,
        answerText: answer.answerText,
      })),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "답변을 저장하는 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
