import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { GoalReviewContent } from "@/components/goals/goal-review-content";
import { UserRole } from "@prisma/client";

export default async function GoalReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = session.user.role as UserRole;
  if (userRole === UserRole.MEMBER) redirect("/goals");

  const goalSheet = await prisma.goalSheet.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          image: true,
          department: { select: { name: true } },
        },
      },
      evaluationPeriod: { include: { phases: true } },
      goals: {
        where: { isDeleted: false },
        orderBy: [{ category: "asc" }, { orderIndex: "asc" }],
        include: {
          progressRecords: { orderBy: { recordedAt: "desc" }, take: 3 },
          comments: {
            include: { author: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!goalSheet) notFound();

  return (
    <AppLayout
      breadcrumbs={[
        { label: "ダッシュボード", href: "/dashboard" },
        { label: "チーム管理", href: "/team" },
        { label: `${goalSheet.user.name}の目標シート` },
      ]}
    >
      <GoalReviewContent
        goalSheet={goalSheet}
        reviewerRole={userRole}
        reviewerId={session.user.id}
      />
    </AppLayout>
  );
}
