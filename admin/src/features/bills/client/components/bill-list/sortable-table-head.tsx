"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import type { BillSortField, SortOrder } from "../../../shared/types";

interface SortableTableHeadProps {
  field: BillSortField;
  currentField: BillSortField;
  currentOrder: SortOrder;
  children: ReactNode;
}

export function SortableTableHead({
  field,
  currentField,
  currentOrder,
  children,
}: SortableTableHeadProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = field === currentField;

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive) {
      params.set("order", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", field);
      params.set("order", "desc");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const SortIcon = isActive
    ? currentOrder === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        {children}
        <SortIcon className="ml-1 h-4 w-4" />
      </Button>
    </TableHead>
  );
}
