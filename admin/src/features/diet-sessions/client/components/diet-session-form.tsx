"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDietSession } from "../../server/actions/create-diet-session";

export function DietSessionForm() {
  const nameId = useId();
  const slugId = useId();
  const shugiinUrlId = useId();
  const startDateId = useId();
  const endDateId = useId();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shugiinUrl, setShugiinUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("会議名を入力してください");
      return;
    }

    if (!startDate) {
      toast.error("開始日を入力してください");
      return;
    }

    if (!endDate) {
      toast.error("終了日を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createDietSession({
        name,
        slug: slug || null,
        shugiin_url: shugiinUrl || null,
        start_date: startDate,
        end_date: endDate,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("市議会の会期を作成しました");
        setName("");
        setSlug("");
        setShugiinUrl("");
        setStartDate("");
        setEndDate("");
      }
    } catch (error) {
      console.error("Create diet session error:", error);
      toast.error("市議会の会期作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor={nameId}>会議名</Label>
          <Input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 令和8年2月定例会"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={slugId}>スラッグ（URL用）</Label>
          <Input
            id={slugId}
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="例: r8-2-teireikai"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={startDateId}>開始日</Label>
          <Input
            id={startDateId}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={endDateId}>終了日</Label>
          <Input
            id={endDateId}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={shugiinUrlId}>草津市議会URL</Label>
        <Input
          id={shugiinUrlId}
          type="url"
          value={shugiinUrl}
          onChange={(e) => setShugiinUrl(e.target.value)}
          placeholder="https://www.city.kusatsu.shiga.jp/..."
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "追加中..." : "追加"}
        </Button>
      </div>
    </form>
  );
}
