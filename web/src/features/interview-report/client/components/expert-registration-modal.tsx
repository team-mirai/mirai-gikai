"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { registerExpert } from "../../server/actions/register-expert";
import { expertRegistrationSchema } from "../../shared/utils/expert-registration-validation";

interface ExpertRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onRegistered: () => void;
}

export function ExpertRegistrationModal({
  open,
  onOpenChange,
  sessionId,
  onRegistered,
}: ExpertRegistrationModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [email, setEmail] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const result = expertRegistrationSchema.safeParse({
      name,
      affiliation,
      email,
      privacyAgreed,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const err of result.error.issues) {
        const field = err.path[0]?.toString();
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await registerExpert(sessionId, {
        name,
        affiliation,
        email,
        privacyAgreed,
      });

      if (response.success) {
        setIsSuccess(true);
        onRegistered();
      } else {
        setErrors({ form: response.error || "登録に失敗しました" });
      }
    } catch {
      setErrors({ form: "登録に失敗しました" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setIsSuccess(false);
      setName("");
      setAffiliation("");
      setEmail("");
      setPrivacyAgreed(false);
      setErrors({});
    }, 300);
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md py-9">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-accent text-center leading-relaxed">
              登録ありがとうございました。
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium text-gray-800">
            政策検討のために、有識者としてチームみらいから連絡をする可能性があります。登録情報は公開されません。
          </p>
          <div className="mt-6">
            <Button onClick={handleClose} className="w-full">
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md py-9">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-primary-accent text-center leading-relaxed">
            有識者リストに登録する
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-800 mt-2">
          政策検討のために、有識者としてチームみらいから連絡をする可能性があります。登録情報は公開されません。
        </p>

        <div className="flex flex-col gap-3 mt-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="expert-name"
              className="text-sm font-medium text-gray-800"
            >
              お名前
            </label>
            <Input
              id="expert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-100 h-[42px]"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="expert-affiliation"
              className="text-sm font-medium text-gray-800"
            >
              ご所属・肩書
            </label>
            <Input
              id="expert-affiliation"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className="bg-gray-100 h-[42px]"
              aria-invalid={!!errors.affiliation}
            />
            {errors.affiliation && (
              <p className="text-xs text-red-500">{errors.affiliation}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="expert-email"
              className="text-sm font-medium text-gray-800"
            >
              メールアドレス
            </label>
            <Input
              id="expert-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-100 h-[42px]"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="expert-privacy"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="size-5 rounded-full accent-[#0f8472]"
            />
            <label htmlFor="expert-privacy" className="text-xs text-gray-800">
              <Link
                href="/privacy"
                target="_blank"
                className="text-primary-accent underline"
              >
                プライバシーポリシー
              </Link>
              に同意する
            </label>
          </div>
          {errors.privacyAgreed && (
            <p className="text-xs text-red-500">{errors.privacyAgreed}</p>
          )}

          {errors.form && (
            <p className="text-xs text-red-500 text-center">{errors.form}</p>
          )}
        </div>

        <div className="space-y-3 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "登録中..." : "有識者リストに登録する"}
            {!isSubmitting && <ArrowRight className="size-5" />}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full text-gray-500"
          >
            キャンセルする
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
