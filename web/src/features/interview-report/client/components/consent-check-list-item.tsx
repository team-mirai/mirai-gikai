"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/lib/routes";

export function ConsentCheckListItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Image
        src="/icons/check-circle.svg"
        alt=""
        width={20}
        height={20}
        className="flex-shrink-0 mt-1"
      />
      <p className="text-sm font-medium leading-relaxed">{children}</p>
    </div>
  );
}

/**
 * 公開同意にオープンデータとしての第三者提供（二次利用）への同意が
 * 含まれることを知らせる告知。公開同意を求めるモーダルで共通利用する。
 */
export function OpenDataNoticeItem() {
  return (
    <ConsentCheckListItem>
      公開を許可した内容は、「
      <Link
        href={routes.interviewDataTerms()}
        target="_blank"
        className="text-primary-accent underline"
      >
        みらい議会AIインタビューデータ利用規約
      </Link>
      」に基づき、第三者にオープンデータとして提供されることがあります。公開をやめた場合、以後の提供は停止されますが、既に取得されたデータの利用停止までは保証できません。
    </ConsentCheckListItem>
  );
}
