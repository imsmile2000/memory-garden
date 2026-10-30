-- Run AFTER setup.sql. Caps are serialized in PostgreSQL, including concurrent requests.
BEGIN;
ALTER TABLE garden.memorials ADD CONSTRAINT photo_budget CHECK (photo IS NULL OR octet_length(photo)<=100000);
CREATE OR REPLACE FUNCTION garden.enforce_free_limits() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, garden AS $$
DECLARE row_count bigint; row_limit integer; old_exists boolean := false;
BEGIN
 PERFORM pg_advisory_xact_lock(882104);
 IF pg_database_size(current_database()) > 400 * 1024 * 1024 THEN
  RAISE EXCEPTION 'GARDEN_QUOTA: database safety limit reached';
 END IF;
 IF TG_OP='UPDATE' THEN RETURN NEW; END IF;
 -- Upserts of existing pets/presence/gestures remain valid at the row limit.
 IF TG_TABLE_NAME IN ('pets','presence') THEN
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM garden.%I WHERE user_id=$1)',TG_TABLE_NAME) INTO old_exists USING NEW.user_id;
 ELSIF TG_TABLE_NAME='gestures' THEN
  SELECT EXISTS(SELECT 1 FROM garden.gestures WHERE memorial_id=NEW.memorial_id AND user_id=NEW.user_id AND kind=NEW.kind) INTO old_exists;
 END IF;
 IF old_exists THEN RETURN NEW; END IF;
 IF TG_TABLE_NAME='messages' THEN
  -- Chat is temporary: retain at most the latest 500 messages, up to 7 days.
  DELETE FROM garden.messages WHERE created_at < (extract(epoch FROM now())*1000)::bigint-604800000;
  DELETE FROM garden.messages WHERE id IN (SELECT id FROM garden.messages ORDER BY created_at DESC,id DESC OFFSET 499);
  RETURN NEW;
 END IF;
 IF TG_TABLE_NAME='presence' THEN
  DELETE FROM garden.presence WHERE updated_at < (extract(epoch FROM now())*1000)::bigint-120000;
 END IF;
 row_limit:=CASE TG_TABLE_NAME WHEN 'memorials' THEN 100 WHEN 'comments' THEN 2000 WHEN 'gestures' THEN 10000 WHEN 'pets' THEN 500 WHEN 'presence' THEN 100 END;
 EXECUTE format('SELECT count(*) FROM garden.%I',TG_TABLE_NAME) INTO row_count;
 IF row_count>=row_limit THEN RAISE EXCEPTION 'GARDEN_QUOTA: record limit reached'; END IF;
 IF TG_TABLE_NAME='memorials' THEN
  IF (SELECT count(*) FROM garden.memorials WHERE owner=NEW.owner)>=10 THEN RAISE EXCEPTION 'GARDEN_QUOTA: personal memorial limit reached'; END IF;
 END IF;
 IF TG_TABLE_NAME='comments' THEN
  IF (SELECT count(*) FROM garden.comments WHERE memorial_id=NEW.memorial_id)>=100 THEN RAISE EXCEPTION 'GARDEN_QUOTA: memorial comment limit reached'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER free_limit BEFORE INSERT OR UPDATE ON garden.memorials FOR EACH ROW EXECUTE FUNCTION garden.enforce_free_limits();
CREATE TRIGGER free_limit BEFORE INSERT OR UPDATE ON garden.comments FOR EACH ROW EXECUTE FUNCTION garden.enforce_free_limits();
CREATE TRIGGER free_limit BEFORE INSERT OR UPDATE ON garden.gestures FOR EACH ROW EXECUTE FUNCTION garden.enforce_free_limits();
CREATE TRIGGER free_limit BEFORE INSERT OR UPDATE ON garden.pets FOR EACH ROW EXECUTE FUNCTION garden.enforce_free_limits();
CREATE TRIGGER free_limit BEFORE INSERT OR UPDATE ON garden.presence FOR EACH ROW EXECUTE FUNCTION garden.enforce_free_limits();
CREATE TRIGGER free_limit BEFORE INSERT OR UPDATE ON garden.messages FOR EACH ROW EXECUTE FUNCTION garden.enforce_free_limits();
REVOKE ALL ON FUNCTION garden.enforce_free_limits() FROM PUBLIC;
COMMIT;
