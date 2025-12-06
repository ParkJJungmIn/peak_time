import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { questionItems, userAnswers } from "@/db/schema";
import { requireRequestUser } from "@/lib/auth/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId?: string } },
) {
  try {
    const user = await requireRequestUser(request);
    const groupId = params.groupId;

    if (!groupId) {
      return NextResponse.json({ error: "groupId가 필요합니다." }, { status: 400 });
    }

    const db = getDb();

    const rows = await db
      .select({
        answerId: userAnswers.id,
        questionId: userAnswers.questionId,
        answerText: userAnswers.answerText,
        answeredDate: userAnswers.answeredDate,
        questionText: questionItems.questionText,
      })
      .from(userAnswers)
      .leftJoin(questionItems, eq(questionItems.id, userAnswers.questionId))
      .where(
        and(eq(userAnswers.userId, user.id), eq(userAnswers.answerGroupId, groupId)),
      )
      .orderBy(asc(userAnswers.id));

    if (!rows.length) {
      return NextResponse.json({ error: "해당 보관함 항목을 찾을 수 없습니다." }, { status: 404 });
    }

    const answeredDate =
      typeof rows[0].answeredDate === "string"
        ? rows[0].answeredDate
        : rows[0].answeredDate?.toISOString() ?? null;

    return NextResponse.json({
      answerGroupId: groupId,
      answeredDate,
      answers: rows.map((row) => ({
        questionId: row.questionId,
        questionText: row.questionText,
        answerText: row.answerText,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "보관함 상세를 불러오는 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

type UpdateAnswer = {
  questionId: number;
  answerText: string;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId?: string } },
) {
  try {
    const user = await requireRequestUser(request);
    const groupId = params.groupId;

    if (!groupId) {
      return NextResponse.json({ error: "groupId가 필요합니다." }, { status: 400 });
    }

    const body = (await request.json()) as { answers?: UpdateAnswer[] };

    if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json({ error: "answers 배열이 필요합니다." }, { status: 400 });
    }

    const updates = body.answers
      .map((item) => ({
        questionId: Number(item.questionId),
        answerText: String(item.answerText ?? "").trim(),
      }))
      .filter((item) => Number.isFinite(item.questionId) && item.answerText.length);

    if (!updates.length) {
      return NextResponse.json(
        { error: "유효한 질문/답변이 없습니다." },
        { status: 400 },
      );
    }

    const db = getDb();

    const today = new Date().toISOString().slice(0, 10);

    for (const update of updates) {
      await db
        .update(userAnswers)
        .set({ answerText: update.answerText, answeredDate: today })
        .where(
          and(
            eq(userAnswers.userId, user.id),
            eq(userAnswers.answerGroupId, groupId),
            eq(userAnswers.questionId, update.questionId),
          ),
        );
    }

    return NextResponse.json({ ok: true, answerGroupId: groupId });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "보관함 내용을 수정하는 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
