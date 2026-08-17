import { NextRequest, NextResponse } from "next/server";
import { isValidLocalDate } from "@/lib/date";
import { checkInSuccess } from "@/lib/streak";
import { appUserId } from "@/lib/user";

export async function POST(request: NextRequest) {
  const userId = await appUserId();
  const { today } = (await request.json()) as { today?: unknown };
  if (!isValidLocalDate(today)) {
    return NextResponse.json({ error: "Send today as YYYY-MM-DD." }, { status: 400 });
  }
  return NextResponse.json(await checkInSuccess(userId, today));
}
