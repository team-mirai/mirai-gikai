-- 附帯決議を衆議院・参議院それぞれで記録できるようにし（1議案につき院ごとに1件）、
-- 内容を自由記述のテキストで持てるようにする。参考リンクはそのまま残す

-- 附帯決議の内容（自由記述・任意）
alter table bill_supplementary_resolutions
  add column content text;

alter table bill_supplementary_resolutions
  add column house house_enum;

-- 既存の附帯決議には院の記録がないため、議案の先議院を入れておく
update bill_supplementary_resolutions r
set house = b.originating_house
from bills b
where b.id = r.bill_id;

alter table bill_supplementary_resolutions
  alter column house set not null;

alter table bill_supplementary_resolutions
  drop constraint bill_supplementary_resolutions_bill_id_key;

alter table bill_supplementary_resolutions
  add constraint bill_supplementary_resolutions_bill_id_house_key
  unique (bill_id, house);

comment on table bill_supplementary_resolutions is '議案に付された附帯決議とチームみらいの賛否（院ごとに1件）';
comment on column bill_supplementary_resolutions.content is '附帯決議の内容（自由記述・任意）';
comment on column bill_supplementary_resolutions.house is '附帯決議を付した院（HR=衆議院 / HC=参議院）';
