export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only z-50 rounded-md bg-mirai-text px-4 py-3 font-bold text-white shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:ring-[3px] focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      本文へ移動
    </a>
  );
}
