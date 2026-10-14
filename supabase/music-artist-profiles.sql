create table music_private.artist_profiles (
 artist_id text primary key check (artist_id ~ '^[A-Za-z0-9]{22}$'),
 name text, image_url text, spotify_url text,
 fetched_at timestamptz, retry_at timestamptz not null default now()
);
alter table music_private.artist_profiles enable row level security;
revoke all on music_private.artist_profiles from public,anon,authenticated;
create table music_private.artist_catalog_state (
 singleton boolean primary key default true check(singleton), retry_at timestamptz
);
insert into music_private.artist_catalog_state values(true,null);
alter table music_private.artist_catalog_state enable row level security;
revoke all on music_private.artist_catalog_state from public,anon,authenticated;

create function public.music_artist_catalog(action text,collector_key text,payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path=pg_catalog
as $$
declare item jsonb;
begin
 if not exists(select 1 from music_private.collector where key_hash=encode(extensions.digest(collector_key,'sha256'),'hex')) then raise exception 'Unauthorized'; end if;
 if action='pending' then
  if exists(select 1 from music_private.artist_catalog_state where retry_at>now()) then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(id) from (
   select a->>'id' id,count(*) plays from music_private.spotify_plays p
    cross join lateral jsonb_array_elements(p.raw_item#>'{track,artists}') a
    left join music_private.artist_profiles c on c.artist_id=a->>'id'
   where a->>'id' ~ '^[A-Za-z0-9]{22}$' and (c.artist_id is null or c.retry_at<=now())
   group by a->>'id' order by plays desc,id limit 40
  ) q),'[]'::jsonb);
 elsif action='save' then
  if jsonb_typeof(payload->'artists') is distinct from 'array' or jsonb_array_length(payload->'artists')>40 then raise exception 'Invalid batch'; end if;
  for item in select * from jsonb_array_elements(payload->'artists') loop
   if item->>'id' !~ '^[A-Za-z0-9]{22}$' then raise exception 'Invalid artist'; end if;
   insert into music_private.artist_profiles(artist_id,name,image_url,spotify_url,fetched_at,retry_at)
   values(item->>'id',item->>'name',case when item->>'image' ~ '^https://i[.]scdn[.]co/image/[A-Za-z0-9]+$' then item->>'image' end,
    'https://open.spotify.com/artist/'||(item->>'id'),now(),now()+interval '7 days')
   on conflict(artist_id) do update set name=excluded.name,image_url=excluded.image_url,spotify_url=excluded.spotify_url,fetched_at=excluded.fetched_at,retry_at=excluded.retry_at;
  end loop;
  return jsonb_build_object('saved',jsonb_array_length(payload->'artists'));
 elsif action='defer' then
  update music_private.artist_catalog_state set retry_at=now()+make_interval(secs=>greatest(60,least(86400,coalesce((payload->>'seconds')::int,600))));
  return jsonb_build_object('deferred',true);
 end if;
 raise exception 'Unknown action';
end;
$$;
revoke all on function public.music_artist_catalog(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.music_artist_catalog(text,text,jsonb) to service_role;
