"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EvaluationPeriodStatus,
  PhaseType,
} from "@prisma/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const PERIOD_STATUS_CONFIG: Record<
  EvaluationPeriodStatus,
  { label: string; color: string }
> = {
  UPCOMING: {
    label: "予定",
    color: "bg-gray-50 text-gray-600 border-gray-200",
  },
  ACTIVE: {
    label: "進行中",
    color: "bg-green-50 text-green-700 border-green-200",
  },
  COMPLETED: {
    label: "完了",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ARCHIVED: {
    label: "アーカイブ",
    color: "bg-gray-50 text-gray-400 border-gray-200",
  },
};

const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  GOAL_SETTING: "目標設定",
  MID_REVIEW: "中間レビュー",
  GOAL_REVISION: "目標修正",
  FINAL_EVALUATION: "期末評価",
};

interface Phase {
  id: string;
  phaseType: PhaseType;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
}

interface Period {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  status: EvaluationPeriodStatus;
  phases: Phase[];
  _count: { goalSheets: number };
}

interface AdminPeriodsContentProps {
  userId: string;
  periods: Period[];
}

function CreatePeriodDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !startDate || !endDate) {
      toast.error("すべての項目を入力してください");
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("終了日は開始日より後に設定してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/evaluation-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate }),
      });
      if (!res.ok) throw new Error();
      toast.success("評価期間を作成しました");
      onOpenChange(false);
      setName("");
      setStartDate("");
      setEndDate("");
      onCreated();
    } catch {
      toast.error("作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">評価期間を新規作成</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">期間名 *</Label>
            <Input
              placeholder="例: 2025年度上期"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">開始日 *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">終了日 *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
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
            onClick={handleCreate}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "作成する"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PeriodCard({ period, onUpdated }: { period: Period; onUpdated: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPhase, setUpdatingPhase] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: EvaluationPeriodStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/evaluation-periods/${period.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("ステータスを更新しました");
      onUpdated();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePhaseActivate = async (phaseId: string, activate: boolean) => {
    setUpdatingPhase(phaseId);
    try {
      const res = await fetch(
        `/api/v1/evaluation-periods/${period.id}/phases/${phaseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: activate }),
        }
      );
      if (!res.ok) throw new Error();
      toast.success(activate ? "フェーズを開始しました" : "フェーズを終了しました");
      onUpdated();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setUpdatingPhase(null);
    }
  };

  const statusConfig = PERIOD_STATUS_CONFIG[period.status];

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-gray-400 hover:text-gray-600 mt-0.5"
            >
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {period.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {format(new Date(period.startDate), "yyyy/MM/dd", {
                  locale: ja,
                })}{" "}
                〜{" "}
                {format(new Date(period.endDate), "yyyy/MM/dd", {
                  locale: ja,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              <span>{period._count.goalSheets}名</span>
            </div>
            <Badge className={cn("border text-xs", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            <Select
              value={period.status}
              onValueChange={(v) =>
                handleStatusChange(v as EvaluationPeriodStatus)
              }
              disabled={updatingStatus}
            >
              <SelectTrigger className="h-7 text-xs w-28">
                <Settings className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPCOMING">予定</SelectItem>
                <SelectItem value="ACTIVE">進行中</SelectItem>
                <SelectItem value="COMPLETED">完了</SelectItem>
                <SelectItem value="ARCHIVED">アーカイブ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Phases */}
        {expanded && (
          <div className="mt-4 ml-7 space-y-2">
            <p className="text-xs font-medium text-gray-500 mb-2">
              フェーズ管理
            </p>
            {period.phases.map((phase) => (
              <div
                key={phase.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  phase.isActive
                    ? "bg-indigo-50 border-indigo-200"
                    : "bg-gray-50 border-gray-100"
                )}
              >
                <div className="flex items-center gap-2">
                  {phase.isActive ? (
                    <PlayCircle className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {PHASE_TYPE_LABELS[phase.phaseType]}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(phase.startDate), "M/d", {
                        locale: ja,
                      })}{" "}
                      〜{" "}
                      {format(new Date(phase.endDate), "M/d", { locale: ja })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={phase.isActive ? "outline" : "default"}
                  onClick={() =>
                    handlePhaseActivate(phase.id, !phase.isActive)
                  }
                  disabled={updatingPhase === phase.id}
                  className={cn(
                    "h-7 text-xs",
                    !phase.isActive &&
                      "bg-indigo-600 hover:bg-indigo-700 text-white"
                  )}
                >
                  {updatingPhase === phase.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : phase.isActive ? (
                    "終了"
                  ) : (
                    "開始"
                  )}
                </Button>
              </div>
            ))}
            {period.phases.length === 0 && (
              <p className="text-xs text-gray-400 italic">
                フェーズが設定されていません
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminPeriodsContent({
  userId,
  periods,
}: AdminPeriodsContentProps) {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const activePeriod = periods.find((p) => p.status === "ACTIVE");
  const upcomingCount = periods.filter((p) => p.status === "UPCOMING").length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            評価期間管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            評価期間とフェーズの設定・管理
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新規作成
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <PlayCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">進行中</p>
                <p className="text-lg font-bold text-gray-900">
                  {activePeriod ? 1 : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">予定</p>
                <p className="text-lg font-bold text-gray-900">
                  {upcomingCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">総期間数</p>
                <p className="text-lg font-bold text-gray-900">
                  {periods.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Periods list */}
      <div className="space-y-3">
        {periods.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">評価期間がありません</p>
              <Button
                className="mt-3 bg-indigo-600 hover:bg-indigo-700"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              >
                最初の評価期間を作成する
              </Button>
            </CardContent>
          </Card>
        ) : (
          periods.map((period) => (
            <PeriodCard
              key={period.id}
              period={period}
              onUpdated={() => router.refresh()}
            />
          ))
        )}
      </div>

      <CreatePeriodDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
