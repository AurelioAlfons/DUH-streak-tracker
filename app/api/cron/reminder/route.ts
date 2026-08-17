import { NextRequest, NextResponse } from "next/server";
import { localDateInTimezone } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { configurePush, sendReminder } from "@/lib/push";

function localHour(timezone: string) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!configurePush()) {
    return NextResponse.json({ error: "VAPID is not configured." }, { status: 503 });
  }

  const subscriptions = await prisma.pushSubscription.findMany({ include: { user: true } });
  let sent = 0;
  for (const subscription of subscriptions) {
    // hobby cron runs daily, so sydney lands around 10-11pm across daylight saving
    const hour = localHour(subscription.timezone);
    if (hour < 22 || hour > 23) continue;
    const today = localDateInTimezone(subscription.timezone);
    const habit = await prisma.habit.findFirst({
      where: { userId: subscription.userId, type: "streak" },
      include: { checkIns: { where: { date: today }, take: 1 } },
    });
    if (habit?.checkIns.length) continue;
    try {
      await sendReminder({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      });
      sent += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: subscription.id } });
      }
    }
  }
  return NextResponse.json({ sent });
}
