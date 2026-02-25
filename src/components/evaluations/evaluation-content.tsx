"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRole, GoalCategory, AchievementScore } from "@prisma/client";
import {
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_COLORS,
  ACHIEVEMENT_SCORE_LABELS,
  ACHIEVEMENT_SCORE_DESCRIPTIONS,
  SCORE_COLORS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ClipboardList,
  Send,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface EvaluationContentProps {
  userId: string;
  userRole: string;
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
    goals: {
      id: string;
      category: GoalCategory;
      title: string;
      description: string | null;
      weight: number;
    }[];
    evaluations: {
      id: string;
      type: string;
      status: string;
      evaluator: { id: string; name: string };
      goalEvaluations: {
        goalId: string;
        score: AchievementScore;
        comment: string | null;
      }[];
      overallEvaluation: {
        overallScore: AchievementScore;
        overallComment: string | null;
        strengthComment: string | null;
        issueComment: string | null;
      } | null;
    }[];
  } | null;
}

const SCORES: AchievementScore[] = ["S", "A", "B", "C", "D"];

export function EvaluationContent({
  userId,
  userRole,
  activePeriod,
  goalSheet,
}: EvaluationContentProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [goalScores, setGoalScores] = useState<Record<string, AchievementScore>>({});
  const [goalComments, setGoalComments] = useState<Record<string, string>>({});
  const [overallScore, setOverallScore] = useState<AchievementScore>("B");
  const [overallComment, setOverallComment] = useState("");
  const [strengthComment, setStrengthComment] = useState("");
  const [issueComment, setIssueComment] = useState("");

  const selfEval = goalSheet?.evaluations.find((e) => e.type === "SELF");
  const primaryEval = goalSheet?.evaluations.find((e) => e.type === "PRIMARY");
  const isFinalEvalPhase = activePeriod?.phases.some(
    (p) => p.phaseType === "FINAL_EVALUATION" && p.isActive
  );
  const isApproved = goalSheet?.status === "APPROVED";

  const canSelfEvaluate =
    isApproved && isFinalEvalPhase && !selfEval;

  const handleSubmitSelfEval = async () => {
    if (!goalSheet) return;

    const ungradedGoals = goalSheet.goals.filter((g) => !goalScores[g.id]);
    if (ungradedGoals.length > 0) {
      toast.error("すべての目標に達成度スコアを入力してください");
      return;
    }
    if (!overallComment.trim()) {
      toast.error("総合評価コメントを入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalSheetId: goalSheet.id,
          type: "SELF",
          goalEvaluations: goalSheet.goals.map((g) => ({
            goalId: g.id,
            score: goalScores[g.id],
            comment: goalComments[g.id] || "",
          })),
          overallScore,
          overallComment,
          strengthComment,
          issueComment,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("自己評価を提出しました");
      router.refresh();
    } catch {
      toast.error("提出に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!goalSheet || goalSheet.status !== "APPROVED") {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          期末評価
        </h1>
        <div className="flex flex-col items-center justify-center py-16">
          <Lock className="w-12 h-12 text-gray-300 mb-4" />
          <h2 className="text-base font-semibold text-gray-600">
            目標シートが承認されていません
          </h2>
          <p className="text-sm text-gray-400 mt-1 text-center">
            目標シートがマネージャーに承認されてから評価を入力できます
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/goals">目標シートを確認する</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            期末評価
          </h1>
          <p className="text-sm text-gray-500 mt-1">{activePeriod.name}</p>
        </div>
        {selfEval && (
          <Badge className="bg-green-50 text-green-700 border-green-200 text-sm">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            自己評価提出済み
          </Badge>
        )}
      </div>

      {/* Self Evaluation Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            自己評価
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {selfEval ? (
            // Show submitted self eval
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                自己評価は提出済みです。マネージャーからの評価をお待ちください。
              </p>
              {goalSheet.goals.map((goal) => {
                const ge = selfEval.goalEvaluations.find(
                  (e) => e.goalId === goal.id
                );
                return (
                  <div
                    key={goal.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Badge
                      className={cn(
                        "border font-bold w-8 h-8 flex items-center justify-center text-sm flex-shrink-0",
                        ge ? SCORE_COLORS[ge.score] : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {ge?.score ?? "-"}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {goal.title}
                      </p>
                      {ge?.comment && (
                        <p className="text-xs text-gray-500 mt-1">{ge.comment}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {selfEval.overallEvaluation && (
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">総合評価:</span>
                    <Badge
                      className={cn(
                        "border font-bold",
                        SCORE_COLORS[selfEval.overallEvaluation.overallScore]
                      )}
                    >
                      {selfEval.overallEvaluation.overallScore}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">
                    {selfEval.overallEvaluation.overallComment}
                  </p>
                </div>
              )}
            </div>
          ) : canSelfEvaluate ? (
            // Evaluation input form
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                各目標に対する達成度を自己申告してください。
              </p>

              {/* Goal evaluations */}
              {goalSheet.goals.map((goal) => (
                <div key={goal.id} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Badge
                      className={cn(
                        "text-xs border flex-shrink-0",
                        GOAL_CATEGORY_COLORS[goal.category]
                      )}
                    >
                      {GOAL_CATEGORY_LABELS[goal.category]}
                    </Badge>
                    <p className="text-sm font-medium text-gray-900">
                      {goal.title}
                    </p>
                  </div>

                  {/* Score selector */}
                  <div className="flex gap-2">
                    {SCORES.map((score) => (
                      <button
                        key={score}
                        onClick={() =>
                          setGoalScores((prev) => ({
                            ...prev,
                            [goal.id]: score,
                          }))
                        }
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-sm font-bold transition-all",
                          goalScores[goal.id] === score
                            ? SCORE_COLORS[score] + " scale-105"
                            : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                        )}
                        title={ACHIEVEMENT_SCORE_DESCRIPTIONS[score]}
                      >
                        {score}
                      </button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="振り返りコメント（実績・学び・課題）"
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
                </div>
              ))}

              {/* Overall evaluation */}
              <div className="pt-4 border-t space-y-4">
                <h3 className="font-semibold text-gray-900">総合評価</h3>

                <div>
                  <Label className="text-sm">総合スコア</Label>
                  <div className="flex gap-2 mt-2">
                    {SCORES.map((score) => (
                      <button
                        key={score}
                        onClick={() => setOverallScore(score)}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-sm font-bold transition-all",
                          overallScore === score
                            ? SCORE_COLORS[score] + " scale-105"
                            : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                        )}
                        title={ACHIEVEMENT_SCORE_DESCRIPTIONS[score]}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm">
                    総合コメント <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="今期の振り返りを総合的に記入してください"
                    rows={3}
                    value={overallComment}
                    onChange={(e) => setOverallComment(e.target.value)}
                    className="mt-2 resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm">強み・良かった点</Label>
                  <Textarea
                    placeholder="今期発揮できた強みや成果を記入してください"
                    rows={2}
                    value={strengthComment}
                    onChange={(e) => setStrengthComment(e.target.value)}
                    className="mt-2 resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm">課題・改善したい点</Label>
                  <Textarea
                    placeholder="次期に向けた課題や改善点を記入してください"
                    rows={2}
                    value={issueComment}
                    onChange={(e) => setIssueComment(e.target.value)}
                    className="mt-2 resize-none"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmitSelfEval}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    自己評価を提出する
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <Lock className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">
                期末評価フェーズが開始されたら入力できます
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manager evaluation (view only) */}
      {primaryEval && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              一次評価（マネージャー）
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                {primaryEval.evaluator.name}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalSheet.goals.map((goal) => {
              const ge = primaryEval.goalEvaluations.find(
                (e) => e.goalId === goal.id
              );
              const selfGe = selfEval?.goalEvaluations.find(
                (e) => e.goalId === goal.id
              );
              return (
                <div
                  key={goal.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex gap-1">
                    {selfGe && (
                      <Badge
                        className={cn(
                          "border font-bold w-7 h-7 flex items-center justify-center text-xs",
                          SCORE_COLORS[selfGe.score]
                        )}
                        title="自己評価"
                      >
                        {selfGe.score}
                      </Badge>
                    )}
                    {ge && (
                      <Badge
                        className={cn(
                          "border font-bold w-7 h-7 flex items-center justify-center text-xs",
                          SCORE_COLORS[ge.score]
                        )}
                        title="一次評価"
                      >
                        {ge.score}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {goal.title}
                    </p>
                    {ge?.comment && (
                      <p className="text-xs text-gray-500 mt-1">{ge.comment}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {primaryEval.overallEvaluation && (
              <div className="p-4 bg-indigo-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">総合評価:</span>
                  <Badge
                    className={cn(
                      "border font-bold",
                      SCORE_COLORS[primaryEval.overallEvaluation.overallScore]
                    )}
                  >
                    {primaryEval.overallEvaluation.overallScore}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">
                  {primaryEval.overallEvaluation.overallComment}
                </p>
                {primaryEval.overallEvaluation.strengthComment && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">強み:</p>
                    <p className="text-sm text-gray-700">
                      {primaryEval.overallEvaluation.strengthComment}
                    </p>
                  </div>
                )}
                {primaryEval.overallEvaluation.issueComment && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">課題:</p>
                    <p className="text-sm text-gray-700">
                      {primaryEval.overallEvaluation.issueComment}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
