-- 議案に付された附帯決議と、それに対するチームみらいの賛否（1議案1件）
create type supplementary_resolution_stance as enum ('for', 'against');

create table bill_supplementary_resolutions (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null unique references bills(id) on delete cascade,
  reference_url text not null check (reference_url ~ '^https?://'),
  stance supplementary_resolution_stance not null,
  focus_points text,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bill_supplementary_resolutions enable row level security;

create trigger update_bill_supplementary_resolutions_updated_at
  before update on bill_supplementary_resolutions
  for each row
  execute function update_updated_at_column();

comment on table bill_supplementary_resolutions is '議案に付された附帯決議とチームみらいの賛否';
comment on column bill_supplementary_resolutions.reference_url is '附帯決議の内容を確認できる参考リンク';
comment on column bill_supplementary_resolutions.stance is '附帯決議に対する賛否（賛成・反対）';
comment on column bill_supplementary_resolutions.focus_points is '附帯決議で重視した事項（任意）';
comment on column bill_supplementary_resolutions.reason is '賛否の理由（任意）';
