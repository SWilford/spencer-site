-- Separate website credentials: neither can acquire the collector or fetch Spotify.
create table if not exists music_private.site_access (
  purpose text primary key check (purpose in ('read','write')),
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$')
);
alter table music_private.site_access enable row level security;
revoke all on music_private.site_access from public,anon,authenticated;

create or replace function public.music_site_authorize(access_key text, purpose text)
returns boolean language sql stable security definer set search_path=pg_catalog
as $$ select exists(select 1 from music_private.site_access a where a.purpose=$2
  and a.key_hash=encode(extensions.digest($1,'sha256'),'hex')); $$;
revoke all on function public.music_site_authorize(text,text) from public,anon,authenticated;
grant execute on function public.music_site_authorize(text,text) to service_role;

create table if not exists music_private.site_assets(name text primary key, checksum text not null check(checksum ~ '^[a-f0-9]{64}$'));
alter table music_private.site_assets enable row level security;
revoke all on music_private.site_assets from public,anon,authenticated;
create or replace function public.music_site_catalog_checksum()
returns text language sql stable security definer set search_path=pg_catalog
as $$ select checksum from music_private.site_assets where name='catalog'; $$;
create or replace function public.music_site_activate_catalog(checksum text)
returns boolean language plpgsql security definer set search_path=pg_catalog
as $$ begin
 if checksum !~ '^[a-f0-9]{64}$' or not exists(select 1 from storage.objects where bucket_id='music-imports' and name='site/'||checksum||'/catalog.json.gz') then return false; end if;
 insert into music_private.site_assets(name,checksum) values('catalog',checksum) on conflict(name) do update set checksum=excluded.checksum;
 return true;
end; $$;
revoke all on function public.music_site_catalog_checksum() from public,anon,authenticated;
revoke all on function public.music_site_activate_catalog(text) from public,anon,authenticated;
grant execute on function public.music_site_catalog_checksum() to service_role;
grant execute on function public.music_site_activate_catalog(text) to service_role;
