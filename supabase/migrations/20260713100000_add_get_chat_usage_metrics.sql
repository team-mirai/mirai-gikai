-- チャット利用状況（chat_usage_events）を prompt_name ごとに集計する
-- 内部向けMCPツール get_chat_usage_metrics 用
--
-- prompt_name の例:
--   bill-chat-system-* … 議案ページのAIチャット
--   interview-chat / interview-summary / interview-initial-question … AIインタビュー
-- p_bill_id は metadata->>'billId' でのフィルタ。議案チャットとインタビュー系は
-- billId を記録するが、トップページチャット（top-chat-system）は記録しないため、
-- 指定時はトップチャットのイベントは対象外になる。
--
-- occurred_at / metadata->>'billId' へのインデックスは意図的に追加していない:
-- 全期間集計はどのみち全件スキャンが必要で（実測: 15万行で約170ms）、
-- 低頻度の内部ツールのためにイベント挿入（ホットパス）へ恒常的な
-- インデックス維持コストを載せる方が高くつくため。ダッシュボード等から
-- 定常的に呼ぶようになったら occurred_at 単独インデックスの追加を検討する。
create or replace function public.get_chat_usage_metrics(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_bill_id uuid default null
)
returns table (
  prompt_name text,
  event_count bigint,
  unique_user_count bigint,
  unique_session_count bigint,
  total_tokens bigint,
  total_cost_usd numeric
)
language sql
stable
as $$
  select
    coalesce(e.prompt_name, '(unknown)') as prompt_name,
    count(*) as event_count,
    count(distinct e.user_id) as unique_user_count,
    count(distinct e.session_id) as unique_session_count,
    coalesce(sum(e.total_tokens), 0)::bigint as total_tokens,
    coalesce(sum(e.cost_usd), 0) as total_cost_usd
  from public.chat_usage_events e
  where (p_from is null or e.occurred_at >= p_from)
    and (p_to is null or e.occurred_at < p_to)
    and (p_bill_id is null or e.metadata ->> 'billId' = p_bill_id::text)
  group by 1
  order by event_count desc;
$$;

revoke execute on function public.get_chat_usage_metrics(timestamptz, timestamptz, uuid) from public;
revoke execute on function public.get_chat_usage_metrics(timestamptz, timestamptz, uuid) from anon;
revoke execute on function public.get_chat_usage_metrics(timestamptz, timestamptz, uuid) from authenticated;
grant execute on function public.get_chat_usage_metrics(timestamptz, timestamptz, uuid) to service_role;
