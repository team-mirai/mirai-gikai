import type { ReactNode } from "react";

export interface Opinion {
  title: string;
  content: string;
}

interface OpinionsListProps {
  opinions: Opinion[];
  title?: string;
  footer?: ReactNode;
}

export function OpinionsList({
  opinions,
  title = "💬意見の要約",
  footer,
}: OpinionsListProps) {
  if (opinions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6">
        {opinions.map((opinion, index) => (
          <div
            key={`opinion-${index}-${opinion.title.slice(0, 20)}`}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-col gap-1">
              <div className="inline-flex">
                <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  意見{index + 1}
                </span>
              </div>
              <p className="text-base font-bold text-gray-800">
                {opinion.title}
              </p>
            </div>
            <p className="text-sm text-gray-600">{opinion.content}</p>
          </div>
        ))}
        {footer}
      </div>
    </div>
  );
}
