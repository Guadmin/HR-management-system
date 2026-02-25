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
} from "@/lib/api-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  try {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: { goals: { where: { isDeleted: false } } },
    });

    if (!goalSheet) return notFound();
    if (goalSheet.userId !== session.user.id) return forbidden();

    if (!["DRAFT", "REJECTED"].includes(goalSheet.status)) {
      return badRequest(`Cannot submit a goal sheet with status: ${goalSheet.status}`);
    }

    if (goalSheet.goals.length === 0) {
      return badRequest("目標が1つも設定されていません");
    }

    const updated = await prisma.goalSheet.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        rejectedAt: null,
        rejectionComment: null,
      },
    });

    // Notify manager
    const managerTeam = await prisma.team.findFirst({
      where: {
        members: {
          some: { userId: session.user.id, endDate: null },
        },
      },
    });

    if (managerTeam?.managerId) {
      await prisma.notification.create({
        data: {
          userId: managerTeam.managerId,
          type: "GOAL_SUBMITTED",
          title: "目標シートが提出されました",
          body: `${session.user.name} さんが目標シートを提出しました。確認・承認をお願いします。`,
          linkUrl: `/goals/review/${id}`,
        },
      });
    }

    return success(updated);
  } catch {
    return serverError();
  }
}
