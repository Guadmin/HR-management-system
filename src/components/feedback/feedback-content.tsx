"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoalCategory, FeedbackProgressStatus } from "@prisma/client";
import { GOAL_CATEGORY_LABELS, GOAL_CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquarePlus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ClipboardList,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const PROGRESS_STATUS_CONFIG: Record<
  FeedbackProgressStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  ON_TRACK: {
    label: "順調",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  SLIGHTLY_BEHIND: {
    label: "やや遅れ",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  NEEDS_IMPROVEMENT: {
    label: "要改善",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

interface GoalItem {
  id: string;
  title: string;
  category: GoalCategory;
  description: string | null;
}

interface FeedbackItem {
  goalId: string;
  progressStatus: FeedbackProgressStatus;
  comment: string | null;
  recommendedAction: string | null;
  goal: { id: string; title: string; category: GoalCategory };
}

interface FeedbackRecord {
  id: string;
  overallComment: string | null;
  meetingDate: Date | string | null;
  createdAt: Date | string;
  feedbackGiver: { id: string; name: string };
  items: FeedbackItem[];
}

interface GoalSheetForFeedback {
  id: string;
  user: { id: string; name: string; jobTitle: string | null };
  goals: GoalItem[];
  midTermFeedbacks: { id: string }[];
}

interface FeedbackContentProps {
  userId: string;
  userRole: string;
  activePeriod: {
    id: string;
    name: string;
    phases: { phaseType: string; isActive: boolean }[];
  } | null;
  goalSheet: {
    id: string;
    status: string;
    goals: GoalItem[];
    midTermFeedbacks: FeedbackRecord[];
  } | null;
  teamSheetsForFeedback: GoalSheetForFeedback[];
}

function FeedbackFormDialog({
  targetSheet,
  open,
  onOpenChange,
  onSubmitted,
}: {
  targetSheet: GoalSheetForFeedback;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted: () => void;
}) {
  const [goalStatuses, setGoalStatuses] = useState<
    Record<string, FeedbackProgressStatus>
  >({});
  const [goalComments, setGoalComments] = useState<Record<string, string>>({});
  const [goalActions, setGoalActions] = useState<Record<string, string>>({});
  const [overallComment, setOverallComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const unratedGoals = targetSheet.goals.filter((g) => !goalStatuses[g.id]);
    if (unratedGoals.length > 0) {
      toast.error("すべての目標に進捗ステータスを設定してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalSheetId: targetSheet.id,
          overallComment: overallComment || null,
          items: targetSheet.goals.map((g) => ({
            goalId: g.id,
            progressStatus: goalStatuses[g.id],
            comment: goalComments[g.id] || null,
            recommendedAction: goalActions[g.id] || null,
          })),
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("フィードバックを送信しました");
      onOpenChange(false);
      onSubmitted();
    } catch {
      toast.error("送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            中間フィードバック — {targetSheet.user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {targetSheet.goals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-start gap-2">
                <Badge
                  className={cn(
                    "text-xs border flex-shrink-0",
                    GOAL_CATEGORY_COLORS[goal.category]
                  )}
                >
                  {GOAL_CATEGORY_LABELS[goal.category]}
                </Badge>
                <p className="text-sm font-medium text-gray-900">{goal.title}</p>
              </div>

              {/* Progress status buttons */}
              <div className="flex gap-2">
                {(
                  Object.keys(PROGRESS_STATUS_CONFIG) as FeedbackProgressStatus[]
                ).map((status) => {
                  const config = PROGRESS_STATUS_CONFIG[status];
                  return (
                    <button
                      key={status}
                      onClick={() =>
                        setGoalStatuses((prev) => ({
                          ...prev,
                          [goal.id]: status,
                        }))
                      }
                      className={cn(
                        "flex-1 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 transition-all",
                        goalStatuses[goal.id] === status
                          ? config.color + " scale-105"
                          : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                      )}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  );
                })}
              </div>

              <Textarea
                placeholder="進捗コメント（任意）"
                rows={2}
                value={goalComments[goal.id] ?? ""}
                onChange={(e) =>
                  setGoalComments((prev) => ({
                    ...prev,
                    [goal.id]: e.target.value,
                  }))
                }
                className="resize-none text-sm"
              />
              <Textarea
                placeholder="推奨アクション（任意）"
                rows={1}
                value={goalActions[goal.id] ?? ""}
                onChange={(e) =>
                  setGoalActions((prev) => ({
                    ...prev,
                    [goal.id]: e.target.value,
                  }))
                }
                className="resize-none text-sm"
              />
            </div>
          ))}

          <div className="pt-2 border-t">
            <Label className="text-sm">総合コメント（任意）</Label>
            <Textarea
              placeholder="全体的なフィードバックや激励メッセージを記入してください"
              rows={3}
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              className="mt-2 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "フィードバックを送信する"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FeedbackContent({
  userId,
  userRole,
  activePeriod,
  goalSheet,
  teamSheetsForFeedback,
}: FeedbackContentProps) {
  const router = useRouter();
  const [selectedSheet, setSelectedSheet] =
    useState<GoalSheetForFeedback | null>(null);

  const isManager =
    userRole === "MANAGER" ||
    userRole === "DIRECTOR" ||
    userRole === "HR_ADMIN";

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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          中間フィードバック
        </h1>
        <p className="text-sm text-gray-500 mt-1">{activePeriod.name}</p>
      </div>

      {/* Own received feedbacks */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          受け取ったフィードバック
        </h2>

        {!goalSheet || goalSheet.status !== "APPROVED" ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-10 text-center">
              <p className="text-sm text-gray-500">
                目標シートが承認されると、マネージャーからフィードバックが届きます
              </p>
            </CardContent>
          </Card>
        ) : goalSheet.midTermFeedbacks.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-10 text-center">
              <MessageSquarePlus className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                まだフィードバックはありません
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goalSheet.midTermFeedbacks.map((fb) => (
              <Card key={fb.id} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{fb.feedbackGiver.name}</span>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                        マネージャー
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400 font-normal">
                      {format(new Date(fb.createdAt), "M月d日", { locale: ja })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fb.items.map((item) => {
                    const config = PROGRESS_STATUS_CONFIG[item.progressStatus];
                    return (
                      <div
                        key={item.goalId}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Badge
                          className={cn(
                            "border text-xs flex items-center gap-1 flex-shrink-0",
                            config.color
                          )}
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.goal.title}
                          </p>
                          {item.comment && (
                            <p className="text-xs text-gray-600 mt-1">
                              {item.comment}
                            </p>
                          )}
                          {item.recommendedAction && (
                            <p className="text-xs text-indigo-600 mt-1">
                              推奨: {item.recommendedAction}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {fb.overallComment && (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-sm text-gray-700">{fb.overallComment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Manager: team sheets to give feedback */}
      {isManager && teamSheetsForFeedback.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            フィードバックを送る（チームメンバー）
          </h2>
          <div className="space-y-3">
            {teamSheetsForFeedback.map((sheet) => {
              const alreadySent = sheet.midTermFeedbacks.length > 0;
              return (
                <Card
                  key={sheet.id}
                  className={cn(
                    "border-0 shadow-sm",
                    alreadySent && "opacity-60"
                  )}
                >
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {sheet.user.name}
                      </p>
                      {sheet.user.jobTitle && (
                        <p className="text-xs text-gray-500">
                          {sheet.user.jobTitle}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        目標 {sheet.goals.length}件
                      </p>
                    </div>
                    {alreadySent ? (
                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        送信済み
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setSelectedSheet(sheet)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5 mr-1" />
                        フィードバックする
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {selectedSheet && (
        <FeedbackFormDialog
          targetSheet={selectedSheet}
          open={!!selectedSheet}
          onOpenChange={(v) => !v && setSelectedSheet(null)}
          onSubmitted={() => {
            setSelectedSheet(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
