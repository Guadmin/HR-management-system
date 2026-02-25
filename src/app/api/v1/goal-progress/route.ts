import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  forbidden,
  badRequest,
  notFound,
  success,
  serverError,
} from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { goalId, progressRate, comment } = body;

    if (!goalId) return badRequest("goalId is required");
    if (
      typeof progressRate !== "number" ||
      progressRate < 0 ||
      progressRate > 100
    ) {
      return badRequest("progressRate must be a number between 0 and 100");
    }

    // Verify goal exists and belongs to user's sheet
    const goal = await prisma.goal.findUnique({
      where: { id: goalId, isDeleted: false },
      include: {
        goalSheet: true,
      },
    });

    if (!goal) return notFound("Goal not found");

    // Only the goal sheet owner can update progress
    if (goal.goalSheet.userId !== session.user.id) {
      return forbidden();
    }

    // Goal sheet must be APPROVED to record progress
    if (goal.goalSheet.status !== "APPROVED") {
      return badRequest("Goal sheet must be approved to record progress");
    }

    const progress = await prisma.goalProgress.create({
      data: {
        goalId,
        recordedById: session.user.id,
        progressRate,
        comment: comment ?? null,
      },
    });

    return success(progress, 201);
  } catch {
    return serverError();
  }
}
