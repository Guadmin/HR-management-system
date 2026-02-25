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
import { AchievementScore, EvaluationType } from "@prisma/client";

const VALID_SCORES: AchievementScore[] = ["S", "A", "B", "C", "D"];
const VALID_TYPES: EvaluationType[] = ["SELF", "PRIMARY", "SECONDARY"];

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const {
      goalSheetId,
      type,
      goalEvaluations,
      overallScore,
      overallComment,
      strengthComment,
      issueComment,
    } = body;

    // Validate required fields
    if (!goalSheetId || !type) {
      return badRequest("goalSheetId and type are required");
    }
    if (!VALID_TYPES.includes(type)) {
      return badRequest("Invalid evaluation type");
    }
    if (!VALID_SCORES.includes(overallScore)) {
      return badRequest("Invalid overall score");
    }
    if (!overallComment?.trim()) {
      return badRequest("overallComment is required");
    }
    if (!Array.isArray(goalEvaluations) || goalEvaluations.length === 0) {
      return badRequest("goalEvaluations is required");
    }

    // Fetch goal sheet with goals and existing evaluations
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
      include: {
        goals: { where: { isDeleted: false } },
        evaluations: {
          where: { type },
        },
        evaluationPeriod: {
          include: {
            phases: true,
          },
        },
      },
    });

    if (!goalSheet) return notFound("Goal sheet not found");

    // Must be APPROVED to evaluate
    if (goalSheet.status !== "APPROVED") {
      return badRequest("Goal sheet must be in APPROVED status to evaluate");
    }

    // Authorization checks by type
    if (type === "SELF") {
      // Only the owner can submit self evaluation
      if (goalSheet.userId !== session.user.id) {
        return forbidden();
      }
    } else if (type === "PRIMARY") {
      // Only managers/directors/admins can submit primary evaluation
      if (!hasRole(session.user.role, "MANAGER")) {
        return forbidden();
      }
      // Manager must be assigned to the employee's team
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
    } else if (type === "SECONDARY") {
      // Only directors/admins can submit secondary evaluation
      if (!hasRole(session.user.role, "DIRECTOR")) {
        return forbidden();
      }
    }

    // Check no duplicate evaluation of same type
    if (goalSheet.evaluations.length > 0) {
      return badRequest(`${type} evaluation already exists for this sheet`);
    }

    // Validate all goals are covered
    const goalIds = goalSheet.goals.map((g) => g.id);
    const evaluatedGoalIds = goalEvaluations.map(
      (ge: { goalId: string }) => ge.goalId
    );
    const missingGoals = goalIds.filter((id) => !evaluatedGoalIds.includes(id));
    if (missingGoals.length > 0) {
      return badRequest("All goals must be evaluated");
    }

    // Validate scores in goalEvaluations
    for (const ge of goalEvaluations) {
      if (!VALID_SCORES.includes(ge.score)) {
        return badRequest(`Invalid score for goal ${ge.goalId}`);
      }
    }

    // Create evaluation with goal evaluations and overall evaluation in transaction
    const evaluation = await prisma.$transaction(async (tx) => {
      const created = await tx.evaluation.create({
        data: {
          goalSheetId,
          evaluatorId: session.user.id,
          type,
          status: "SUBMITTED",
          goalEvaluations: {
            create: goalEvaluations.map(
              (ge: { goalId: string; score: AchievementScore; comment?: string }) => ({
                goalId: ge.goalId,
                score: ge.score,
                comment: ge.comment ?? null,
              })
            ),
          },
          overallEvaluation: {
            create: {
              overallScore,
              overallComment,
              strengthComment: strengthComment ?? null,
              issueComment: issueComment ?? null,
            },
          },
        },
        include: {
          goalEvaluations: true,
          overallEvaluation: true,
          evaluator: {
            select: { id: true, name: true },
          },
        },
      });

      // Notify the goal sheet owner when primary/secondary evaluation is submitted
      if (type === "PRIMARY" || type === "SECONDARY") {
        const typeLabel = type === "PRIMARY" ? "一次評価" : "二次評価";
        await tx.notification.create({
          data: {
            userId: goalSheet.userId,
            type: "EVALUATION_CONFIRMED",
            title: `${typeLabel}が完了しました`,
            body: `${session.user.name ?? "評価者"}さんが${typeLabel}を提出しました。`,
            linkUrl: `/evaluations`,
          },
        });
      }

      return created;
    });

    return success(evaluation, 201);
  } catch {
    return serverError();
  }
}
