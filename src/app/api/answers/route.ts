import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { questionItems, userAnswers } from "@/db/schema";
import { requireRequestUser } from "@/lib/auth/server";

const truncate = (value: string, length = 80) => {
  if (!value) {
    return "";
  }

  return value.length > length ? `${value.slice(0, length)}…` : value;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);
    const db = getDb();

    const rows = await db
      .select({
        answerId: userAnswers.id,
        answerGroupId: userAnswers.answerGroupId,
        answerText: userAnswers.answerText,
        answeredDate: userAnswers.answeredDate,
        questionText: questionItems.questionText,
      })
      .from(userAnswers)
      .leftJoin(questionItems, eq(questionItems.id, userAnswers.questionId))
      .where(eq(userAnswers.userId, user.id))
      .orderBy(desc(userAnswers.answeredDate), desc(userAnswers.id));

    const map = new Map<
      string,
      {
        answerGroupId: string;
        answeredDate: Date | null;
        preview: string;
        questionText?: string | null;
        totalAnswers: number;
        firstAnswerId: number;
      }
    >();

    for (const row of rows) {
      if (!row.answerGroupId) {
        continue;
      }

      const answeredDate =
        typeof row.answeredDate === "string"
          ? new Date(row.answeredDate)
          : row.answeredDate ?? null;
      const preview = truncate(row.answerText ?? "");
      const answerId = Number(row.answerId);

      const existing = map.get(row.answerGroupId);

      if (!existing) {
        map.set(row.answerGroupId, {
          answerGroupId: row.answerGroupId,
          answeredDate,
          preview,
          questionText: row.questionText,
          totalAnswers: 1,
          firstAnswerId: answerId,
        });
        continue;
      }

      existing.totalAnswers += 1;

      if (answeredDate && (!existing.answeredDate || answeredDate > existing.answeredDate)) {
        existing.answeredDate = answeredDate;
      }

      if (answerId < existing.firstAnswerId) {
        existing.firstAnswerId = answerId;
        existing.preview = preview;
        existing.questionText = row.questionText;
      }
    }

    const groups = Array.from(map.values())
      .sort((a, b) => {
        const aTime = a.answeredDate ? a.answeredDate.getTime() : 0;
        const bTime = b.answeredDate ? b.answeredDate.getTime() : 0;
        return bTime - aTime;
      })
      .map(({ firstAnswerId: _ignored, ...group }) => ({
        ...group,
        answeredDate: group.answeredDate ? group.answeredDate.toISOString() : null,
      }));

    return NextResponse.json({ groups });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "보관함을 불러오는 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
