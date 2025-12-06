export type Question = {
  id: number;
  questionText: string;
  questionGroup: string;
  sortOrder: number;
};

export type AnswerGroupSummary = {
  answerGroupId: string;
  answeredDate: string | null;
  preview: string;
  questionText?: string | null;
  totalAnswers: number;
};

export type AnswerDetail = {
  questionId: number;
  questionText: string | null;
  answerText: string;
};
