import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  notFound,
  forbidden,
  success,
  serverError,
} from "@/lib/api-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  const { id } = await params;

  try {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: {
        goals: {
          where: { isDeleted: false },
          orderBy: { orderIndex: "asc" },
          include: {
            progressRecords: { orderBy: { recordedAt: "desc" }, take: 5 },
            comments: {
              include: {
                author: { select: { id: true, name: true, image: true } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        evaluationPeriod: { include: { phases: true } },
        user: { select: { id: true, name: true, jobTitle: true, image: true } },
      },
    });

    if (!goalSheet) return notFound();

    // Auth check
    if (
      goalSheet.userId !== session.user.id &&
      session.user.role === "MEMBER"
    ) {
      return forbidden();
    }

    return success(goalSheet);
  } catch {
    return serverError();
  }
}
