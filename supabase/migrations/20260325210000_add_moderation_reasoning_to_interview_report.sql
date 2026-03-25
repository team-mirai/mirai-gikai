-- interview_report テーブルにモデレーション根拠・該当カテゴリカラムを追加
alter table interview_report
  add column moderation_reasoning text,
  add column moderation_flagged_categories text[] default '{}';

-- カラムコメント
comment on column interview_report.moderation_reasoning is 'モデレーションスコアの根拠（200文字以内）';
comment on column interview_report.moderation_flagged_categories is 'モデレーションで該当した評価カテゴリ名の配列';
