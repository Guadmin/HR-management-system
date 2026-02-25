import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { TeamContent } from "@/components/team/team-content";
import { UserRole } from "@prisma/client";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = session.user.role as UserRole;
  if (userRole === UserRole.MEMBER) redirect("/dashboard");

  const activePeriod = await prisma.evaluationPeriod.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startDate: "desc" },
  });

  // Find teams managed by this user
  const managedTeams = await prisma.team.findMany({
    where: {
      managerId: session.user.id,
    },
    include: {
      members: {
        where: { endDate: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              jobTitle: true,
              image: true,
              role: true,
              department: { select: { name: true } },
            },
          },
        },
      },
      department: true,
    },
  });

  // For Directors and HR admins, get all teams in their scope
  let allTeams = managedTeams;
  if (
    userRole === UserRole.DIRECTOR ||
    userRole === UserRole.HR_ADMIN
  ) {
    allTeams = await prisma.team.findMany({
      include: {
        members: {
          where: { endDate: null },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                jobTitle: true,
                image: true,
                role: true,
                department: { select: { name: true } },
              },
            },
          },
        },
        department: true,
        manager: { select: { id: true, name: true } },
      },
    });
  }

  // Get goal sheets for all team members
  let teamMemberIds: string[] = [];
  allTeams.forEach((team) => {
    team.members.forEach((m) => {
      if (!teamMemberIds.includes(m.userId)) {
        teamMemberIds.push(m.userId);
      }
    });
  });

  const goalSheets = activePeriod
    ? await prisma.goalSheet.findMany({
        where: {
          userId: { in: teamMemberIds },
          evaluationPeriodId: activePeriod.id,
        },
        include: {
          user: { select: { id: true, name: true } },
          goals: { where: { isDeleted: false } },
        },
      })
    : [];

  return (
    <AppLayout
      breadcrumbs={[
        { label: "ダッシュボード", href: "/dashboard" },
        { label: "チーム管理" },
      ]}
    >
      <TeamContent
        teams={allTeams}
        goalSheets={goalSheets}
        activePeriod={activePeriod}
        userRole={userRole}
      />
    </AppLayout>
  );
}
