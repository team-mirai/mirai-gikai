-- チームみらいの賛否・判断の理由の公開/非公開を手動で切り替えるためのフラグ
ALTER TABLE mirai_stances
  ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN mirai_stances.is_published IS '賛否・判断の理由の公開フラグ（false: 非公開。publish_at に関わらず公開側で未設定として扱う）';
