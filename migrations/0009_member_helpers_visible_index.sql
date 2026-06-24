CREATE INDEX IF NOT EXISTS idx_member_helpers_visible_status
  ON member_helpers (visible, status ASC, event_name ASC);

UPDATE member_helpers SET visible = 1 WHERE visible IS NULL;
