import { TagForm } from "@/features/tags/client/components/tag-form";
import { TagList } from "@/features/tags/server/components/tag-list";
import { loadTags } from "@/features/tags/server/loaders/load-tags";

export default async function TagsPage() {
  const tags = await loadTags();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">タグ管理</h1>

      {/* タグ追加セクション */}
      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">タグを追加</h2>
        <TagForm />
      </section>

      {/* タグ一覧セクション */}
      <section className="rounded-lg border bg-white p-6">
        <TagList tags={tags} />
      </section>
    </div>
  );
}
