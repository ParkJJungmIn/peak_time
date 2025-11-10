import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { notes } from "@/db/schema";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/client";

function formatError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message && error.message.trim().length > 0) {
      return error.message;
    }

    if (error.cause) {
      return formatError(error.cause);
    }

    if (error.stack) {
      return error.stack;
    }

    return error.toString();
  }

  if (typeof error === "object" && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }

  return String(error);
}

export async function GET() {
  const payload: {
    drizzle: { ok: boolean; error?: string };
    supabase: { ok: boolean; error?: string };
  } = {
    drizzle: { ok: false },
    supabase: { ok: false },
  };

  try {
    const db = getDb();
    await db
      .select({
        id: notes.id,
      })
      .from(notes)
      .limit(1);
    payload.drizzle.ok = true;
  } catch (error) {
    payload.drizzle.error = formatError(error);
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.from("notes").select("id").limit(1);

    if (error) {
      throw error;
    }

    payload.supabase.ok = true;
  } catch (error) {
    payload.supabase.error = formatError(error);
  }

  const status = payload.drizzle.ok && payload.supabase.ok ? 200 : 500;

  return NextResponse.json(payload, { status });
}
