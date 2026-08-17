import { NextRequest, NextResponse } from "next/server";
import { isValidLocalDate } from "@/lib/date";
import { getStatus } from "@/lib/streak";
import { appUserId } from "@/lib/user";

export async function GET(request: NextRequest) {
  const userId = await appUserId();
  const today = request.nextUrl.searchParams.get("today");
  if (!isValidLocalDate(today)) {
    return NextResponse.json({ error: "Send today as YYYY-MM-DD." }, { status: 400 });
  }
  return NextResponse.json(await getStatus(userId, today));
}
