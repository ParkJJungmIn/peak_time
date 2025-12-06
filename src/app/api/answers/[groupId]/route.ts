import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { questionItems, userAnswers } from "@/db/schema";
import { requireRequestUser } from "@/lib/auth/server";
import { jsonError } from "@/lib/api/response";
import { answerInputSchema } from "@/lib/api/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireRequestUser(request);
    const { groupId } = await params;

    if (!groupId) {
      return jsonError("groupId가 필요합니다.", 400);
    }

    const db = getDb();

    const rows = (await db
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
      .orderBy(asc(userAnswers.id))) as Array<{
        answerId: number;
        questionId: number;
        answerText: string;
        answeredDate: string | Date | null;
        questionText: string | null;
      }>;

    if (!rows.length) {
      return jsonError("해당 보관함 항목을 찾을 수 없습니다.", 404);
    }

    const rawDate = rows[0].answeredDate;
    const answeredDate =
      typeof rawDate === "string"
        ? rawDate
        : rawDate && typeof rawDate === "object" && "toISOString" in rawDate
          ? (rawDate as Date).toISOString()
          : null;

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
    return jsonError(message, 400);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireRequestUser(request);
    const { groupId } = await params;

    if (!groupId) {
      return jsonError("groupId가 필요합니다.", 400);
    }

    const body = (await request.json()) as unknown;
    const parsed = answerInputSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "유효하지 않은 요청입니다.", 400);
    }
    const updates = parsed.data.answers;

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
    return jsonError(message, 400);
  }
}
