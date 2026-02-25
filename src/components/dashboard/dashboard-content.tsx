"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useNotificationStore } from "@/store/notification.store";
import { UserRole, GoalSheetStatus, PhaseType } from "@prisma/client";
import {
  ROLE_LABELS,
  PHASE_TYPE_LABELS,
  GOAL_SHEET_STATUS_LABELS,
  GOAL_SHEET_STATUS_COLORS,
} from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Users,
  ClipboardCheck,
  TrendingUp,
  Bell,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, format, isAfter, isBefore } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    jobTitle: string | null;
    department: { id: string; name: string } | null;
  };
  activePeriod: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    phases: {
      id: string;
      phaseType: PhaseType;
      startDate: Date;
      endDate: Date;
      isActive: boolean;
    }[];
  } | null;
  myGoalSheet: {
    id: string;
    status: GoalSheetStatus;
    submittedAt: Date | null;
    approvedAt: Date | null;
    rejectionComment: string | null;
    goals: {
      id: string;
      title: string;
      category: string;
      weight: number;
      progressRecords: { progressRate: number }[];
    }[];
  } | null;
  notifications: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    linkUrl: string | null;
    isRead: boolean;
    createdAt: string;
  }[];
  teamGoalSheets: {
    id: string;
    status: GoalSheetStatus;
    user: { id: string; name: string; image: string | null; jobTitle: string | null };
    goals: { id: string }[];
  }[] | null;
  pendingApprovals: {
    id: string;
    status: GoalSheetStatus;
    user: { id: string; name: string; image: string | null; jobTitle: string | null };
  }[] | null;
}

