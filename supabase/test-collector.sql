-- Run inside a transaction and roll back every synthetic record/change.
begin;
do $$
declare
 key text;
 a jsonb;
 b jsonb;
 result jsonb;
 fixture jsonb := '{"items":[{"played_at":"2000-01-01T00:00:00Z","track":{"uri":"spotify:track:fixture-only","duration_ms":180000},"context":null},{"played_at":"2000-01-01T00:00:00Z","track":{"uri":"spotify:track:fixture-only","duration_ms":180000},"context":null}]}';
begin
 select decrypted_secret into key from vault.decrypted_secrets where name='music_collector_key';
 a := public.music_collector_control('acquire',key);
 if a->>'state' <> 'acquired' then raise exception 'Fixture could not acquire lease'; end if;
 b := public.music_collector_control('acquire',key);
 if b->>'state' <> 'busy' then raise exception 'Concurrent lease was allowed'; end if;
 begin
   perform public.music_collector_control('finish',key,jsonb_build_object('run_id',gen_random_uuid(),'pages','[]'::jsonb));
   raise exception 'Stale lease was accepted';
 exception when others then
   if sqlerrm <> 'Stale lease' then raise; end if;
 end;
 result := public.music_collector_control('finish',key,jsonb_build_object('run_id',a->>'run_id','pages',jsonb_build_array(fixture),'truncated',false));
 if result->>'inserted' <> '1' then raise exception 'Within-page duplicate was counted'; end if;
 a := public.music_collector_control('acquire',key);
 result := public.music_collector_control('finish',key,jsonb_build_object('run_id',a->>'run_id','pages',jsonb_build_array(fixture),'truncated',false));
 if result->>'inserted' <> '0' then raise exception 'Overlap duplicate was counted'; end if;
 if exists(select 1 from music_private.spotify_plays where actual_listened_ms is not null or qualified_stream is not null) then
   raise exception 'Song length was presented as actual duration or stream qualification';
 end if;
 a := public.music_collector_control('acquire',key);
 perform public.music_collector_control('fail',key,jsonb_build_object('run_id',a->>'run_id','code','fixture_429','retry_seconds',60));
 b := public.music_collector_control('acquire',key);
 if b->>'state' <> 'backoff' then raise exception 'Rate-limit backoff was ignored'; end if;
 if has_function_privilege('anon','public.music_collector_control(text,text,jsonb)','EXECUTE') or
    has_function_privilege('authenticated','public.music_collector_control(text,text,jsonb)','EXECUTE') then
   raise exception 'Private control RPC is publicly callable';
 end if;
end;
$$;
rollback;
