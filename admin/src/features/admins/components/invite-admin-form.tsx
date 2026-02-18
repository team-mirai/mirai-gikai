"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteAdmin } from "../actions/invite-admin";

export function InviteAdminForm() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await inviteAdmin({ email });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("招待メールを送信しました");
        setEmail("");
      }
    } catch (error) {
      console.error("Invite admin error:", error);
      toast.error("招待メールの送信に失敗しました");
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
        <div className="flex items-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "招待中..." : "招待"}
          </Button>
        </div>
      </div>
    </form>
  );
}
