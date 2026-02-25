import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  badRequest,
  forbidden,
  success,
  serverError,
} from "@/lib/api-utils";
import { GoalCategory } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { goalSheetId, category, title, description, kpiDescription, weight } = body;

    if (!goalSheetId || !category || !title) {
      return badRequest("goalSheetId, category, and title are required");
    }

    if (!Object.values(GoalCategory).includes(category)) {
      return badRequest("Invalid goal category");
    }

    // Verify goal sheet ownership
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
    });
    if (!goalSheet) return badRequest("Goal sheet not found");
    if (goalSheet.userId !== session.user.id) return forbidden();
    if (!["DRAFT", "REJECTED"].includes(goalSheet.status)) {
      return badRequest("Cannot add goals to a goal sheet that is not in draft or rejected status");
    }

    // Get next order index
    const lastGoal = await prisma.goal.findFirst({
      where: { goalSheetId, category, isDeleted: false },
      orderBy: { orderIndex: "desc" },
    });

    const goal = await prisma.goal.create({
      data: {
        goalSheetId,
        category,
        title,
        description: description || null,
        kpiDescription: kpiDescription || null,
        weight: weight ?? 0,
        orderIndex: (lastGoal?.orderIndex ?? -1) + 1,
      },
      include: {
        progressRecords: { orderBy: { recordedAt: "desc" }, take: 1 },
        comments: {
          include: { author: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    return success(goal, 201);
  } catch {
    return serverError();
  }
}
