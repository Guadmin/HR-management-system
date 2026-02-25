import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { UserRole } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      department: true,
      teamMemberships: {
        where: { endDate: null },
        include: {
          team: {
            include: {
              manager: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!user) redirect("/login");

  // Fetch active evaluation period
  const activePeriod = await prisma.evaluationPeriod.findFirst({
    where: { status: "ACTIVE" },
    include: {
      phases: { orderBy: { startDate: "asc" } },
    },
    orderBy: { startDate: "desc" },
  });

  // Fetch user's goal sheet for active period
  const myGoalSheet = activePeriod
    ? await prisma.goalSheet.findUnique({
        where: {
          userId_evaluationPeriodId: {
            userId: user.id,
            evaluationPeriodId: activePeriod.id,
          },
        },
        include: {
          goals: {
            where: { isDeleted: false },
            include: {
              progressRecords: {
                orderBy: { recordedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      })
    : null;

  // Fetch notifications
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Manager-specific data
  let teamGoalSheets = null;
  let pendingApprovals = null;

  if (
    user.role === UserRole.MANAGER ||
    user.role === UserRole.DIRECTOR ||
    user.role === UserRole.HR_ADMIN
  ) {
    const myTeam = await prisma.team.findFirst({
      where: { managerId: user.id },
      include: {
        members: {
          where: { endDate: null },
          include: { user: true },
        },
      },
    });

    if (myTeam && activePeriod) {
      const teamMemberIds = myTeam.members.map((m) => m.userId);
      teamGoalSheets = await prisma.goalSheet.findMany({
        where: {
          userId: { in: teamMemberIds },
          evaluationPeriodId: activePeriod.id,
        },
        include: {
          user: { select: { id: true, name: true, image: true, jobTitle: true } },
          goals: { where: { isDeleted: false } },
        },
        orderBy: { updatedAt: "desc" },
      });

      pendingApprovals = teamGoalSheets.filter(
        (gs) => gs.status === "SUBMITTED"
      );
    }
  }

  return (
    <AppLayout breadcrumbs={[{ label: "ダッシュボード" }]}>
      <DashboardContent
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          jobTitle: user.jobTitle,
          department: user.department,
        }}
        activePeriod={activePeriod}
        myGoalSheet={myGoalSheet}
        notifications={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
        teamGoalSheets={teamGoalSheets}
        pendingApprovals={pendingApprovals}
      />
    </AppLayout>
  );
}
