import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/client";

export async function POST(request: Request) {
  const { accessToken } = await request.json().catch(() => ({}));

  if (!accessToken) {
    return NextResponse.json(
      { error: "accessToken이 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "세션을 확인할 수 없습니다." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        appMetadata: data.user.app_metadata,
        userMetadata: data.user.user_metadata,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "인가 확인 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
