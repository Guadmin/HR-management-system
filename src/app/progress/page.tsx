import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { ProgressContent } from "@/components/progress/progress-content";

export default async function ProgressPage() {
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
            include: {
              progressRecords: {
                orderBy: { recordedAt: "desc" },
              },
              comments: {
                orderBy: { createdAt: "desc" },
                include: {
                  author: { select: { id: true, name: true, image: true } },
                },
              },
            },
          },
        },
      })
    : null;

  return (
    <AppLayout>
      <ProgressContent
        userId={session.user.id}
        activePeriod={activePeriod}
        goalSheet={goalSheet}
      />
    </AppLayout>
  );
}
