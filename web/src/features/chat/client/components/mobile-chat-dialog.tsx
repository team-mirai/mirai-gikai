"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export const CHAT_PANEL_RESPONSIVE_CLASSES =
  "md:bottom-4 md:right-4 md:left-auto md:w-[450px] md:rounded-2xl";

interface MobileChatDialogProps {
  children: ReactNode;
  disableAutoFocus?: boolean;
  initialFocusRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  style?: CSSProperties;
}

/**
 * モバイル表示のチャットを、背景から隔離されたフォーカス管理付きダイアログとして表示する。
 */
export function MobileChatDialog({
  children,
  disableAutoFocus = false,
  initialFocusRef,
  isOpen,
  onClose,
  returnFocusRef,
  style,
}: MobileChatDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          aria-modal="true"
          className={`fixed inset-x-0 bottom-0 z-50 h-[80vh] bg-white shadow-md rounded-t-2xl flex flex-col outline-none ${CHAT_PANEL_RESPONSIVE_CLASSES}`}
          style={style}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            if (disableAutoFocus) {
              closeButtonRef.current?.focus();
              return;
            }
            initialFocusRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            国会や法案についてAIに質問する
          </DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              size="icon"
              className="self-end m-2"
              aria-label="AIチャットを閉じる"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogPrimitive.Close>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
