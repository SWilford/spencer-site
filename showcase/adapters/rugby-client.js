import {createClient} from '@supabase/supabase-js';
import {readOnlyPublicFetch} from './showcase-read-only.js';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:readOnlyPublicFetch(url,key)}});
