import { formatRoleDescriptionLines } from "../utils/format-utils";

interface IntervieweeInfoProps {
  roleDescription?: string | null;
  headingLevel?: "h2" | "h3";
}

export function IntervieweeInfo({
  roleDescription,
  headingLevel = "h2",
}: IntervieweeInfoProps) {
  if (!roleDescription) {
    return null;
  }

  const Heading = headingLevel;
  const lines = formatRoleDescriptionLines(roleDescription);

  return (
    <div className="flex flex-col gap-4">
      <Heading className="text-xl font-bold text-gray-800">
        👫インタビューを受けた人
      </Heading>
      <div className="bg-white rounded-2xl p-6">
        <div className="text-sm text-gray-800 whitespace-pre-wrap font-medium">
          {lines.map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: index以外のユニークなキーはない
            <p key={`${index}-${line.slice(0, 20)}`}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
