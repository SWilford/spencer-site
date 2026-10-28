import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Home from '@/app/page';
import Experience from '@/app/experience/page';
import Contact from '@/app/contact/page';
import {SiteHeader} from '@/components/site-header';
import {SiteFooter} from '@/components/site-footer';
import {WireframeBackground} from '@/components/wireframe-background';
import {usePathname} from './navigation';
import '@/app/globals.css';
import './fonts.css';
const raw=Number(new URLSearchParams(location.search).get('depth')||1),depth=Number.isFinite(raw)?Math.max(1,Math.min(3,raw)):1;
function App(){const route=usePathname();const[nested,setNested]=useState(false);useEffect(()=>{setNested(false);window.scrollTo(0,0)},[route]);return <><div style={{position:'fixed',bottom:12,right:14,zIndex:40,fontSize:12,color:'var(--accent-light)',background:'var(--background)',padding:'6px 12px',borderRadius:6}}>Inception · Level {depth} / 3</div>{!nested&&<WireframeBackground/>}<SiteHeader/>{route==='/'?<Home/>:route==='/experience'?<Experience/>:route==='/contact'?<Contact/>:<main id="main" className="page-content interior-page"><div className="page-heading"><h1>{route==='/projects'?'Projects':route==='/resume'?'Resume':'Music Stats'}</h1><p>{route==='/projects'?'A portfolio, inside a portfolio.':route==='/resume'?'Download the public resume from the full site.':'Explore the live listening dashboard on the full site.'}</p></div>{route==='/projects'?<><h2>Spencer Site — Inception</h2><p style={{marginTop:18,maxWidth:'60ch',color:'var(--muted)'}}>You’re looking at the same homepage, letter animations, background and navigation components. Open another level to go one layer deeper.</p>{depth<3?<button className="text-link" style={{margin:'24px 0',border:0,background:'none',padding:0}} onClick={()=>setNested(!nested)}>{nested?'Close inner portfolio':'Enter the next level'}</button>:<p style={{marginTop:24,color:'var(--accent-light)'}}>You’ve reached the bottom. Three levels is plenty.</p>}{nested&&<iframe title={`Portfolio level ${depth+1}`} src={`/demos/inception/index.html?depth=${depth+1}`} sandbox="allow-scripts" style={{width:'100%',height:'75vh',border:'1px solid #ca737055',borderRadius:8}}/>}</>:<p>The full site is at spencerwilford.com.</p>}</main>}<SiteFooter/></>}
const style=document.createElement('style');style.textContent=':root{--font-body:Manrope,sans-serif;--font-name:"Chakra Petch",sans-serif}body{overflow-x:hidden}';document.head.appendChild(style);
createRoot(document.getElementById('root')!).render(<App/>);
