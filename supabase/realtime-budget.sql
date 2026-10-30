BEGIN;
CREATE TABLE IF NOT EXISTS garden.realtime_usage (
 period text PRIMARY KEY,
 units bigint NOT NULL CHECK (units>=0 AND units<=500000)
);
ALTER TABLE garden.realtime_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON garden.realtime_usage FROM PUBLIC,anon,authenticated;
COMMIT;
