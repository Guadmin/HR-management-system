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
    const body = await req.json();
    const { comment } = body;

    if (!comment?.trim()) {
      return badRequest("差し戻しコメントを入力してください");
    }

    const goalSheet = await prisma.goalSheet.findUnique({ where: { id } });
    if (!goalSheet) return notFound();
    if (goalSheet.status !== "SUBMITTED") {
      return badRequest("Only submitted goal sheets can be rejected");
    }

    const updated = await prisma.goalSheet.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionComment: comment,
        approvedAt: null,
      },
    });

    // Notify employee
    await prisma.notification.create({
      data: {
        userId: goalSheet.userId,
        type: "GOAL_REJECTED",
        title: "目標シートが差し戻されました",
        body: `差し戻し理由: ${comment}`,
        linkUrl: `/goals`,
      },
    });

    return success(updated);
  } catch {
    return serverError();
  }
}
