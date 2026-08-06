"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OpinionCard } from "../../shared/components/opinion-card";
import type { ViewerBigTopic, ViewerMediumTopic } from "../../shared/types";

/**
 * 大トピック → 中トピック → 意見 の階層ツリー。
 *
 * 大トピックは1つずつ開く。数十件の中トピックが一度に開くと、畳んで俯瞰する
 * という目的が崩れるため。
 */
export function TopicTree({ bigTopics }: { bigTopics: ViewerBigTopic[] }) {
  const [openBigTopicId, setOpenBigTopicId] = useState<string | null>(
    bigTopics[0]?.id ?? null
  );

  if (bigTopics.length === 0) {
    return (
      <p className="rounded border bg-white p-6 text-sm text-gray-500">
        この絞り込みに該当する意見がありません。
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {bigTopics.map((bigTopic) => (
        <li key={bigTopic.id} className="rounded border bg-white">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setOpenBigTopicId((prev) =>
                prev === bigTopic.id ? null : bigTopic.id
              )
            }
            aria-expanded={openBigTopicId === bigTopic.id}
            className="flex h-auto w-full items-start justify-start gap-2 whitespace-normal p-4 text-left"
          >
            {openBigTopicId === bigTopic.id ? (
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{bigTopic.title}</span>
                <span className="shrink-0 text-sm text-gray-500">
                  {bigTopic.opinionCount}件 / 中トピック
                  {bigTopic.mediumTopics.length}
                </span>
              </span>
              <span className="mt-1 block whitespace-pre-wrap text-sm text-gray-600">
                {bigTopic.description}
              </span>
            </span>
          </Button>

          {openBigTopicId === bigTopic.id && (
            <ul className="flex flex-col gap-2 border-t bg-gray-50 p-4">
              {bigTopic.mediumTopics.map((mediumTopic) => (
                <MediumTopicRow
                  key={mediumTopic.id}
                  mediumTopic={mediumTopic}
                />
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function MediumTopicRow({ mediumTopic }: { mediumTopic: ViewerMediumTopic }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded border bg-white">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex h-auto w-full items-start justify-start gap-2 whitespace-normal p-3 text-left"
      >
        {open ? (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium">{mediumTopic.title}</span>
            <span className="shrink-0 text-xs text-gray-500">
              {mediumTopic.opinions.length}件
            </span>
          </span>
          <span className="mt-1 block whitespace-pre-wrap text-xs text-gray-600">
            {mediumTopic.description}
          </span>
        </span>
      </Button>

      {open && (
        <ul className="flex flex-col gap-2 border-t p-3">
          {mediumTopic.opinions.map((opinion) => (
            <OpinionCard key={opinion.id} opinion={opinion} />
          ))}
        </ul>
      )}
    </li>
  );
}
