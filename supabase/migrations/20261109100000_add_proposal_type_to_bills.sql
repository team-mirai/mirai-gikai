-- 閣法か議員立法かを区別する。衆法・参法の違いは originating_house で表す
create type bill_proposal_type as enum (
  'cabinet', -- 閣法（内閣提出法案）
  'member'   -- 議員立法
);

-- 既存の掲載法案は主に閣法なので、既定値を閣法にする
alter table bills
  add column proposal_type bill_proposal_type not null default 'cabinet';

-- これまでタグで区別していた議員立法を引き継ぐ
update bills
set proposal_type = 'member'
where id in (
  select bt.bill_id
  from bills_tags bt
  join tags t on t.id = bt.tag_id
  where t.label = '議員立法'
);
