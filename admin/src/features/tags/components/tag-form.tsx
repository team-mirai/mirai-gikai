"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTag } from "../actions/create-tag";

export function TagForm() {
  const inputId = useId();
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!label.trim()) {
      toast.error("タグ名を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createTag({ label });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("タグを作成しました");
        setLabel(""); // フォームをクリア
      }
    } catch (error) {
      console.error("Create tag error:", error);
      toast.error("タグの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor={inputId}>タグ名</Label>
          <Input
            id={inputId}
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="タグ名を入力"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "追加中..." : "追加"}
          </Button>
        </div>
      </div>
    </form>
  );
}
