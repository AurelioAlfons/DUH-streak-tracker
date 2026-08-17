import { prisma } from "@/lib/prisma";

export async function appUserId() {
  const existing = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing.id;

  // login's off for now, so make the one v1 user on first use
  const user = await prisma.user.create({ data: { passwordHash: "login-disabled" } });
  return user.id;
}
