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
  hasRole,
} from "@/lib/api-utils";
import { FeedbackProgressStatus } from "@prisma/client";

const VALID_STATUSES: FeedbackProgressStatus[] = [
  "ON_TRACK",
  "SLIGHTLY_BEHIND",
  "NEEDS_IMPROVEMENT",
];

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const goalSheetId = searchParams.get("goalSheetId");

  if (!goalSheetId) return badRequest("goalSheetId is required");

  try {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
    });

    if (!goalSheet) return notFound("Goal sheet not found");

    // Check access: owner or manager of owner
    const isOwner = goalSheet.userId === session.user.id;
    const isManagerOfOwner = hasRole(session.user.role, "MANAGER")
      ? await prisma.teamMember
          .findFirst({
            where: {
              userId: goalSheet.userId,
              team: { managerId: session.user.id },
              endDate: null,
            },
          })
          .then((r) => !!r)
      : false;

    if (!isOwner && !isManagerOfOwner && !hasRole(session.user.role, "DIRECTOR")) {
      return forbidden();
    }

    const feedbacks = await prisma.midTermFeedback.findMany({
      where: { goalSheetId },
      include: {
        feedbackGiver: { select: { id: true, name: true } },
        items: {
          include: {
            goal: {
              select: { id: true, title: true, category: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success(feedbacks);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (!hasRole(session.user.role, "MANAGER")) {
    return forbidden();
  }

  try {
    const body = await req.json();
    const { goalSheetId, items, overallComment, meetingDate } = body;

    if (!goalSheetId) return badRequest("goalSheetId is required");
    if (!Array.isArray(items) || items.length === 0) {
      return badRequest("items is required");
    }

    // Validate items
    for (const item of items) {
      if (!item.goalId) return badRequest("Each item must have goalId");
      if (!VALID_STATUSES.includes(item.progressStatus)) {
        return badRequest(`Invalid progressStatus for goal ${item.goalId}`);
      }
    }

    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
      include: { goals: { where: { isDeleted: false } } },
    });

    if (!goalSheet) return notFound("Goal sheet not found");
    if (goalSheet.status !== "APPROVED") {
      return badRequest("Goal sheet must be APPROVED to receive feedback");
    }

    // Manager must be assigned to the team
    if (session.user.role === "MANAGER") {
      const teamMembership = await prisma.teamMember.findFirst({
        where: {
          userId: goalSheet.userId,
          team: { managerId: session.user.id },
          endDate: null,
        },
      });
      if (!teamMembership) return forbidden();
    }

    // Check no duplicate feedback from same giver
    const existing = await prisma.midTermFeedback.findUnique({
      where: {
        goalSheetId_feedbackGiverId: {
          goalSheetId,
          feedbackGiverId: session.user.id,
        },
      },
    });
    if (existing) {
      return badRequest("You have already submitted feedback for this sheet");
    }

    const feedback = await prisma.$transaction(async (tx) => {
      const created = await tx.midTermFeedback.create({
        data: {
          goalSheetId,
          feedbackGiverId: session.user.id,
          overallComment: overallComment ?? null,
          meetingDate: meetingDate ? new Date(meetingDate) : null,
          items: {
            create: items.map(
              (item: {
                goalId: string;
                progressStatus: FeedbackProgressStatus;
                comment?: string;
                recommendedAction?: string;
              }) => ({
                goalId: item.goalId,
                progressStatus: item.progressStatus,
                comment: item.comment ?? null,
                recommendedAction: item.recommendedAction ?? null,
              })
            ),
          },
        },
        include: {
          feedbackGiver: { select: { id: true, name: true } },
          items: true,
        },
      });

      // Notify the goal sheet owner
      await tx.notification.create({
        data: {
          userId: goalSheet.userId,
          type: "FEEDBACK_RECEIVED",
          title: "中間フィードバックが届きました",
          body: `${session.user.name ?? "マネージャー"}さんから中間フィードバックが届きました。`,
          linkUrl: "/feedback",
        },
      });

      return created;
    });

    return success(feedback, 201);
  } catch {
    return serverError();
  }
}
