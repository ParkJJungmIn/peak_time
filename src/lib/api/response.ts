import { NextResponse, type NextResponseInit } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    { status } satisfies NextResponseInit,
  );
}
