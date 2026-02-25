"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoalCategory, GoalSheetStatus, PhaseType } from "@prisma/client";
import {
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_DESCRIPTIONS,
  GOAL_CATEGORY_COLORS,
  GOAL_SHEET_STATUS_LABELS,
  GOAL_SHEET_STATUS_COLORS,
  PHASE_TYPE_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { GoalCard } from "./goal-card";
import { GoalFormDialog } from "./goal-form-dialog";
import {
  Target,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  category: GoalCategory;
  title: string;
  description: string | null;
  kpiDescription: string | null;
  weight: number;
  orderIndex: number;
  progressRecords: { progressRate: number }[];
  comments: {
    id: string;
    content: string;
    author: { id: string; name: string; image: string | null };
    createdAt?: Date;
  }[];
}

interface GoalSheet {
  id: string;
  status: GoalSheetStatus;
  submittedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionComment: string | null;
  goals: Goal[];
}

interface GoalsListContentProps {
  userId: string;
  activePeriod: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    phases: {
      id: string;
      phaseType: PhaseType;
      startDate: Date;
      endDate: Date;
      isActive: boolean;
    }[];
  } | null;
  goalSheet: GoalSheet | null;
}

const CATEGORIES = [GoalCategory.P_GOAL, GoalCategory.V_GOAL_1, GoalCategory.V_GOAL_2];