export function DashboardContent({
  user,
  activePeriod,
  myGoalSheet,
  notifications,
  teamGoalSheets,
  pendingApprovals,
}: DashboardContentProps) {
  const { setNotifications } = useNotificationStore();

  useEffect(() => {
    setNotifications(
      notifications.map((n) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }))
    );
  }, [notifications, setNotifications]);

  const currentPhase = activePeriod?.phases.find(
    (p) =>
      p.isActive ||
      (isAfter(new Date(), p.startDate) && isBefore(new Date(), p.endDate))
  );

  const avgProgress =
    myGoalSheet && myGoalSheet.goals.length > 0
      ? myGoalSheet.goals.reduce((acc, g) => {
          const latest = g.progressRecords[0];
          return acc + (latest?.progressRate ?? 0);
        }, 0) / myGoalSheet.goals.length
      : 0;

  const getNextAction = () => {
    if (!activePeriod) return null;
    if (!myGoalSheet || myGoalSheet.status === "DRAFT") {
      return {
        label: "目標シートを作成する",
        href: "/goals/new",
        urgent: true,
      };
    }
    if (myGoalSheet.status === "REJECTED") {
      return {
        label: "目標シートを修正して再提出する",
        href: `/goals/${myGoalSheet.id}`,
        urgent: true,
      };
    }
    if (myGoalSheet.status === "SUBMITTED") {
      return {
        label: "承認待ち",
        href: `/goals/${myGoalSheet.id}`,
        urgent: false,
      };
    }
    return null;
  };

  const nextAction = getNextAction();

  const isManager =
    user.role === UserRole.MANAGER ||
    user.role === UserRole.DIRECTOR ||
    user.role === UserRole.HR_ADMIN;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            おはようございます、{user.name.split(" ")[0]}さん
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.jobTitle && `${user.jobTitle} · `}
            {user.department?.name && `${user.department.name} · `}
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {format(new Date(), "yyyy年M月d日（eee）", { locale: ja })}
          </p>
        </div>
      </div>

      {/* Evaluation Period Timeline */}
      {activePeriod ? (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">
                  評価期間
                </p>
                <h2 className="text-white font-semibold text-lg mt-0.5">
                  {activePeriod.name}
                </h2>
              </div>
              {currentPhase && (
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {PHASE_TYPE_LABELS[currentPhase.phaseType]}フェーズ
                </Badge>
              )}
            </div>
            {/* Phase Timeline */}
            <div className="mt-4 flex items-center gap-1">
              {activePeriod.phases.map((phase, index) => {
                const isActive = currentPhase?.id === phase.id;
                const isPast = isBefore(phase.endDate, new Date());
                return (
                  <div key={phase.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          "w-full h-1.5 rounded-full",
                          isActive
                            ? "bg-white"
                            : isPast
                            ? "bg-white/60"
                            : "bg-white/20"
                        )}
                      />
                      <p
                        className={cn(
                          "text-[10px] mt-1 font-medium whitespace-nowrap",
                          isActive
                            ? "text-white"
                            : isPast
                            ? "text-indigo-200"
                            : "text-indigo-300"
                        )}
                      >
                        {PHASE_TYPE_LABELS[phase.phaseType]}
                      </p>
                    </div>
                    {index < activePeriod.phases.length - 1 && (
                      <div className="w-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 py-6">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-700">評価期間が設定されていません</p>
              <p className="text-sm text-gray-500">HR管理者に評価期間の設定を依頼してください</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Goal Sheet Status + Notifications */}
        <div className="lg:col-span-2 space-y-6">
          {/* Goal Sheet Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  目標シート
                </CardTitle>
                {myGoalSheet && (
                  <Badge
                    className={cn(
                      "text-xs border",
                      GOAL_SHEET_STATUS_COLORS[myGoalSheet.status]
                    )}
                  >
                    {GOAL_SHEET_STATUS_LABELS[myGoalSheet.status]}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!activePeriod ? (
                <EmptyState message="評価期間が開始されていません" />
              ) : !myGoalSheet ? (
                <div className="space-y-4">
                  <EmptyState
                    icon={<Target className="w-10 h-10 text-gray-300" />}
                    message="目標シートが作成されていません"
                    description="目標設定フェーズ中に目標を作成・提出してください"
                  />
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/goals/new">
                      目標シートを作成する <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Rejection Alert */}
                  {myGoalSheet.status === "REJECTED" && myGoalSheet.rejectionComment && (
                    <div className="flex gap-3 p-4 rounded-lg bg-red-50 border border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700">差し戻しコメント</p>
                        <p className="text-sm text-red-600 mt-1">{myGoalSheet.rejectionComment}</p>
                      </div>
                    </div>
                  )}

                  {/* Goals Overview */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">
                        {myGoalSheet.goals.length}件の目標
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        平均進捗 {Math.round(avgProgress)}%
                      </span>
                    </div>
                    <Progress value={avgProgress} className="h-2" />
                  </div>

                  {/* Goal items */}
                  <div className="space-y-2">
                    {myGoalSheet.goals.slice(0, 3).map((goal) => {
                      const progress = goal.progressRecords[0]?.progressRate ?? 0;
                      return (
                        <div
                          key={goal.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="w-1.5 h-8 rounded-full bg-indigo-200 overflow-hidden">
                            <div
                              className="w-full rounded-full bg-indigo-600 transition-all"
                              style={{ height: `${progress}%` }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {goal.title}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      );
                    })}
                    {myGoalSheet.goals.length > 3 && (
                      <p className="text-xs text-gray-400 text-center">
                        他 {myGoalSheet.goals.length - 3} 件の目標
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/goals/${myGoalSheet.id}`}>
                        詳細を見る
                      </Link>
                    </Button>
                    {nextAction && nextAction.urgent && (
                      <Button
                        asChild
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Link href={nextAction.href}>{nextAction.label}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manager: Pending Approvals */}
          {isManager && pendingApprovals && pendingApprovals.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-orange-500" />
                    承認待ちの目標シート
                  </CardTitle>
                  <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                    {pendingApprovals.length}件
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingApprovals.slice(0, 5).map((sheet) => (
                    <Link
                      key={sheet.id}
                      href={`/goals/review/${sheet.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                          {sheet.user.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{sheet.user.name}</p>
                        <p className="text-xs text-gray-500">{sheet.user.jobTitle}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
                {pendingApprovals.length > 5 && (
                  <Button asChild variant="ghost" className="w-full mt-2 text-indigo-600">
                    <Link href="/team">すべて見る ({pendingApprovals.length}件)</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Team Overview */}
          {isManager && teamGoalSheets && teamGoalSheets.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    チーム進捗
                  </CardTitle>
                  <Link
                    href="/team"
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    すべて見る
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamGoalSheets.slice(0, 5).map((sheet) => (
                    <div
                      key={sheet.id}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                          {sheet.user.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">{sheet.user.name}</p>
                          <Badge
                            className={cn(
                              "text-xs border ml-2 flex-shrink-0",
                              GOAL_SHEET_STATUS_COLORS[sheet.status]
                            )}
                          >
                            {GOAL_SHEET_STATUS_LABELS[sheet.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={sheet.status === "APPROVED" ? 50 : 0}
                            className="h-1 flex-1"
                          />
                          <span className="text-xs text-gray-500 w-8 text-right">
                            {sheet.goals.length}目標
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Notifications + Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Target className="w-4 h-4 text-indigo-600" />}
              label="目標数"
              value={myGoalSheet?.goals.length ?? 0}
              bg="bg-indigo-50"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
              label="平均進捗"
              value={`${Math.round(avgProgress)}%`}
              bg="bg-emerald-50"
            />
            {isManager && (
              <>
                <StatCard
                  icon={<Users className="w-4 h-4 text-blue-600" />}
                  label="チーム人数"
                  value={teamGoalSheets?.length ?? 0}
                  bg="bg-blue-50"
                />
                <StatCard
                  icon={<ClipboardCheck className="w-4 h-4 text-orange-600" />}
                  label="承認待ち"
                  value={pendingApprovals?.length ?? 0}
                  bg="bg-orange-50"
                />
              </>
            )}
          </div>

          {/* Recent Notifications */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                最新の通知
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <EmptyState
                  message="通知はありません"
                  icon={<Bell className="w-8 h-8 text-gray-200" />}
                />
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex gap-2 p-2 rounded-lg",
                        !notification.isRead && "bg-indigo-50/50"
                      )}
                    >
                      {!notification.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                      )}
                      <div className={!notification.isRead ? "" : "ml-3.5"}>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Action CTA */}
          {nextAction && nextAction.urgent && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                      アクションが必要です
                    </p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                      {nextAction.label}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-3 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Link href={nextAction.href}>
                        今すぐ対応 <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {myGoalSheet?.status === "APPROVED" && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      目標シートが承認されました
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      進捗を記録して目標達成を目指しましょう
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-3 bg-green-600 hover:bg-green-700"
                    >
                      <Link href="/progress">
                        進捗を記録 <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className={cn("rounded-xl p-4", bg)}>
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({
  message,
  description,
  icon,
}: {
  message: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {icon && <div className="mb-3">{icon}</div>}
      <p className="text-sm font-medium text-gray-500">{message}</p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
  );
}
