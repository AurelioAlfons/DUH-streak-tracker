import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appUserId } from "@/lib/user";

type SubscriptionBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  timezone?: string;
};

export async function POST(request: NextRequest) {
  const userId = await appUserId();
  const body = (await request.json()) as SubscriptionBody;
  if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth || !body.timezone) {
    return NextResponse.json({ error: "Push subscription is incomplete." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { p256dh: body.keys.p256dh, auth: body.keys.auth, timezone: body.timezone, userId },
    create: {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      timezone: body.timezone,
      userId,
    },
  });
  return NextResponse.json({ ok: true });
}
