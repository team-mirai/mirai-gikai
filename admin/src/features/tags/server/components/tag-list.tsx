import { TagItem } from "../../client/components/tag-item";
import type { TagWithBillCount } from "../../shared/types";

type TagListProps = {
  tags: TagWithBillCount[];
};

export function TagList({ tags }: TagListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">タグ一覧 ({tags.length}件)</h2>

      {tags.length === 0 ? (
        <p className="text-gray-500">タグがありません</p>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <TagItem key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}
