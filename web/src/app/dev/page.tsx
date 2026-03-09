import Link from "next/link";
import { previewRegistry } from "./_lib/registry";

export default function DevIndexPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-mirai-text mb-2">
        Component Gallery
      </h1>
      <p className="text-mirai-text-secondary mb-8">
        UIコンポーネントとfeatureコンポーネントを単体でプレビューできます。
      </p>

      <div className="grid gap-8">
        {previewRegistry.map((group) => (
          <section key={group.name}>
            <h2 className="text-xl font-bold text-mirai-text mb-4">
              {group.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="block p-4 border border-mirai-border rounded-lg hover:bg-mirai-surface transition-colors"
                >
                  <h3 className="font-medium text-mirai-text">{item.label}</h3>
                  <p className="text-sm text-mirai-text-secondary mt-1">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
