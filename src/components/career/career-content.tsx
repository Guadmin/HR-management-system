"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DevelopmentPlanStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Target,
  TrendingUp,
  Compass,
  CheckCircle2,
  Clock,
  PlayCircle,
  BookOpen,
  Loader2,
  Edit2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const PLAN_STATUS_CONFIG: Record<
  DevelopmentPlanStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PLANNED: {
    label: "予定",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    icon: <Clock className="w-3 h-3" />,
  },
  IN_PROGRESS: {
    label: "進行中",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <PlayCircle className="w-3 h-3" />,
  },
  COMPLETED: {
    label: "完了",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

interface Strength {
  id: string;
  content: string;
  evidence: string | null;
  orderIndex: number;
}

interface DevelopmentArea {
  id: string;
  content: string;
  currentLevel: number;
  targetLevel: number;
  orderIndex: number;
}

interface DevelopmentPlan {
  id: string;
  action: string;
  dueDate: Date | string | null;
  status: DevelopmentPlanStatus;
  orderIndex: number;
  owner: { id: string; name: string } | null;
}

interface CareerAspiration {
  id: string;
  shortTermGoal: string | null;
  longTermGoal: string | null;
  memberComment: string | null;
  managerComment: string | null;
}

interface CareerSheet {
  id: string;
  status: string;
  strengths: Strength[];
  developmentAreas: DevelopmentArea[];
  developmentPlans: DevelopmentPlan[];
  careerAspiration: CareerAspiration | null;
  createdBy: { id: string; name: string };
}

interface CareerContentProps {
  userId: string;
  userRole: string;
  careerSheet: CareerSheet | null;
}

function CareerAspirationEditor({
  aspiration,
  onSaved,
}: {
  aspiration: CareerAspiration | null;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [shortTerm, setShortTerm] = useState(
    aspiration?.shortTermGoal ?? ""
  );
  const [longTerm, setLongTerm] = useState(aspiration?.longTermGoal ?? "");
  const [comment, setComment] = useState(aspiration?.memberComment ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/career-design-sheets/aspiration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortTermGoal: shortTerm || null,
          longTermGoal: longTerm || null,
          memberComment: comment || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("キャリア志向を保存しました");
      setEditing(false);
      onSaved();
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="text-xs"
          >
            <Edit2 className="w-3 h-3 mr-1" />
            編集する
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-xs font-medium text-indigo-600 mb-1">
              短期目標（1〜2年）
            </p>
            <p className="text-sm text-gray-700">
              {aspiration?.shortTermGoal ?? (
                <span className="text-gray-400 italic">未記入</span>
              )}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-xs font-medium text-purple-600 mb-1">
              長期目標（3〜5年）
            </p>
            <p className="text-sm text-gray-700">
              {aspiration?.longTermGoal ?? (
                <span className="text-gray-400 italic">未記入</span>
              )}
            </p>
          </div>
        </div>

        {aspiration?.memberComment && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-1">メモ</p>
            <p className="text-sm text-gray-700">{aspiration.memberComment}</p>
          </div>
        )}

        {aspiration?.managerComment && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-xs font-medium text-green-600 mb-1">
              マネージャーコメント
            </p>
            <p className="text-sm text-gray-700">{aspiration.managerComment}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">短期目標（1〜2年）</Label>
        <Textarea
          placeholder="1〜2年後に達成したいキャリア目標を記入してください"
          rows={3}
          value={shortTerm}
          onChange={(e) => setShortTerm(e.target.value)}
          className="mt-1 resize-none"
        />
      </div>
      <div>
        <Label className="text-sm">長期目標（3〜5年）</Label>
        <Textarea
          placeholder="3〜5年後のキャリアビジョンを記入してください"
          rows={3}
          value={longTerm}
          onChange={(e) => setLongTerm(e.target.value)}
          className="mt-1 resize-none"
        />
      </div>
      <div>
        <Label className="text-sm">メモ・備考（任意）</Label>
        <Textarea
          placeholder="その他のコメント"
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1 resize-none"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
          キャンセル
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-3 h-3 mr-1" />
              保存
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function CareerContent({
  userId,
  userRole,
  careerSheet,
}: CareerContentProps) {
  const router = useRouter();

  if (!careerSheet) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              キャリアデザインシート
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              マネージャーまたはHR担当者がシートを作成します
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <BookOpen className="w-14 h-14 text-gray-200 mb-4" />
          <h2 className="text-base font-semibold text-gray-600">
            キャリアデザインシートがまだ作成されていません
          </h2>
          <p className="text-sm text-gray-400 mt-1 text-center max-w-sm">
            マネージャーとの1on1でシートを作成してもらいましょう
          </p>
        </div>
      </div>
    );
  }

  const completedPlans = careerSheet.developmentPlans.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const totalPlans = careerSheet.developmentPlans.length;
  const planProgress =
    totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            キャリアデザインシート
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            作成者: {careerSheet.createdBy.name}
          </p>
        </div>
        <Badge
          className={cn(
            "border text-xs",
            careerSheet.status === "PUBLISHED"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-50 text-gray-600 border-gray-200"
          )}
        >
          {careerSheet.status === "PUBLISHED" ? "公開中" : "ドラフト"}
        </Badge>
      </div>

      <Tabs defaultValue="strengths">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="strengths" className="text-xs">
            <Star className="w-3.5 h-3.5 mr-1" />
            強み
          </TabsTrigger>
          <TabsTrigger value="development" className="text-xs">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            開発領域
          </TabsTrigger>
          <TabsTrigger value="plans" className="text-xs">
            <Target className="w-3.5 h-3.5 mr-1" />
            育成計画
          </TabsTrigger>
          <TabsTrigger value="aspiration" className="text-xs">
            <Compass className="w-3.5 h-3.5 mr-1" />
            キャリア志向
          </TabsTrigger>
        </TabsList>

        {/* Strengths */}
        <TabsContent value="strengths">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                強み・得意領域
              </CardTitle>
            </CardHeader>
            <CardContent>
              {careerSheet.strengths.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  まだ記録されていません
                </p>
              ) : (
                <div className="space-y-3">
                  {careerSheet.strengths.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg"
                    >
                      <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-yellow-700">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {s.content}
                        </p>
                        {s.evidence && (
                          <p className="text-xs text-gray-500 mt-1">
                            根拠: {s.evidence}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development Areas */}
        <TabsContent value="development">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                開発が必要な領域
              </CardTitle>
            </CardHeader>
            <CardContent>
              {careerSheet.developmentAreas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  まだ記録されていません
                </p>
              ) : (
                <div className="space-y-4">
                  {careerSheet.developmentAreas.map((area) => {
                    const progress = Math.round(
                      ((area.currentLevel - 1) / (area.targetLevel - 1)) * 100
                    );
                    return (
                      <div key={area.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {area.content}
                          </p>
                          <span className="text-xs text-gray-500">
                            Lv.{area.currentLevel} → Lv.{area.targetLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="flex-1 h-2" />
                          <span className="text-xs text-gray-500 w-8 text-right">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development Plans */}
        <TabsContent value="plans">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  育成アクションプラン
                </CardTitle>
                {totalPlans > 0 && (
                  <div className="flex items-center gap-2">
                    <Progress value={planProgress} className="w-20 h-1.5" />
                    <span className="text-xs text-gray-500">
                      {completedPlans}/{totalPlans}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {careerSheet.developmentPlans.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  まだ記録されていません
                </p>
              ) : (
                <div className="space-y-3">
                  {careerSheet.developmentPlans.map((plan) => {
                    const config = PLAN_STATUS_CONFIG[plan.status];
                    return (
                      <div
                        key={plan.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg",
                          plan.status === "COMPLETED"
                            ? "bg-green-50"
                            : "bg-gray-50"
                        )}
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
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              plan.status === "COMPLETED"
                                ? "text-gray-400 line-through"
                                : "text-gray-900"
                            )}
                          >
                            {plan.action}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {plan.dueDate && (
                              <span className="text-xs text-gray-400">
                                期限:{" "}
                                {format(new Date(plan.dueDate), "M月d日", {
                                  locale: ja,
                                })}
                              </span>
                            )}
                            {plan.owner && (
                              <span className="text-xs text-gray-400">
                                担当: {plan.owner.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Career Aspiration */}
        <TabsContent value="aspiration">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                キャリア志向・目標
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CareerAspirationEditor
                aspiration={careerSheet.careerAspiration}
                onSaved={() => router.refresh()}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
