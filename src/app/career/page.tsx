import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppLayout } from "@/components/layout/app-layout";
import { CareerContent } from "@/components/career/career-content";

export default async function CareerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const careerSheet = await prisma.careerDesignSheet.findFirst({
    where: { subjectUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      strengths: { orderBy: { orderIndex: "asc" } },
      developmentAreas: { orderBy: { orderIndex: "asc" } },
      developmentPlans: {
        orderBy: { orderIndex: "asc" },
        include: {
          owner: { select: { id: true, name: true } },
        },
      },
      careerAspiration: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  return (
    <AppLayout>
      <CareerContent
        userId={session.user.id}
        userRole={session.user.role}
        careerSheet={careerSheet}
      />
    </AppLayout>
  );
}
