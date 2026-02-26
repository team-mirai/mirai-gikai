-- interview_sessions テーブルに rating カラムを追加（星1〜5、nullable）
alter table interview_sessions
  add column rating smallint check (rating >= 1 and rating <= 5);
