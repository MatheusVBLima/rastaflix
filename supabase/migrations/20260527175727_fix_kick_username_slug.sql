UPDATE streamer_config SET kick_username = 'ovelheram', updated_at = now() WHERE kick_username = 'OvelheraM' OR kick_username IS DISTINCT FROM lower(kick_username);;
