-- 公開レポートをhelpfulリアクション数×5 + total_content_richnessの重み付きスコア降順で取得するRPC関数
-- 議案詳細ページ・ご意見一覧ページのソートに使用
CREATE OR REPLACE FUNCTION find_public_reports_by_bill_id_ordered_by_reactions(
  p_bill_id UUID,
  p_limit INT DEFAULT 1000
)
RETURNS TABLE (
  id UUID,
  stance stance_type_enum,
  role interview_report_role_enum,
  role_title TEXT,
  summary TEXT,
  total_content_richness INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ir.id,
    ir.stance,
    ir.role,
    ir.role_title,
    ir.summary,
    ir.total_content_richness,
    ir.created_at
  FROM interview_report ir
  INNER JOIN interview_sessions s ON s.id = ir.interview_session_id
  INNER JOIN interview_configs c ON c.id = s.interview_config_id
  LEFT JOIN (
    SELECT rr.interview_report_id, COUNT(*) AS helpful_count
    FROM report_reactions rr
    WHERE rr.reaction_type = 'helpful'
    GROUP BY rr.interview_report_id
  ) rc ON rc.interview_report_id = ir.id
  WHERE ir.is_public_by_admin = TRUE
    AND ir.is_public_by_user = TRUE
    AND c.bill_id = p_bill_id
  ORDER BY (COALESCE(rc.helpful_count, 0) * 5 + COALESCE(ir.total_content_richness, 0)) DESC, ir.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
