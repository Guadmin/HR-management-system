"use client";

import { useState } from "react";
import { GoalCategory } from "@prisma/client";
import { GOAL_CATEGORY_LABELS, GOAL_CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";

interface GoalCardProps {
  goal: {
    id: string;
    category: GoalCategory;
    title: string;
    description: string | null;
    kpiDescription: string | null;
    weight: number;
    progressRecords: { progressRate: number }[];
    comments: {
      id: string;
      content: string;
      author: { id: string; name: string; image: string | null };
    }[];
  };
  index: number;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalCard({
  goal,
  index,
  canEdit,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const latestProgress = goal.progressRecords[0]?.progressRate ?? 0;

  return (
    <>
      <Card className="border border-gray-200 shadow-none hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {canEdit && (
              <div className="mt-1 cursor-grab text-gray-300 hover:text-gray-500">
                <GripVertical className="w-4 h-4" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-bold text-gray-400 flex-shrink-0">
                    #{index + 1}
                  </span>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 leading-snug">
                    {goal.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-500">
                    {goal.weight}%
                  </span>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                          <Pencil className="w-4 h-4 mr-2" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 flex items-center gap-2">
                <Progress value={latestProgress} className="flex-1 h-1.5" />
                <span className="text-xs text-gray-400 w-8 text-right">
                  {Math.round(latestProgress)}%
                </span>
              </div>

              {/* Expandable content */}
              {(goal.description || goal.kpiDescription) && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {expanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  {expanded ? "折りたたむ" : "詳細を見る"}
                </button>
              )}

              {expanded && (
                <div className="mt-3 space-y-3 text-sm">
                  {goal.description && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        詳細説明
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {goal.description}
                      </p>
                    </div>
                  )}
                  {goal.kpiDescription && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        達成指標（KPI）
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {goal.kpiDescription}
                      </p>
                    </div>
                  )}

                  {/* Latest comments */}
                  {goal.comments.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        コメント
                      </p>
                      <div className="space-y-2">
                        {goal.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-indigo-700">
                                {comment.author.name.slice(0, 1)}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-700">
                                {comment.author.name}
                              </span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>目標を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{goal.title}」を削除します。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
