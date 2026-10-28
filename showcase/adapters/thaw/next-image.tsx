import React from 'react';
export default function Image({src,priority,fill,sizes,...props}:any){return <img {...props} src={typeof src==='string'&&src.startsWith('/')?'/demos/thaw'+src:src} style={fill?{width:'100%',height:'100%',objectFit:'cover'}:props.style} loading={priority?'eager':'lazy'}/>;}
