-- Only service_role can execute. The separate Edge Function authenticates the read-only site key.
create or replace function public.music_site_snapshot()
returns jsonb language plpgsql security definer set search_path=pg_catalog
as $$
begin
 return jsonb_build_object(
   'generatedAt',now(), 'lastCollection',(select last_success from music_private.collector),
   'collectionError',(select last_error from music_private.collector),
   'collectionStartedAt',(select min(started_at) from music_private.runs),
   'truncated',(select count(*)>25000 from music_private.spotify_plays),
   'artistProfiles',coalesce((select jsonb_object_agg(artist_id,jsonb_build_object('image',image_url,'url',spotify_url)) from music_private.artist_profiles),'{}'::jsonb),
   'plays',coalesce((select jsonb_agg(jsonb_build_object(
     'id',p.source_key,'at',p.played_at,'provider','spotify',
     'songLengthMs',p.song_length_ms,'actualMs',p.actual_listened_ms,
     'trackId',coalesce(p.spotify_uri,p.source_key),
     'name',coalesce(p.raw_item#>>'{track,name}','Unknown track'),
     'url',p.raw_item#>>'{track,external_urls,spotify}',
     'artists',coalesce((select jsonb_agg(jsonb_build_object('id',coalesce(a->>'id',a->>'name'),'name',a->>'name'))
       from jsonb_array_elements(p.raw_item#>'{track,artists}') a),'[]'::jsonb),
     'albumId',p.raw_item#>>'{track,album,id}',
     'album',p.raw_item#>>'{track,album,name}',
     'artwork',p.raw_item#>>'{track,album,images,0,url}'
   ) order by p.played_at) from (select * from music_private.spotify_plays order by played_at desc limit 25000) p),'[]'::jsonb)
 );
end;
$$;
revoke all on function public.music_site_snapshot() from public,anon,authenticated;
grant execute on function public.music_site_snapshot() to service_role;
