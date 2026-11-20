ALTER TABLE me_manager_publication_effects ADD COLUMN destination_url TEXT;
ALTER TABLE me_manager_publication_effects ADD COLUMN credential_hash TEXT;
CREATE FUNCTION protect_effect_callback_destination() RETURNS trigger AS $$ BEGIN IF OLD.destination_url IS NOT NULL AND ROW(NEW.destination_url,NEW.credential_hash) IS DISTINCT FROM ROW(OLD.destination_url,OLD.credential_hash) THEN RAISE EXCEPTION 'Effect callback destination is immutable'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER me_manager_effect_destination BEFORE UPDATE ON me_manager_publication_effects FOR EACH ROW EXECUTE FUNCTION protect_effect_callback_destination();
