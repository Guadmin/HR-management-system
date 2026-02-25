import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { GoalsListContent } from "@/components/goals/goals-list-content";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activePeriod = await prisma.evaluationPeriod.findFirst({
    where: { status: "ACTIVE" },
    include: {
      phases: { orderBy: { startDate: "asc" } },
    },
    orderBy: { startDate: "desc" },
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
                take: 1,
              },
              comments: {
                include: { author: { select: { id: true, name: true, image: true } } },
                orderBy: { createdAt: "desc" },
                take: 3,
              },
            },
          },
        },
      })
    : null;

  return (
    <AppLayout
      breadcrumbs={[
        { label: "ダッシュボード", href: "/dashboard" },
        { label: "目標設定" },
      ]}
    >
      <GoalsListContent
        userId={session.user.id}
        activePeriod={activePeriod}
        goalSheet={goalSheet}
      />
    </AppLayout>
  );
}
