import { NextRequest, NextResponse } from "next/server";
import { isValidLocalDate } from "@/lib/date";
import { checkInFailed } from "@/lib/streak";
import { appUserId } from "@/lib/user";

export async function POST(request: NextRequest) {
  const userId = await appUserId();
  const { today } = (await request.json()) as { today?: unknown };
  if (!isValidLocalDate(today)) {
    return NextResponse.json({ error: "Send today as YYYY-MM-DD." }, { status: 400 });
  }
  return NextResponse.json(await checkInFailed(userId, today));
}
