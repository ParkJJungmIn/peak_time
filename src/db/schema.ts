import {
  bigint,
  bigserial,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const questionItems = pgTable("question_items", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  questionText: text("question_text").notNull(),
  questionGroup: varchar("question_group", { length: 100 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const userAnswers = pgTable("user_answers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").notNull(),
  questionId: bigint("question_id", { mode: "number" }).notNull(),
  answerText: text("answer_text").notNull(),
  answeredDate: date("answered_date").defaultNow().notNull(),
  answerGroupId: uuid("answer_group_id"),
});
