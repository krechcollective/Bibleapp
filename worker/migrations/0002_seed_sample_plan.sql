-- Placeholder sample plan so the Plan view has data before the real
-- day-by-day plan file is imported. Safe to delete once real data lands
-- (see scripts/import-plan.ts for the importer).
INSERT OR IGNORE INTO reading_plans (id, user_id, name, start_date, total_days)
VALUES ('sample-plan', 'default', 'Sample 7-Day Plan', date('now'), 7);

INSERT OR IGNORE INTO reading_plan_days (id, plan_id, day_number, day_date, passages) VALUES
  ('sample-plan-1', 'sample-plan', 1, date('now'), '[{"book":"Genesis","chapter":1},{"book":"Genesis","chapter":2}]'),
  ('sample-plan-2', 'sample-plan', 2, date('now', '+1 day'), '[{"book":"Genesis","chapter":3},{"book":"Genesis","chapter":4}]'),
  ('sample-plan-3', 'sample-plan', 3, date('now', '+2 day'), '[{"book":"Genesis","chapter":5},{"book":"Genesis","chapter":6}]'),
  ('sample-plan-4', 'sample-plan', 4, date('now', '+3 day'), '[{"book":"Matthew","chapter":1}]'),
  ('sample-plan-5', 'sample-plan', 5, date('now', '+4 day'), '[{"book":"Matthew","chapter":2}]'),
  ('sample-plan-6', 'sample-plan', 6, date('now', '+5 day'), '[{"book":"Psalms","chapter":1},{"book":"Psalms","chapter":2}]'),
  ('sample-plan-7', 'sample-plan', 7, date('now', '+6 day'), '[{"book":"Psalms","chapter":3}]');
