import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  forbidden,
  notFound,
  success,
  serverError,
} from "@/lib/api-utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "HR_ADMIN") {
    return forbidden();
  }

  const { id, phaseId } = await params;

  try {
    const body = await req.json();
    const { isActive } = body;

    const phase = await prisma.evaluationPhase.findUnique({
      where: { id: phaseId },
    });

    if (!phase || phase.evaluationPeriodId !== id) {
      return notFound("Phase not found");
    }

    const updated = await prisma.evaluationPhase.update({
      where: { id: phaseId },
      data: { isActive: Boolean(isActive) },
    });

    return success(updated);
  } catch {
    return serverError();
  }
}
