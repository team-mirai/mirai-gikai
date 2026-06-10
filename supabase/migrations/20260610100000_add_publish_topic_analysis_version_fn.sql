-- version の公開切替を「旧公開版を降ろす → 対象を公開」を1トランザクションで行う関数。
-- アプリ層で2回 update（各 auto-commit）すると、その間に公開版が0件の瞬間が
-- 外部トランザクションから見えてしまい、公開読み取りが一時的に404（準備中）になる。
-- 関数内（単一トランザクション）で実行することで、外部からは旧公開→新公開へ
-- アトミックに切り替わって見える（中間状態は不可視）。one_published_per_bill も満たす。
CREATE OR REPLACE FUNCTION publish_topic_analysis_version(p_version_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_bill_id UUID;
BEGIN
  SELECT bill_id INTO v_bill_id
  FROM topic_analysis_version
  WHERE id = p_version_id;

  IF v_bill_id IS NULL THEN
    RAISE EXCEPTION 'topic_analysis_version % not found', p_version_id;
  END IF;

  -- 先に同 bill の現公開版を降ろす（同一トランザクション内なので部分ユニーク制約に衝突しない）
  UPDATE topic_analysis_version
  SET is_published = false
  WHERE bill_id = v_bill_id
    AND is_published = true
    AND id <> p_version_id;

  -- 対象を公開
  UPDATE topic_analysis_version
  SET is_published = true
  WHERE id = p_version_id;
END;
$$;
