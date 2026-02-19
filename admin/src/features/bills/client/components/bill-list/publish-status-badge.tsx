"use client";

import { ChevronDown, Clock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updatePublishStatusAction } from "../../../server/actions/update-publish-status";
import type { BillPublishStatus } from "../../../shared/types";

interface PublishStatusBadgeProps {
  billId: string;
  publishStatus: BillPublishStatus;
}

const PUBLISH_STATUS_CONFIG: Record<
  BillPublishStatus,
  {
    label: string;
    icon: typeof Eye;
    badgeClass: string;
  }
> = {
  draft: {
    label: "下書き",
    icon: EyeOff,
    badgeClass: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
  },
  coming_soon: {
    label: "Coming Soon",
    icon: Clock,
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200",
  },
  published: {
    label: "公開中",
    icon: Eye,
    badgeClass:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  },
};

export function PublishStatusBadge({
  billId,
  publishStatus,
}: PublishStatusBadgeProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const currentConfig = PUBLISH_STATUS_CONFIG[publishStatus];
  const CurrentIcon = currentConfig.icon;

  const handleStatusChange = async (newStatus: BillPublishStatus) => {
    if (newStatus === publishStatus) {
      setOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("billId", billId);
      formData.append("newStatus", newStatus);
      await updatePublishStatusAction(formData);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border-2 hover:opacity-80 min-w-[152px] ${currentConfig.badgeClass}`}
        >
          <CurrentIcon className="h-4 w-4" />
          <span>{currentConfig.label}</span>
          <ChevronDown className="h-3 w-3 ml-0.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-2">
          <h4 className="text-xs leading-none font-medium text-gray-500">
            公開ステータス
          </h4>
          <div className="flex flex-col gap-1">
            {(
              Object.entries(PUBLISH_STATUS_CONFIG) as [
                BillPublishStatus,
                (typeof PUBLISH_STATUS_CONFIG)[BillPublishStatus],
              ][]
            ).map(([status, config]) => {
              const Icon = config.icon;
              const isSelected = status === publishStatus;
              return (
                <Button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  variant={isSelected ? "secondary" : "ghost"}
                  size="sm"
                  disabled={isSubmitting}
                  className="w-full justify-start"
                >
                  {isSubmitting && status !== publishStatus ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
