import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";

import { getDb } from "@/db";
import { questionItems, userAnswers } from "@/db/schema";
import { requireRequestUser } from "@/lib/auth/server";
import { jsonError } from "@/lib/api/response";
import { answerInputSchema } from "@/lib/api/validation";

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

export async function POST(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);
    const body = (await request.json()) as unknown;
    const parsed = answerInputSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "유효하지 않은 요청입니다.", 400);
    }

    const sanitized = parsed.data.answers.map((answer) => ({
      questionId: answer.questionId,
      answerText: answer.answerText,
    }));

    const db = getDb();

    const groupId = crypto.randomUUID();

    await db.insert(userAnswers).values(
      sanitized.map((answer) => ({
        userId: user.id,
        questionId: answer.questionId,
        answerText: answer.answerText,
        answerGroupId: groupId,
      })),
    );

    return NextResponse.json({ ok: true, answerGroupId: groupId });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "답변을 저장하는 중 오류가 발생했습니다.";
    return jsonError(message, 400);
  }
}
