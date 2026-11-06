/** Supabase（PostgREST）が1レスポンスで返す最大行数（supabase/config.toml の max_rows） */
const SUPABASE_MAX_ROWS = 1000;

/**
 * max_rows を超える結果を取りこぼさないよう、range 指定のページを
 * 末尾まで順に取得して連結する。
 * 取りこぼし・重複を防ぐため、fetchPage には一意に定まる並び順を指定すること。
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize: number = SUPABASE_MAX_ROWS
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const page = await fetchPage(offset, offset + pageSize - 1);
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}
