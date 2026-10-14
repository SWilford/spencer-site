-- This new project's pg_net extension has no jobs or queued requests yet.
-- Reinstall in the extensions namespace to avoid public-schema extension exposure.
drop extension pg_net;
create extension pg_net with schema extensions;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('music-imports','music-imports',false,52428800,array['application/zip'])
on conflict (id) do nothing;

select cron.schedule('spotify-recent-history','*/10 * * * *', $job$
 select net.http_post(
   url := 'https://ijoeuoebqxsiqpyiqqoz.supabase.co/functions/v1/spotify-collect',
   headers := jsonb_build_object('Content-Type','application/json','Authorization',
     'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='music_collector_key')),
   body := '{"action":"collect"}'::jsonb,
   timeout_milliseconds := 120000
 );
$job$);
