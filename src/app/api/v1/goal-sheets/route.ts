import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  badRequest,
  success,
  serverError,
} from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const periodId = searchParams.get("periodId");
  const userId = searchParams.get("userId") ?? session.user.id;

  try {
    const where: Record<string, unknown> = {};
    if (periodId) where.evaluationPeriodId = periodId;

    // Non-admins can only see their own sheets or their team members'
    if (userId !== session.user.id) {
      if (
        session.user.role === "MEMBER" ||
        (session.user.role === "MANAGER" && userId !== session.user.id)
      ) {
        // Check if user is in manager's team
        const teamMembership = await prisma.teamMember.findFirst({
          where: {
            userId,
            team: { managerId: session.user.id },
            endDate: null,
          },
        });
        if (!teamMembership) return unauthorized();
      }
    }
    where.userId = userId;

    const goalSheets = await prisma.goalSheet.findMany({
      where,
      include: {
        goals: {
          where: { isDeleted: false },
          orderBy: { orderIndex: "asc" },
        },
        evaluationPeriod: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return success(goalSheets);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { evaluationPeriodId } = body;

    if (!evaluationPeriodId) {
      return badRequest("evaluationPeriodId is required");
    }

    // Check period exists
    const period = await prisma.evaluationPeriod.findUnique({
      where: { id: evaluationPeriodId },
    });
    if (!period) return badRequest("Evaluation period not found");

    // Check no existing sheet
    const existing = await prisma.goalSheet.findUnique({
      where: {
        userId_evaluationPeriodId: {
          userId: session.user.id,
          evaluationPeriodId,
        },
      },
    });
    if (existing) return badRequest("Goal sheet already exists for this period");

    const goalSheet = await prisma.goalSheet.create({
      data: {
        userId: session.user.id,
        evaluationPeriodId,
        status: "DRAFT",
      },
      include: {
        goals: true,
        evaluationPeriod: true,
      },
    });

    return success(goalSheet, 201);
  } catch {
    return serverError();
  }
}
