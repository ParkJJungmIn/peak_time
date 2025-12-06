import { z } from "zod";

export const answerInputSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().finite(),
        answerText: z.string().trim().min(1),
      }),
    )
    .min(1, "answers가 비어 있습니다."),
});

export const insightSchema = z.object({
  prompt: z.string().trim().min(1, "prompt가 필요합니다."),
});
