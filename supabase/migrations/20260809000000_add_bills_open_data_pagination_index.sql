-- オープンデータAPIの議案一覧が使うキーセットページネーション
-- （publish_status = 'published' かつ created_at DESC, id DESC）用のインデックス
create index if not exists idx_bills_publish_status_created_at_id
  on bills (publish_status, created_at desc, id desc);
