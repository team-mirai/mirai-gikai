"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import rehypeSanitize from "rehype-sanitize";
import { Streamdown } from "streamdown";
import { harden } from "rehype-harden";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, rehypePlugins, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      rehypePlugins={[
        rehypeSanitize,
        [
          harden,
          {
            defaultOrigin:
              typeof window !== "undefined"
                ? window.location.origin
                : undefined,
          },
        ],
        ...(rehypePlugins ?? []),
      ]}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
