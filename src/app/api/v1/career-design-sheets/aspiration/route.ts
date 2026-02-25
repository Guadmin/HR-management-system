import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  notFound,
  success,
  serverError,
} from "@/lib/api-utils";

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const { shortTermGoal, longTermGoal, memberComment } = body;

    // Find the most recent career sheet for this user
    const careerSheet = await prisma.careerDesignSheet.findFirst({
      where: { subjectUserId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { careerAspiration: true },
    });

    if (!careerSheet) return notFound("Career design sheet not found");

    let aspiration;
    if (careerSheet.careerAspiration) {
      aspiration = await prisma.careerAspiration.update({
        where: { sheetId: careerSheet.id },
        data: {
          shortTermGoal: shortTermGoal ?? null,
          longTermGoal: longTermGoal ?? null,
          memberComment: memberComment ?? null,
        },
      });
    } else {
      aspiration = await prisma.careerAspiration.create({
        data: {
          sheetId: careerSheet.id,
          shortTermGoal: shortTermGoal ?? null,
          longTermGoal: longTermGoal ?? null,
          memberComment: memberComment ?? null,
        },
      });
    }

    return success(aspiration);
  } catch {
    return serverError();
  }
}
