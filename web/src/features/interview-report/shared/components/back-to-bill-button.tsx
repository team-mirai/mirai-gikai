import { Undo2 } from "lucide-react";
import Link from "next/link";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";

interface BackToBillButtonProps {
  billId: string;
}

export function BackToBillButton({ billId }: BackToBillButtonProps) {
  return (
    <Link
      href={getBillDetailLink(billId)}
      className="flex items-center justify-center gap-2.5 px-6 py-3 border border-gray-800 rounded-full bg-white"
    >
      <Undo2 className="w-5 h-5 text-gray-800" />
      <span className="text-base font-bold text-gray-800">
        法案の記事に戻る
      </span>
    </Link>
  );
}
