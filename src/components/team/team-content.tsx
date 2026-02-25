"use client";

import Link from "next/link";
import { UserRole, GoalSheetStatus } from "@prisma/client";
import {
  GOAL_SHEET_STATUS_LABELS,
  GOAL_SHEET_STATUS_COLORS,
  ROLE_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  ChevronRight,
  ClipboardCheck,
  Target,
  CheckCircle2,
} from "lucide-react";

interface TeamContentProps {
  teams: {
    id: string;
    name: string;
    department: { name: string };
    manager?: { id: string; name: string } | null;
    members: {
      userId: string;
      user: {
        id: string;
        name: string;
        email: string;
        jobTitle: string | null;
        image: string | null;
        role: UserRole;
        department: { name: string } | null;
      };
    }[];
  }[];
  goalSheets: {
    id: string;
    status: GoalSheetStatus;
    userId: string;
    user: { id: string; name: string };
    goals: { id: string }[];
  }[];
  activePeriod: {
    id: string;
    name: string;
  } | null;
  userRole: UserRole;
}

export function TeamContent({
  teams,
  goalSheets,
  activePeriod,
  userRole,
}: TeamContentProps) {
  const goalSheetByUser = goalSheets.reduce(
    (acc, gs) => ({ ...acc, [gs.userId]: gs }),
    {} as Record<string, (typeof goalSheets)[0]>
  );

  const pendingCount = goalSheets.filter((gs) => gs.status === "SUBMITTED").length;
  const approvedCount = goalSheets.filter((gs) => gs.status === "APPROVED").length;
  const totalMembers = teams.reduce((acc, t) => acc + t.members.length, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          チーム管理
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {activePeriod ? `評価期間: ${activePeriod.name}` : "評価期間なし"}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
                <p className="text-xs text-gray-500">チーム人数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-xs text-gray-500">承認待ち</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                <p className="text-xs text-gray-500">承認済み</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {goalSheets.length > 0
                    ? Math.round((approvedCount / goalSheets.length) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-500">承認率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams */}
      {teams.map((team) => (
        <Card key={team.id} className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/80 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  {team.name}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  {team.department.name}
                  {team.manager && ` · マネージャー: ${team.manager.name}`}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {team.members.length}名
              </Badge>
            </div>

            {/* Team progress bar */}
            {activePeriod && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>目標シート提出状況</span>
                  <span>
                    {
                      team.members.filter(
                        (m) => goalSheetByUser[m.userId]?.status !== "DRAFT" &&
                          goalSheetByUser[m.userId] !== undefined
                      ).length
                    }{" "}
                    / {team.members.length}
                  </span>
                </div>
                <Progress
                  value={
                    team.members.length > 0
                      ? (team.members.filter(
                          (m) =>
                            goalSheetByUser[m.userId]?.status !== "DRAFT" &&
                            goalSheetByUser[m.userId] !== undefined
                        ).length /
                          team.members.length) *
                        100
                      : 0
                  }
                  className="h-1.5"
                />
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {team.members.map(({ user }) => {
                const sheet = goalSheetByUser[user.id];
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors"
                  >
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                        {user.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        {user.role !== UserRole.MEMBER && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {user.jobTitle ?? "役職なし"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {sheet ? (
                        <Badge
                          className={cn(
                            "text-xs border",
                            GOAL_SHEET_STATUS_COLORS[sheet.status]
                          )}
                        >
                          {GOAL_SHEET_STATUS_LABELS[sheet.status]}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-gray-400 border-gray-200"
                        >
                          未作成
                        </Badge>
                      )}
                      {sheet && sheet.status === "SUBMITTED" && (
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                          <Link href={`/goals/review/${sheet.id}`}>
                            確認・承認
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      )}
                      {sheet && sheet.status === "APPROVED" && (
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-gray-500">
                          <Link href={`/goals/review/${sheet.id}`}>
                            詳細を見る
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {teams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <Users className="w-16 h-16 text-gray-200 mb-4" />
          <h2 className="text-lg font-semibold text-gray-600">
            チームが割り当てられていません
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            HR管理者にチームの設定を依頼してください
          </p>
        </div>
      )}
    </div>
  );
}
