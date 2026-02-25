import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { EvaluationContent } from "@/components/evaluations/evaluation-content";

export default async function EvaluationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activePeriod = await prisma.evaluationPeriod.findFirst({
    where: { status: "ACTIVE" },
    include: { phases: true },
    orderBy: { startDate: "desc" },
  });

  const myGoalSheet = activePeriod
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
            orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
          },
          evaluations: {
            include: {
              goalEvaluations: true,
              overallEvaluation: true,
              evaluator: { select: { id: true, name: true } },
            },
          },
        },
      })
    : null;

  return (
    <AppLayout
      breadcrumbs={[
        { label: "ダッシュボード", href: "/dashboard" },
        { label: "期末評価" },
      ]}
    >
      <EvaluationContent
        userId={session.user.id}
        userRole={session.user.role}
        activePeriod={activePeriod}
        goalSheet={myGoalSheet}
      />
    </AppLayout>
  );
}
