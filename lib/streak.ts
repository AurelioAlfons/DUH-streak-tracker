import { prisma } from "@/lib/prisma";
import { dayGap } from "@/lib/date";

const MILESTONES = new Set([7, 30, 100]);

export async function getHabit(userId: string) {
  return prisma.habit.upsert({
    where: { id: `streak-${userId}` },
    update: {},
    create: {
      id: `streak-${userId}`,
      userId,
      name: "No relapse",
      type: "streak",
    },
  });
}

export async function getStatus(userId: string, today: string) {
  let habit = await getHabit(userId);

  // missed yesterday => bank the record, then start clean
  if (habit.lastSuccessDate && dayGap(habit.lastSuccessDate, today) > 1) {
    habit = await prisma.habit.update({
      where: { id: habit.id },
      data: {
        currentStreak: 0,
        longestStreak: Math.max(habit.longestStreak, habit.currentStreak),
      },
    });
  }

  const checkIn = await prisma.checkIn.findUnique({
    where: { habitId_date: { habitId: habit.id, date: today } },
  });

  return {
    currentStreak: habit.currentStreak,
    longestStreak: Math.max(habit.longestStreak, habit.currentStreak),
    todayStatus: checkIn?.status ?? null,
    milestone: false,
  };
}

export async function checkInSuccess(userId: string, today: string) {
  const habit = await getHabit(userId);

  return prisma.$transaction(async (tx) => {
    // Serialize check-ins for this habit so repeat requests cannot re-fire a milestone.
    await tx.$queryRaw`SELECT "id" FROM "Habit" WHERE "id" = ${habit.id} FOR UPDATE`;

    const lockedHabit = await tx.habit.findUniqueOrThrow({ where: { id: habit.id } });
    const existing = await tx.checkIn.findUnique({
      where: { habitId_date: { habitId: habit.id, date: today } },
    });

    if (existing?.status === "success") {
      return {
        currentStreak: lockedHabit.currentStreak,
        longestStreak: Math.max(lockedHabit.longestStreak, lockedHabit.currentStreak),
        todayStatus: "success" as const,
        milestone: false,
      };
    }

    const continues = lockedHabit.lastSuccessDate && dayGap(lockedHabit.lastSuccessDate, today) === 1;
    const nextStreak = continues ? lockedHabit.currentStreak + 1 : 1;
    const milestone = MILESTONES.has(nextStreak);

    await tx.checkIn.upsert({
      where: { habitId_date: { habitId: habit.id, date: today } },
      update: { status: "success" },
      create: { habitId: habit.id, date: today, status: "success" },
    });
    const updatedHabit = await tx.habit.update({
      where: { id: habit.id },
      data: {
        currentStreak: nextStreak,
        longestStreak: Math.max(lockedHabit.longestStreak, nextStreak),
        lastSuccessDate: today,
      },
    });

    return {
      currentStreak: updatedHabit.currentStreak,
      longestStreak: updatedHabit.longestStreak,
      todayStatus: "success" as const,
      milestone,
    };
  });
}

export async function checkInFailed(userId: string, today: string) {
  const habit = await getHabit(userId);
  await prisma.$transaction([
    prisma.checkIn.upsert({
      where: { habitId_date: { habitId: habit.id, date: today } },
      update: { status: "failed" },
      create: { habitId: habit.id, date: today, status: "failed" },
    }),
    prisma.habit.update({
      where: { id: habit.id },
      data: {
        currentStreak: 0,
        longestStreak: Math.max(habit.longestStreak, habit.currentStreak),
        lastSuccessDate: null,
      },
    }),
  ]);
  return getStatus(userId, today);
}
