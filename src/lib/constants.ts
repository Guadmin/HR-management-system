import { UserRole, GoalCategory, AchievementScore, PhaseType, GoalSheetStatus } from "@prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  MEMBER: "一般社員",
  MANAGER: "マネージャー",
  DIRECTOR: "部門長",
  HR_ADMIN: "人事管理者",
};

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  P_GOAL: "P目標",
  V_GOAL_1: "V目標①",
  V_GOAL_2: "V目標②",
};

export const GOAL_CATEGORY_DESCRIPTIONS: Record<GoalCategory, string> = {
  P_GOAL: "組織の目標達成・事業の成長に資する今期ミッション",
  V_GOAL_1: "P目標を達成するための手段・段取り・工夫",
  V_GOAL_2: "自身の能力開発や担当事業・組織の課題解決への取り組み",
};

export const ACHIEVEMENT_SCORE_LABELS: Record<AchievementScore, string> = {
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

export const ACHIEVEMENT_SCORE_DESCRIPTIONS: Record<AchievementScore, string> = {
  S: "期待を大幅に超えた",
  A: "期待を超えた",
  B: "期待通り",
  C: "期待をやや下回った",
  D: "期待を大幅に下回った",
};

export const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  GOAL_SETTING: "目標設定",
  MID_REVIEW: "中間レビュー",
  GOAL_REVISION: "目標修正",
  FINAL_EVALUATION: "期末評価",
};

export const GOAL_SHEET_STATUS_LABELS: Record<GoalSheetStatus, string> = {
  DRAFT: "下書き",
  SUBMITTED: "提出済み",
  APPROVED: "承認済み",
  REJECTED: "差し戻し",
};

export const SCORE_COLORS: Record<AchievementScore, string> = {
  S: "text-yellow-600 bg-yellow-50 border-yellow-200",
  A: "text-indigo-600 bg-indigo-50 border-indigo-200",
  B: "text-gray-600 bg-gray-50 border-gray-200",
  C: "text-orange-600 bg-orange-50 border-orange-200",
  D: "text-red-600 bg-red-50 border-red-200",
};

export const GOAL_CATEGORY_COLORS: Record<GoalCategory, string> = {
  P_GOAL: "text-indigo-700 bg-indigo-50 border-indigo-200",
  V_GOAL_1: "text-emerald-700 bg-emerald-50 border-emerald-200",
  V_GOAL_2: "text-violet-700 bg-violet-50 border-violet-200",
};

export const GOAL_SHEET_STATUS_COLORS: Record<GoalSheetStatus, string> = {
  DRAFT: "text-gray-600 bg-gray-50 border-gray-200",
  SUBMITTED: "text-blue-600 bg-blue-50 border-blue-200",
  APPROVED: "text-green-600 bg-green-50 border-green-200",
  REJECTED: "text-red-600 bg-red-50 border-red-200",
};
