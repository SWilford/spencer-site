create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists music_private;
revoke all on schema music_private from public, anon, authenticated;

create table music_private.collector (
  singleton boolean primary key default true check (singleton),
  key_hash text not null, client_id text, refresh_secret uuid,
  lease_id uuid, lease_until timestamptz, cursor_ms bigint,
  retry_at timestamptz, last_success timestamptz, last_error text
);
insert into music_private.collector(singleton,key_hash) values (true,'__KEY_HASH__');
create table music_private.runs (
  id uuid primary key, started_at timestamptz not null default now(),
  finished_at timestamptz, status text not null default 'running',
  inserted_count integer, error_code text
);
create table music_private.spotify_pages (
  run_id uuid references music_private.runs(id), page_number integer,
  fetched_at timestamptz not null default now(), payload jsonb not null,
  primary key(run_id,page_number)
);
create table music_private.spotify_plays (
  source_key text primary key, played_at timestamptz not null,
  spotify_uri text, song_length_ms bigint,
  duration_kind text not null default 'full_song_estimate',
  actual_listened_ms bigint, qualified_stream boolean,
  first_seen_run uuid references music_private.runs(id), raw_item jsonb not null
);
alter table music_private.collector enable row level security;
alter table music_private.runs enable row level security;
alter table music_private.spotify_pages enable row level security;
alter table music_private.spotify_plays enable row level security;
revoke all on all tables in schema music_private from public, anon, authenticated;

-- Only the hosted function's service role can call this API. Raw/token tables
-- stay in an unexposed schema; the additional random key protects the function.
create or replace function public.music_collector_control(action text, collector_key text, payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare
 c music_private.collector%rowtype;
 run uuid;
 secret_id uuid;
 secret_value text;
 page jsonb;
 item jsonb;
 n integer := 0;
 page_n integer := 0;
 inserted integer;
 latest bigint;
 key text;
begin
 select * into c from music_private.collector where singleton for update;
 if c.key_hash is distinct from encode(extensions.digest(collector_key,'sha256'),'hex') then
   raise exception 'Unauthorized';
 end if;
 if action = 'status' then
   return jsonb_build_object('connected',c.refresh_secret is not null,'last_success',c.last_success,
     'last_error',c.last_error,'retry_at',c.retry_at,
     'recorded_plays',(select count(*) from music_private.spotify_plays));
 elsif action = 'bootstrap' then
   if c.refresh_secret is not null then raise exception 'Already connected'; end if;
   if length(coalesce(payload->>'refresh_token','')) < 10 or
      (payload->>'client_id') !~ '^[a-fA-F0-9]{32}$' then raise exception 'Invalid authorization'; end if;
   select vault.create_secret(payload->>'refresh_token','music_spotify_refresh') into secret_id;
   perform vault.create_secret(collector_key,'music_collector_key');
   update music_private.collector set refresh_secret=secret_id, client_id=payload->>'client_id' where singleton;
   return jsonb_build_object('connected',true);
 elsif action = 'acquire' then
   if c.refresh_secret is null then return jsonb_build_object('state','awaiting_authorization'); end if;
   if c.retry_at > now() then return jsonb_build_object('state','backoff'); end if;
   if c.lease_until > now() then return jsonb_build_object('state','busy'); end if;
   -- Mark expired runs so a killed function never looks healthy indefinitely.
   update music_private.runs set status='expired',finished_at=now()
     where id=c.lease_id and status='running';
   run := gen_random_uuid();
   insert into music_private.runs(id) values (run);
   update music_private.collector set lease_id=run,lease_until=now()+interval '5 minutes' where singleton;
   select decrypted_secret into secret_value from vault.decrypted_secrets where id=c.refresh_secret;
   return jsonb_build_object('state','acquired','run_id',run,'client_id',c.client_id,
     'refresh_token',secret_value,'after',case when c.cursor_ms is null then null else greatest(0,c.cursor_ms-3600000) end);
 end if;
 run := (payload->>'run_id')::uuid;
 if c.lease_id is distinct from run or c.lease_until < now() then raise exception 'Stale lease'; end if;
 if action = 'save_token' then
   if length(coalesce(payload->>'refresh_token','')) < 10 then raise exception 'Invalid token'; end if;
   perform vault.update_secret(c.refresh_secret,payload->>'refresh_token');
   return jsonb_build_object('saved',true);
 elsif action = 'catalog_finish' then
   -- Catalog-only work shares refresh-token fencing, but never claims a history sync.
   update music_private.runs set status=case when payload->>'code' is null then 'catalog_success' else 'catalog_failed' end,
     finished_at=now(),error_code=left(payload->>'code',80) where id=run;
   update music_private.collector set lease_id=null,lease_until=null,
     retry_at=case when coalesce((payload->>'retry_seconds')::integer,0)>0
       then now()+make_interval(secs=>least(86400,greatest(60,(payload->>'retry_seconds')::integer))) else retry_at end
     where singleton;
   return jsonb_build_object('released',true);
 elsif action = 'finish' then
   if jsonb_array_length(payload->'pages') > 10 then raise exception 'Too many pages'; end if;
   latest := c.cursor_ms;
   for page in select value from jsonb_array_elements(payload->'pages') loop
     page_n := page_n+1;
     insert into music_private.spotify_pages(run_id,page_number,payload) values (run,page_n,page);
     for item in select value from jsonb_array_elements(page->'items') loop
       key := encode(extensions.digest(jsonb_build_array(item->>'played_at',
         coalesce(item#>>'{track,uri}',item#>>'{track,id}',item#>>'{track,name}'),item->'context')::text,'sha256'),'hex');
       insert into music_private.spotify_plays(source_key,played_at,spotify_uri,song_length_ms,first_seen_run,raw_item)
         values (key,(item->>'played_at')::timestamptz,item#>>'{track,uri}',
           (item#>>'{track,duration_ms}')::bigint,run,item) on conflict do nothing;
       get diagnostics inserted = row_count;
       n := n+inserted;
       latest := greatest(latest,(extract(epoch from (item->>'played_at')::timestamptz)*1000)::bigint);
     end loop;
   end loop;
   update music_private.runs set status=case when coalesce((payload->>'truncated')::boolean,false) then 'page_cap' else 'success' end,
     finished_at=now(),inserted_count=n where id=run;
   update music_private.collector set
     cursor_ms=case when coalesce((payload->>'truncated')::boolean,false) then c.cursor_ms else latest end,
     last_success=now(),last_error=case when coalesce((payload->>'truncated')::boolean,false) then 'page_cap' else null end,
     retry_at=null,lease_id=null,lease_until=null where singleton;
   return jsonb_build_object('inserted',n,'pages',page_n,'truncated',payload->'truncated');
 elsif action = 'fail' then
   update music_private.runs set status='failed',finished_at=now(),error_code=left(payload->>'code',80) where id=run;
   update music_private.collector set last_error=left(payload->>'code',80),
     retry_at=now()+make_interval(secs=>least(86400,greatest(60,coalesce((payload->>'retry_seconds')::integer,600)))),
     lease_id=null,lease_until=null where singleton;
   return jsonb_build_object('recorded',true);
 end if;
 raise exception 'Unsupported action';
end;
$$;
revoke all on function public.music_collector_control(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.music_collector_control(text,text,jsonb) to service_role;
