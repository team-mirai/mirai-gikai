-- 法案の種類（閣法・議員立法）を未設定にできるようにする。
-- 種類が分からない法案を閣法として表示しないよう、新規作成時の既定値も未設定にする。
-- 既存の値は変更しない
alter table bills alter column proposal_type drop not null;
alter table bills alter column proposal_type drop default;
