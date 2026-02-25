"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GoalCategory } from "@prisma/client";
import { GOAL_CATEGORY_LABELS, GOAL_CATEGORY_DESCRIPTIONS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const goalSchema = z.object({
  category: z.nativeEnum(GoalCategory),
  title: z.string().min(1, "タイトルを入力してください").max(200, "200文字以内で入力してください"),
  description: z.string().optional(),
  kpiDescription: z.string().optional(),
  weight: z.number().min(0).max(100),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormDialogProps {
  open: boolean;
  onClose: () => void;
  goalSheetId: string;
  defaultCategory: GoalCategory;
  editingGoal?: {
    id: string;
    category: GoalCategory;
    title: string;
    description: string | null;
    kpiDescription: string | null;
    weight: number;
  } | null;
  onSaved: (goal: {
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
    }[];
  }) => void;
}

export function GoalFormDialog({
  open,
  onClose,
  goalSheetId,
  defaultCategory,
  editingGoal,
  onSaved,
}: GoalFormDialogProps) {
  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      category: defaultCategory,
      title: "",
      description: "",
      kpiDescription: "",
      weight: 0,
    },
  });

  useEffect(() => {
    if (editingGoal) {
      form.reset({
        category: editingGoal.category,
        title: editingGoal.title,
        description: editingGoal.description ?? "",
        kpiDescription: editingGoal.kpiDescription ?? "",
        weight: editingGoal.weight,
      });
    } else {
      form.reset({
        category: defaultCategory,
        title: "",
        description: "",
        kpiDescription: "",
        weight: 0,
      });
    }
  }, [editingGoal, defaultCategory, form]);

  const onSubmit = async (data: GoalFormData) => {
    try {
      const url = editingGoal
        ? `/api/v1/goals/${editingGoal.id}`
        : "/api/v1/goals";
      const method = editingGoal ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          goalSheetId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "エラーが発生しました");
      }

      const saved = await res.json();
      onSaved({
        ...saved,
        progressRecords: saved.progressRecords ?? [],
        comments: saved.comments ?? [],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "保存に失敗しました"
      );
    }
  };

  const watchWeight = form.watch("weight");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingGoal ? "目標を編集" : "目標を追加"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>目標カテゴリ</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(GoalCategory).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          <div>
                            <span className="font-medium">
                              {GOAL_CATEGORY_LABELS[cat]}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {GOAL_CATEGORY_DESCRIPTIONS[cat]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    タイトル <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="目標のタイトルを入力"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>詳細説明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="目標の詳細や背景を記入"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* KPI */}
            <FormField
              control={form.control}
              name="kpiDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>達成指標（KPI）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="例：〇〇の数値を XX% 改善する、△△件の成約を獲得する"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    定量・定性いずれの指標も記載できます
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weight */}
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>ウェイト</FormLabel>
                    <span className="text-sm font-semibold text-indigo-600">
                      {watchWeight}%
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={([v]) => field.onChange(v)}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                  </FormControl>
                  <FormDescription>
                    カテゴリ内の目標ウェイトの合計が100%になるように設定してください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingGoal ? (
                  "更新する"
                ) : (
                  "追加する"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
