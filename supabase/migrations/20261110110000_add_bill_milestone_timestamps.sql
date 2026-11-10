-- 法案の節目（初公開・審議状況の変化・賛否の公開・インタビューの公開）の日時を記録する。
-- admin 画面・MCP・予約公開のどの経路で変わっても漏れないよう、trigger で記録する。
-- 既存の行は埋め戻さず null のままにする（null は「いつ起きたか分からない」を表す）。
-- 日時の列は trigger だけが書く。INSERT・UPDATE で値が渡されても、状態から決めた値で上書きする。

-- 1. 法案を初めて公開した日時
alter table bills add column first_published_at timestamptz;

comment on column bills.first_published_at is '法案を初めて公開（publish_status=published）にした日時。一度入れたら更新しない。null は記録前から公開済み、または未公開';

create function set_bills_first_published_at() returns trigger as $$
begin
  -- 公開に変わったときだけ入れる（記録前から公開済みの法案は、他の列を編集しても null のまま）
  if tg_op = 'INSERT' then
    new.first_published_at :=
      case when new.publish_status = 'published' then now() end;
  elsif old.first_published_at is null
    and old.publish_status <> 'published'
    and new.publish_status = 'published' then
    new.first_published_at := now();
  else
    new.first_published_at := old.first_published_at;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_bills_first_published_at
  before insert or update on bills
  for each row
  execute function set_bills_first_published_at();

-- 2. 審議状況（bills.status）の変化の履歴
create table bill_status_changes (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  from_status bill_status_enum,
  to_status bill_status_enum not null,
  changed_at timestamptz not null default now()
);

create index idx_bill_status_changes_bill_id_changed_at
  on bill_status_changes (bill_id, changed_at);

alter table bill_status_changes enable row level security;

comment on table bill_status_changes is '法案の審議状況（bills.status）が変わった履歴';
comment on column bill_status_changes.from_status is '変更前の審議状況。法案の作成時は null';
comment on column bill_status_changes.to_status is '変更後の審議状況';
comment on column bill_status_changes.changed_at is '審議状況が変わった日時';

create function record_bill_status_change() returns trigger as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into bill_status_changes (bill_id, from_status, to_status)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.status end,
      new.status
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger record_bill_status_change
  after insert or update of status on bills
  for each row
  execute function record_bill_status_change();

-- 3. 賛否を公開した日時
alter table mirai_stances add column published_at timestamptz;

comment on column mirai_stances.published_at is '賛否を公開（is_published=true）にした日時。非公開に戻すと null。予約公開の場合は publish_at と大きい方が実際に表に出た日時';

create function set_mirai_stances_published_at() returns trigger as $$
begin
  if not new.is_published then
    new.published_at := null;
  elsif tg_op = 'INSERT' or not old.is_published then
    new.published_at := now();
  elsif old.publish_at > now()
    and (new.publish_at is null or new.publish_at <= now()) then
    -- 予約公開の日時を外して（または過去にして）即時公開に変えたときも、公開した日時とする
    new.published_at := now();
  else
    new.published_at := old.published_at;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_mirai_stances_published_at
  before insert or update on mirai_stances
  for each row
  execute function set_mirai_stances_published_at();

-- 4. インタビューを公開した日時
alter table interview_configs add column published_at timestamptz;

comment on column interview_configs.published_at is 'インタビューを公開（status=public）にした日時。closed にすると null';

create function set_interview_configs_published_at() returns trigger as $$
begin
  if new.status <> 'public' then
    new.published_at := null;
  elsif tg_op = 'INSERT' or old.status <> 'public' then
    new.published_at := now();
  else
    new.published_at := old.published_at;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_interview_configs_published_at
  before insert or update on interview_configs
  for each row
  execute function set_interview_configs_published_at();
