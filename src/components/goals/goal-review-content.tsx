"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoalCategory, GoalSheetStatus, UserRole } from "@prisma/client";
import {
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_COLORS,
  GOAL_SHEET_STATUS_LABELS,
  GOAL_SHEET_STATUS_COLORS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Target,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface GoalReviewContentProps {
  goalSheet: {
    id: string;
    status: GoalSheetStatus;
    submittedAt: Date | null;
    approvedAt: Date | null;
    rejectionComment: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      jobTitle: string | null;
      image: string | null;
      department: { name: string } | null;
    };
    evaluationPeriod: {
      id: string;
      name: string;
    };
    goals: {
      id: string;
      category: GoalCategory;
      title: string;
      description: string | null;
      kpiDescription: string | null;
      weight: number;
      progressRecords: { progressRate: number; comment: string | null }[];
      comments: {
        id: string;
        content: string;
        author: { id: string; name: string; image: string | null };
      }[];
    }[];
  };
  reviewerRole: UserRole;
  reviewerId: string;
}

const CATEGORIES = [GoalCategory.P_GOAL, GoalCategory.V_GOAL_1, GoalCategory.V_GOAL_2];

export function GoalReviewContent({
  goalSheet,
  reviewerRole,
  reviewerId,
}: GoalReviewContentProps) {
  const router = useRouter();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<GoalSheetStatus>(
    goalSheet.status
  );

  const canReview =
    currentStatus === "SUBMITTED" &&
    (reviewerRole === UserRole.MANAGER ||
      reviewerRole === UserRole.DIRECTOR ||
      reviewerRole === UserRole.HR_ADMIN);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(
        `/api/v1/goal-sheets/${goalSheet.id}/approve`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
      setCurrentStatus("APPROVED");
      toast.success("目標シートを承認しました");
      router.push("/team");
    } catch {
      toast.error("承認に失敗しました");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      toast.error("差し戻しコメントを入力してください");
      return;
    }
    setIsRejecting(true);
    try {
      const res = await fetch(
        `/api/v1/goal-sheets/${goalSheet.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: rejectComment }),
        }
      );
      if (!res.ok) throw new Error();
      setCurrentStatus("REJECTED");
      setShowRejectDialog(false);
      toast.success("目標シートを差し戻しました");
      router.push("/team");
    } catch {
      toast.error("差し戻しに失敗しました");
    } finally {
      setIsRejecting(false);
    }
  };

  const goalsByCategory = CATEGORIES.reduce(
    (acc, cat) => ({
      ...acc,
      [cat]: goalSheet.goals.filter((g) => g.category === cat),
    }),
    {} as Record<GoalCategory, typeof goalSheet.goals>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="text-sm bg-indigo-100 text-indigo-700 font-semibold">
              {goalSheet.user.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {goalSheet.user.name} さんの目標シート
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-gray-500">
                {goalSheet.user.jobTitle}
              </p>
              {goalSheet.user.department && (
                <>
                  <span className="text-gray-300">·</span>
                  <p className="text-sm text-gray-500">
                    {goalSheet.user.department.name}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={cn(
              "text-sm border",
              GOAL_SHEET_STATUS_COLORS[currentStatus]
            )}
          >
            {GOAL_SHEET_STATUS_LABELS[currentStatus]}
          </Badge>
          {canReview && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                差し戻す
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    承認する
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>評価期間: {goalSheet.evaluationPeriod.name}</span>
        </div>
        {goalSheet.submittedAt && (
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            <span>
              提出日:{" "}
              {format(new Date(goalSheet.submittedAt), "yyyy/MM/dd", {
                locale: ja,
              })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <User className="w-4 h-4" />
          <span>目標数: {goalSheet.goals.length}件</span>
        </div>
      </div>

      {/* Goals by category */}
      {CATEGORIES.map((cat) => {
        const goals = goalsByCategory[cat];
        if (goals.length === 0) return null;

        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <Badge
                className={cn(
                  "text-xs border",
                  GOAL_CATEGORY_COLORS[cat]
                )}
              >
                {GOAL_CATEGORY_LABELS[cat]}
              </Badge>
              <span className="text-sm text-gray-500">
                {goals.length}件
              </span>
            </div>
            <div className="space-y-3">
              {goals.map((goal, index) => {
                const progress = goal.progressRecords[0]?.progressRate ?? 0;
                return (
                  <Card
                    key={goal.id}
                    className="border border-gray-200 shadow-none"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">
                              #{index + 1}
                            </span>
                            <h3 className="font-semibold text-gray-900">
                              {goal.title}
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>ウェイト: {goal.weight}%</span>
                        </div>
                      </div>

                      {goal.description && (
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {goal.description}
                        </p>
                      )}

                      {goal.kpiDescription && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            達成指標（KPI）
                          </p>
                          <p className="text-sm text-gray-700">
                            {goal.kpiDescription}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="flex-1 h-1.5" />
                        <span className="text-xs text-gray-400 w-8 text-right">
                          {Math.round(progress)}%
                        </span>
                      </div>

                      {goal.comments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {goal.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex gap-2 p-2 bg-blue-50 rounded-lg"
                            >
                              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-indigo-700">
                                  {comment.author.name.slice(0, 1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-700">
                                  {comment.author.name}
                                </span>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              目標シートを差し戻す
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              差し戻しの理由を入力してください。このコメントは{" "}
              <strong>{goalSheet.user.name}</strong> さんに通知されます。
            </p>
            <Textarea
              placeholder="差し戻しの理由・修正してほしい点を具体的に記入してください"
              rows={4}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              className={!rejectComment.trim() ? "border-red-200" : ""}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectComment.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "差し戻す"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
