-- interview_report テーブルからモデレーション該当カテゴリカラムを削除
alter table interview_report
  drop column moderation_flagged_categories;
