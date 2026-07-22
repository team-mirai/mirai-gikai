-- 公開データ取得API（オープンデータ）用の基盤
-- 1. api_rate_limits: 固定ウィンドウ方式のレートリミットカウンタ
-- 2. increment_api_rate_limit(): カウンタを原子的に加算し、制限内かを返す
-- 3. find_open_data_interview_reports(): 二次利用許諾済み公開レポートをキーセットページネーションで返す

-- ── レートリミットカウンタ ──────────────────────────────
CREATE TABLE api_rate_limits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE api_rate_limits IS '公開APIのレートリミットカウンタ（固定ウィンドウ）。keyは "ip:<addr>" や "global" 等の制限単位';

CREATE OR REPLACE FUNCTION increment_api_rate_limit(
  p_key TEXT,
  p_window_start TIMESTAMPTZ,
  p_limit INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO api_rate_limits (key, window_start, request_count)
  VALUES (p_key, p_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET request_count = api_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  -- 過去ウィンドウを掃除（テーブル肥大を防ぐ）。
  -- 新しいウィンドウ行を作った最初の呼び出しのみ実行し、同一ウィンドウ内の
  -- 残り N-1 回の呼び出しで無駄な索引スキャンを繰り返さない
  IF v_count = 1 THEN
    -- 同一キーの過去ウィンドウ
    DELETE FROM api_rate_limits
    WHERE key = p_key AND window_start < p_window_start;
    -- 二度と現れないキー（IPローテーション等）の行が永久に残らないよう、
    -- 全キー横断で1時間より古いウィンドウも併せて掃除する
    DELETE FROM api_rate_limits
    WHERE window_start < p_window_start - INTERVAL '1 hour';
  END IF;

  RETURN v_count <= p_limit;
END;
$$;

-- 時間ベースの掃除（上記の全キー横断 DELETE）用
CREATE INDEX idx_api_rate_limits_window_start
  ON api_rate_limits (window_start);

COMMENT ON FUNCTION increment_api_rate_limit(TEXT, TIMESTAMPTZ, INTEGER) IS
  'レートリミットカウンタを加算し、制限内なら true を返す（超過時 false）。ウィンドウ開始時刻はアプリ側で切り捨て計算して渡す';

-- ── 公開データ取得 ──────────────────────────────────────
-- 対象: ユーザー公開同意 × 管理者公開 × 二次利用許諾（is_data_reuse_consented）
--       かつ 公開済み議案、かつ web と同じ k-匿名性ゲート
--       （議案あたり公開レポート数 >= p_min_public_reports）を満たすもの。
-- 並び: created_at DESC, id DESC のキーセットページネーション。
CREATE OR REPLACE FUNCTION find_open_data_interview_reports(
  p_min_public_reports INTEGER,
  p_limit INTEGER,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL
) RETURNS TABLE (
  report_id UUID,
  bill_id UUID,
  bill_name TEXT,
  stance TEXT,
  role TEXT,
  role_title TEXT,
  role_description TEXT,
  summary TEXT,
  opinions JSONB,
  interview_session_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH eligible_bills AS (
    SELECT c.bill_id
    FROM interview_report r
    JOIN interview_sessions s ON s.id = r.interview_session_id
    JOIN interview_configs c ON c.id = s.interview_config_id
    JOIN bills b ON b.id = c.bill_id
    WHERE r.is_public_by_admin
      AND r.is_public_by_user
      AND b.publish_status = 'published'
    GROUP BY c.bill_id
    HAVING COUNT(*) >= p_min_public_reports
  )
  SELECT
    r.id AS report_id,
    c.bill_id,
    b.name AS bill_name,
    r.stance::TEXT,
    r.role::TEXT,
    r.role_title,
    r.role_description,
    r.summary,
    r.opinions,
    r.interview_session_id,
    r.created_at
  FROM interview_report r
  JOIN interview_sessions s ON s.id = r.interview_session_id
  JOIN interview_configs c ON c.id = s.interview_config_id
  JOIN bills b ON b.id = c.bill_id
  WHERE c.bill_id IN (SELECT eligible_bills.bill_id FROM eligible_bills)
    AND r.is_public_by_admin
    AND r.is_public_by_user
    AND r.is_data_reuse_consented
    AND (
      p_cursor_created_at IS NULL
      OR (r.created_at, r.id) < (p_cursor_created_at, p_cursor_id)
    )
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION find_open_data_interview_reports(INTEGER, INTEGER, TIMESTAMPTZ, UUID) IS
  '公開データAPI用: 二次利用許諾済みの公開レポートを新しい順に返す。議案あたり公開レポート数が閾値未満の議案は除外（webのk-匿名性ゲートと同一基準）';

-- 公開データAPIのフィルタ用（is_data_reuse_consented での絞り込みを高速化）
CREATE INDEX idx_interview_report_data_reuse_public
  ON interview_report (created_at DESC, id DESC)
  WHERE is_public_by_admin AND is_public_by_user AND is_data_reuse_consented;

-- k-匿名性ゲート（eligible_bills CTE）の集計用。二次利用許諾を条件に含めない
-- 公開レポート集計のため、上の部分インデックスでは代替できない
CREATE INDEX idx_interview_report_public_session
  ON interview_report (interview_session_id)
  WHERE is_public_by_admin AND is_public_by_user;
