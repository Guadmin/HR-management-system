import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackContent } from "@/components/feedback/feedback-content";

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activePeriod = await prisma.evaluationPeriod.findFirst({
    where: { status: "ACTIVE" },
    include: {
      phases: { orderBy: { startDate: "asc" } },
    },
  });

  const goalSheet = activePeriod
    ? await prisma.goalSheet.findUnique({
        where: {
          userId_evaluationPeriodId: {
            userId: session.user.id,
            evaluationPeriodId: activePeriod.id,
          },
        },
        include: {
          goals: {
            where: { isDeleted: false },
            orderBy: { orderIndex: "asc" },
          },
          midTermFeedbacks: {
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
          },
        },
      })
    : null;

  // If manager, also get team sheets needing feedback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamSheetsForFeedback: any[] = [];

  if (
    session.user.role === "MANAGER" ||
    session.user.role === "DIRECTOR" ||
    session.user.role === "HR_ADMIN"
  ) {
    const managedTeams = await prisma.team.findMany({
      where: {
        managerId:
          session.user.role === "MANAGER" ? session.user.id : undefined,
      },
      include: {
        members: {
          where: { endDate: null },
          include: { user: true },
        },
      },
    });

    const memberIds = managedTeams.flatMap((t) =>
      t.members.map((m) => m.userId)
    );

    if (memberIds.length > 0) {
      teamSheetsForFeedback = await prisma.goalSheet.findMany({
        where: {
          userId: { in: memberIds },
          evaluationPeriodId: activePeriod?.id,
          status: "APPROVED",
        },
        include: {
          user: { select: { id: true, name: true, jobTitle: true } },
          goals: { where: { isDeleted: false }, orderBy: { orderIndex: "asc" } },
          midTermFeedbacks: {
            where: { feedbackGiverId: session.user.id },
          },
        },
      });
    }
  }

  return (
    <AppLayout>
      <FeedbackContent
        userId={session.user.id}
        userRole={session.user.role}
        activePeriod={activePeriod}
        goalSheet={goalSheet}
        teamSheetsForFeedback={teamSheetsForFeedback}
      />
    </AppLayout>
  );
}
