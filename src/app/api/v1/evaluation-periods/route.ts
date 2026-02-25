import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAuthSession,
  unauthorized,
  forbidden,
  badRequest,
  success,
  serverError,
} from "@/lib/api-utils";

export async function GET() {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  try {
    const periods = await prisma.evaluationPeriod.findMany({
      orderBy: { startDate: "desc" },
      include: {
        phases: { orderBy: { startDate: "asc" } },
        _count: { select: { goalSheets: true } },
      },
    });

    return success(periods);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) return unauthorized();

  if (session.user.role !== "HR_ADMIN") {
    return forbidden();
  }

  try {
    const body = await req.json();
    const { name, startDate, endDate } = body;

    if (!name?.trim() || !startDate || !endDate) {
      return badRequest("name, startDate, and endDate are required");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return badRequest("endDate must be after startDate");
    }

    const period = await prisma.evaluationPeriod.create({
      data: {
        name: name.trim(),
        startDate: start,
        endDate: end,
        status: "UPCOMING",
      },
      include: {
        phases: true,
        _count: { select: { goalSheets: true } },
      },
    });

    return success(period, 201);
  } catch {
    return serverError();
  }
}
