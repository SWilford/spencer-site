import {useEffect,useState} from 'react';
export function usePathname(){const[path,setPath]=useState(location.hash.slice(1)||'/');useEffect(()=>{const update=()=>setPath(location.hash.slice(1)||'/');window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update)},[]);return path;}
