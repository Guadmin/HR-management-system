import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
  badRequest,
  success,
  serverError,
  hasRole,
} from "@/lib/api-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();
  if (!hasRole(session.user.role, "MANAGER")) return forbidden();

  const { id } = await params;

  try {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
    });

    if (!goalSheet) return notFound();
    if (goalSheet.status !== "SUBMITTED") {
      return badRequest("Only submitted goal sheets can be approved");
    }

    const updated = await prisma.goalSheet.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: goalSheet.userId,
        type: "GOAL_APPROVED",
        title: "目標シートが承認されました",
        body: "マネージャーが目標シートを承認しました。目標達成に向けて取り組みましょう！",
        linkUrl: `/goals`,
      },
    });

    return success(updated);
  } catch {
    return serverError();
  }
}
