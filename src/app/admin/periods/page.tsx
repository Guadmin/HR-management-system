import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { AdminPeriodsContent } from "@/components/admin/admin-periods-content";

export default async function AdminPeriodsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only HR_ADMIN can access
  if (session.user.role !== "HR_ADMIN") {
    redirect("/dashboard");
  }

  const periods = await prisma.evaluationPeriod.findMany({
    orderBy: { startDate: "desc" },
    include: {
      phases: { orderBy: { startDate: "asc" } },
      _count: {
        select: { goalSheets: true },
      },
    },
  });

  return (
    <AppLayout>
      <AdminPeriodsContent
        userId={session.user.id}
        periods={periods}
      />
    </AppLayout>
  );
}
