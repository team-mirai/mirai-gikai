-- 附帯決議に公開フラグを持たせる。議案管理シートから Slack bot が転記した附帯決議は非公開で入り、
-- 担当議員室が Slack の公開確認で「公開する」を押したときに公開する
alter table bill_supplementary_resolutions
  add column is_published boolean not null default false;

-- これまでに admin で登録した附帯決議は、登録した人が公開するつもりで入れたものなので公開にしておく
update bill_supplementary_resolutions set is_published = true;

comment on column bill_supplementary_resolutions.is_published is '公開フラグ（false: 非公開。公開サイトに表示しない）';
