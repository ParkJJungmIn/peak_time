import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/client";

export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? "";
  const matches = header.match(/^Bearer\s+(.+)$/i);
  return matches ? matches[1] : null;
}

export async function getUserFromToken(token: string): Promise<User> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error(error?.message ?? "유효하지 않은 액세스 토큰입니다.");
  }

  return data.user;
}

export async function requireRequestUser(request: NextRequest): Promise<User> {
  const token = extractBearerToken(request);

  if (!token) {
    throw new Error("Authorization 헤더가 필요합니다.");
  }

  return getUserFromToken(token);
}
