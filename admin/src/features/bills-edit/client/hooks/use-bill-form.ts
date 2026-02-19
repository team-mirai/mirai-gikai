import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { isNextRedirectError } from "@/lib/utils/redirect";

export function useBillForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    submitFn: () => Promise<void>,
    errorMessage = "処理中にエラーが発生しました"
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await submitFn();
      toast.success("保存しました");
      router.refresh();
    } catch (err) {
      // Next.jsのリダイレクトエラーはそのまま投げる
      if (isNextRedirectError(err)) {
        throw err;
      }
      setError(getErrorMessage(err, errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/bills");
  };

  return {
    isSubmitting,
    error,
    handleSubmit,
    handleCancel,
  };
}
