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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  try {
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { goalSheet: true },
    });
    if (!goal) return notFound();
    if (goal.goalSheet.userId !== session.user.id) return forbidden();
    if (!["DRAFT", "REJECTED"].includes(goal.goalSheet.status)) {
      return badRequest("Cannot edit goals of a non-draft goal sheet");
    }

    const body = await req.json();
    const { title, description, kpiDescription, weight, orderIndex } = body;

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(kpiDescription !== undefined && { kpiDescription }),
        ...(weight !== undefined && { weight }),
        ...(orderIndex !== undefined && { orderIndex }),
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

    return success(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  try {
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { goalSheet: true },
    });
    if (!goal) return notFound();
    if (goal.goalSheet.userId !== session.user.id) return forbidden();
    if (!["DRAFT", "REJECTED"].includes(goal.goalSheet.status)) {
      return badRequest("Cannot delete goals of a non-draft goal sheet");
    }

    await prisma.goal.update({
      where: { id },
      data: { isDeleted: true },
    });

    return success({ success: true });
  } catch {
    return serverError();
  }
}
