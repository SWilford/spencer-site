import React from 'react';
export default function Link({href,children,prefetch,replace,scroll,...props}:any){
 const value=typeof href==='string'?href:href.pathname;
 return <a {...props} href={value.startsWith('/')?'#'+value:value}>{children}</a>;
}
