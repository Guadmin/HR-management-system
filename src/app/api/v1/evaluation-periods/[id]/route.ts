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
import { EvaluationPeriodStatus } from "@prisma/client";

const VALID_STATUSES: EvaluationPeriodStatus[] = [
  "UPCOMING",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "HR_ADMIN") {
    return forbidden();
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, name, startDate, endDate } = body;

    const period = await prisma.evaluationPeriod.findUnique({ where: { id } });
    if (!period) return notFound("Evaluation period not found");

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return badRequest("Invalid status");
      }
      updateData.status = status;
    }
    if (name !== undefined) updateData.name = name;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);

    const updated = await prisma.evaluationPeriod.update({
      where: { id },
      data: updateData,
      include: {
        phases: { orderBy: { startDate: "asc" } },
        _count: { select: { goalSheets: true } },
      },
    });

    return success(updated);
  } catch {
    return serverError();
  }
}