export function GoalsListContent({
  userId,
  activePeriod,
  goalSheet: initialGoalSheet,
}: GoalsListContentProps) {
  const router = useRouter();
  const [goalSheet, setGoalSheet] = useState<GoalSheet | null>(initialGoalSheet);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<GoalCategory>(GoalCategory.P_GOAL);

  const goalsByCategory = CATEGORIES.reduce(
    (acc, cat) => ({
      ...acc,
      [cat]: goalSheet?.goals.filter((g) => g.category === cat) ?? [],
    }),
    {} as Record<GoalCategory, Goal[]>
  );

  const totalWeight = (category: GoalCategory) =>
    goalsByCategory[category].reduce((sum, g) => sum + g.weight, 0);

  const canEdit =
    !goalSheet ||
    goalSheet.status === "DRAFT" ||
    goalSheet.status === "REJECTED";

  const handleCreateGoalSheet = async () => {
    if (!activePeriod) return;
    try {
      const res = await fetch("/api/v1/goal-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationPeriodId: activePeriod.id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGoalSheet(data);
      toast.success("目標シートを作成しました");
    } catch {
      toast.error("目標シートの作成に失敗しました");
    }
  };

  const handleSubmit = async () => {
    if (!goalSheet) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/goal-sheets/${goalSheet.id}/submit`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGoalSheet((prev) => prev ? { ...prev, status: "SUBMITTED" } : prev);
      toast.success("目標シートを提出しました");
      router.refresh();
    } catch {
      toast.error("提出に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalSaved = useCallback(
    (savedGoal: Goal) => {
      setGoalSheet((prev) => {
        if (!prev) return prev;
        const exists = prev.goals.find((g) => g.id === savedGoal.id);
        return {
          ...prev,
          goals: exists
            ? prev.goals.map((g) => (g.id === savedGoal.id ? savedGoal : g))
            : [...prev.goals, savedGoal],
        };
      });
      setShowGoalForm(false);
      setEditingGoal(null);
      toast.success(editingGoal ? "目標を更新しました" : "目標を追加しました");
    },
    [editingGoal]
  );

  const handleGoalDelete = useCallback(async (goalId: string) => {
    try {
      const res = await fetch(`/api/v1/goals/${goalId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setGoalSheet((prev) => {
        if (!prev) return prev;
        return { ...prev, goals: prev.goals.filter((g) => g.id !== goalId) };
      });
      toast.success("目標を削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  }, []);

  const openAddGoal = (category: GoalCategory) => {
    setDefaultCategory(category);
    setEditingGoal(null);
    setShowGoalForm(true);
  };

  const openEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const totalGoals = goalSheet?.goals.length ?? 0;
  const canSubmit =
    canEdit && goalSheet && totalGoals > 0 && goalSheet.status !== "SUBMITTED";

  if (!activePeriod) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">
            評価期間が設定されていません
          </h2>
          <p className="text-sm text-gray-500 mt-2 text-center">
            HR管理者に評価期間の設定を依頼してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            目標設定
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activePeriod.name} ·{" "}
            {activePeriod.phases.find((p) => p.isActive)
              ? PHASE_TYPE_LABELS[activePeriod.phases.find((p) => p.isActive)!.phaseType]
              : "フェーズなし"}
            フェーズ
          </p>
        </div>
        <div className="flex items-center gap-2">
          {goalSheet && (
            <Badge
              className={cn(
                "text-sm border",
                GOAL_SHEET_STATUS_COLORS[goalSheet.status]
              )}
            >
              {GOAL_SHEET_STATUS_LABELS[goalSheet.status]}
            </Badge>
          )}
          {canSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "提出中..." : "提出する"}
            </Button>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {goalSheet?.status === "REJECTED" && goalSheet.rejectionComment && (
        <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">差し戻しコメント</p>
            <p className="text-sm text-red-600 mt-1">
              {goalSheet.rejectionComment}
            </p>
          </div>
        </div>
      )}

      {goalSheet?.status === "SUBMITTED" && (
        <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            目標シートは提出済みです。マネージャーの承認をお待ちください。
          </p>
        </div>
      )}

      {goalSheet?.status === "APPROVED" && (
        <div className="flex gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">
            目標シートが承認されました。目標達成に向けて取り組みましょう！
          </p>
        </div>
      )}

      {/* No Goal Sheet */}
      {!goalSheet && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">
              目標シートを作成しましょう
            </h2>
            <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
              P目標（Performance目標）とV目標（Value目標）を設定して、
              マネージャーの承認を受けましょう。
            </p>
            <Button
              onClick={handleCreateGoalSheet}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              目標シートを作成する
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Goal Tabs */}
      {goalSheet && (
        <Tabs defaultValue={GoalCategory.P_GOAL} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100/80">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="relative data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span>{GOAL_CATEGORY_LABELS[cat]}</span>
                {goalsByCategory[cat].length > 0 && (
                  <span className="ml-1.5 text-xs font-medium text-gray-500">
                    {goalsByCategory[cat].length}
                  </span>
                )}
                {totalWeight(cat) > 100 && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat} value={cat} className="space-y-4 mt-4">
              {/* Category Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs border",
                        GOAL_CATEGORY_COLORS[cat]
                      )}
                    >
                      {GOAL_CATEGORY_LABELS[cat]}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {GOAL_CATEGORY_DESCRIPTIONS[cat]}
                    </span>
                  </div>
                  {goalsByCategory[cat].length > 0 && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            ウェイト合計
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              Math.abs(totalWeight(cat) - 100) < 0.1
                                ? "text-green-600"
                                : totalWeight(cat) > 100
                                ? "text-red-600"
                                : "text-orange-600"
                            )}
                          >
                            {totalWeight(cat).toFixed(0)}% / 100%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(totalWeight(cat), 100)}
                          className={cn(
                            "h-1.5",
                            totalWeight(cat) > 100 ? "bg-red-100" : ""
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddGoal(cat)}
                    className="ml-4"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    目標を追加
                  </Button>
                )}
              </div>

              {/* Goal List */}
              {goalsByCategory[cat].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <Target className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-400">
                    {GOAL_CATEGORY_LABELS[cat]}がありません
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    「目標を追加」ボタンから追加してください
                  </p>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddGoal(cat)}
                      className="mt-4 text-indigo-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {GOAL_CATEGORY_LABELS[cat]}を追加
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {goalsByCategory[cat].map((goal, index) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      index={index}
                      canEdit={canEdit}
                      onEdit={() => openEditGoal(goal)}
                      onDelete={() => handleGoalDelete(goal.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Goal Form Dialog */}
      {showGoalForm && goalSheet && (
        <GoalFormDialog
          open={showGoalForm}
          onClose={() => {
            setShowGoalForm(false);
            setEditingGoal(null);
          }}
          goalSheetId={goalSheet.id}
          defaultCategory={defaultCategory}
          editingGoal={editingGoal}
          onSaved={handleGoalSaved}
        />
      )}
    </div>
  );
}
