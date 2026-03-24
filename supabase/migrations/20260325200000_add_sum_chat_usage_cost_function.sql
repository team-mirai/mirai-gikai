create or replace function public.sum_chat_usage_cost(
  from_iso timestamptz,
  to_iso timestamptz
)
returns numeric(12, 6)
language sql
stable
as $$
  select coalesce(sum(cost_usd), 0)
  from public.chat_usage_events
  where occurred_at >= from_iso
    and occurred_at < to_iso;
$$;

revoke execute on function public.sum_chat_usage_cost(timestamptz, timestamptz) from public;
revoke execute on function public.sum_chat_usage_cost(timestamptz, timestamptz) from anon;
revoke execute on function public.sum_chat_usage_cost(timestamptz, timestamptz) from authenticated;
grant execute on function public.sum_chat_usage_cost(timestamptz, timestamptz) to service_role;
