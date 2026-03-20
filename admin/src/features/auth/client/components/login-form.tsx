"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { type LoginFormData, loginSchema } from "../../shared/types";
import { useLogin } from "../hooks/use-login";

export function LoginForm() {
  const searchParams = useSearchParams();
  const { login, isLoading, error } = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const urlError = searchParams.get("error");

  const handleSubmit = (values: LoginFormData) => {
    login(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(error || urlError) && (
          <div className="flex items-center space-x-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>
              {error ||
                (urlError === "unauthorized"
                  ? "管理者権限がありません"
                  : "認証エラーが発生しました")}
            </span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "ログイン中..." : "ログイン"}
        </Button>
      </form>
    </Form>
  );
}
