-- interview_opinion は当初 interview_report.opinions(JSONB) から導出する
-- 「正規化プロジェクション」として作られたが、意見再抽出は JSONB を書き換えず
-- interview_opinion テーブルのみ更新する方針に変更した。
-- そのため本テーブルは JSONB の派生ではなく、トピック分析用の意見ストアとして独立する。
-- （新規インタビュー完了時のみ JSONB と本テーブルの両方へ互換目的で書き込む。）
COMMENT ON TABLE interview_opinion IS 'トピック分析用の意見ストア。新規インタビュー完了時は interview_report.opinions(JSONB) と本テーブルの両方へ書き込み、意見再抽出は本テーブルのみ更新する（JSONB は原本として保持）';
