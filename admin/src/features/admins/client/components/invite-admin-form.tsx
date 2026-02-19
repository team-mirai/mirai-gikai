"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdmin } from "../../server/actions/invite-admin";

export function InviteAdminForm() {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("パスワードは6文字以上で入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createAdmin({ email, password });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("管理者を作成しました");
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Create admin error:", error);
      toast.error("管理者の作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor={emailId}>メールアドレス</Label>
          <Input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor={passwordId}>パスワード</Label>
          <Input
            id={passwordId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "作成"}
          </Button>
        </div>
      </div>
    </form>
  );
}
