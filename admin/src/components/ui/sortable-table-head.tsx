"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import type { SortOrder } from "@/lib/sort";
import { TableHead } from "./table";

interface SortableTableHeadProps<TField extends string> {
  field: TField;
  currentField: TField;
  currentOrder: SortOrder;
  className?: string;
  children: ReactNode;
}

export function SortableTableHead<TField extends string>({
  field,
  currentField,
  currentOrder,
  className,
  children,
}: SortableTableHeadProps<TField>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = field === currentField;
  const nextOrder = isActive && currentOrder === "desc" ? "asc" : "desc";

  const params = new URLSearchParams(searchParams.toString());
  params.set("sort", field);
  params.set("order", nextOrder);
  // ソート変更時はページを1に戻す
  if (params.has("page")) {
    params.set("page", "1");
  }

  return (
    <TableHead className={className}>
      <Link
        href={`${pathname}?${params.toString()}` as Route}
        className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
      >
        {children}
        {isActive ? (
          currentOrder === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
        )}
      </Link>
    </TableHead>
  );
}
