"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoalCategory } from "@prisma/client";
import { GOAL_CATEGORY_LABELS, GOAL_CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  ClipboardList,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ProgressRecord {
  id: string;
  progressRate: number;
  comment: string | null;
  recordedAt: Date | string;
}

interface GoalComment {
  id: string;
  content: string;
  createdAt: Date | string;
  author: { id: string; name: string; image: string | null };
}

interface GoalWithProgress {
  id: string;
  category: GoalCategory;
  title: string;
  description: string | null;
  kpiDescription: string | null;
  weight: number;
  progressRecords: ProgressRecord[];
  comments: GoalComment[];
}

interface ProgressContentProps {
  userId: string;
  activePeriod: {
    id: string;
    name: string;
    phases: {
      phaseType: string;
      isActive: boolean;
    }[];
  } | null;
  goalSheet: {
    id: string;
    status: string;
    goals: GoalWithProgress[];
  } | null;
}

function GoalProgressCard({
  goal,
  userId,
  onUpdated,
}: {
  goal: GoalWithProgress;
  userId: string;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [newRate, setNewRate] = useState(
    goal.progressRecords[0]?.progressRate ?? 0
  );
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestProgress = goal.progressRecords[0];
  const currentRate = latestProgress?.progressRate ?? 0;

  const handleSaveProgress = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/goal-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: goal.id,
          progressRate: newRate,
          comment: newComment || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("進捗を更新しました");
      setShowDialog(false);
      setNewComment("");
      onUpdated();
    } catch {
      toast.error("進捗の更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Badge
                className={cn(
                  "text-xs border flex-shrink-0 mt-0.5",
                  GOAL_CATEGORY_COLORS[goal.category]
                )}
              >
                {GOAL_CATEGORY_LABELS[goal.category]}
              </Badge>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {goal.title}
                </p>
                {goal.kpiDescription && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    KPI: {goal.kpiDescription}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 h-7 w-7 p-0"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress value={currentRate} className="flex-1 h-2" />
            <span className="text-sm font-bold text-gray-700 w-10 text-right">
              {currentRate}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewRate(currentRate);
                setShowDialog(true);
              }}
              className="flex-shrink-0 h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              更新
            </Button>
          </div>

          {/* Expanded: history + comments */}
          {expanded && (
            <div className="mt-4 space-y-4">
              {/* Progress history */}
              {goal.progressRecords.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    進捗履歴
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {goal.progressRecords.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-start gap-2 text-xs"
                      >
                        <span className="text-gray-400 flex-shrink-0 w-28">
                          {format(new Date(r.recordedAt), "M/d HH:mm", {
                            locale: ja,
                          })}
                        </span>
                        <span className="font-bold text-indigo-600 w-10 flex-shrink-0">
                          {r.progressRate}%
                        </span>
                        {r.comment && (
                          <span className="text-gray-600">{r.comment}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {goal.comments.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    コメント
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {goal.comments.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-2 p-2 bg-gray-50 rounded-md"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-indigo-600">
                            {c.author.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">
                              {c.author.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(new Date(c.createdAt), "M/d", {
                                locale: ja,
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Update Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">進捗を更新する</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1 truncate">
                {goal.title}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  達成率
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  {newRate}%
                </span>
              </div>
              <Slider
                value={[newRate]}
                onValueChange={(v) => setNewRate(v[0])}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                コメント（任意）
              </label>
              <Textarea
                placeholder="進捗の詳細や状況を記入してください"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveProgress}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "保存する"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ProgressContent({
  userId,
  activePeriod,
  goalSheet,
}: ProgressContentProps) {
  const router = useRouter();
  const isApproved = goalSheet?.status === "APPROVED";

  if (!activePeriod) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24">
          <ClipboardList className="w-16 h-16 text-gray-200 mb-4" />
          <h2 className="text-lg font-semibold text-gray-600">
            評価期間が設定されていません
          </h2>
        </div>
      </div>
    );
  }

  const totalGoals = goalSheet?.goals.length ?? 0;
  const avgProgress =
    totalGoals > 0
      ? Math.round(
          goalSheet!.goals.reduce((sum, g) => {
            const latest = g.progressRecords[0]?.progressRate ?? 0;
            return sum + latest;
          }, 0) / totalGoals
        )
      : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          目標進捗管理
        </h1>
        <p className="text-sm text-gray-500 mt-1">{activePeriod.name}</p>
      </div>

      {!goalSheet || !isApproved ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Lock className="w-12 h-12 text-gray-300 mb-4" />
          <h2 className="text-base font-semibold text-gray-600">
            目標シートが承認されていません
          </h2>
          <p className="text-sm text-gray-400 mt-1 text-center">
            目標シートがマネージャーに承認されてから進捗を入力できます
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push("/goals")}
          >
            目標シートを確認する
          </Button>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">
                    {avgProgress}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">平均達成率</div>
                </div>
                <div className="flex-1">
                  <Progress value={avgProgress} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    {totalGoals}個の目標
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goal list */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              目標別進捗
            </h2>
            <div className="space-y-3">
              {goalSheet.goals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  userId={userId}
                  onUpdated={() => router.refresh()}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
