-- モデレーションステータスのENUM型を作成
create type moderation_status_enum as enum ('ok', 'warning', 'ng');

-- interview_report テーブルにモデレーション関連カラムを追加
alter table interview_report
  add column moderation_score integer,
  add column moderation_status moderation_status_enum
    generated always as (
      case
        when moderation_score is null then null
        when moderation_score >= 70 then 'ng'::moderation_status_enum
        when moderation_score >= 30 then 'warning'::moderation_status_enum
        else 'ok'::moderation_status_enum
      end
    ) stored;

-- モデレーションスコアの制約 (0-100)
alter table interview_report
  add constraint chk_moderation_score_range
  check (moderation_score is null or (moderation_score >= 0 and moderation_score <= 100));

-- モデレーションステータスでのフィルタリング用インデックス
create index idx_interview_report_moderation_status on interview_report(moderation_status);

-- カラムコメント
comment on column interview_report.moderation_score is 'モデレーションスコア（0-100）: 0が最も適切、100が最も不適切';
comment on column interview_report.moderation_status is 'モデレーションステータス（generated column）: ok=問題なし, warning=要注意, ng=不適切';
