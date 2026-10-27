import { ImageResponse } from "next/og";
export const alt = "Spencer Wilford — JMU Computer Science, software engineering, projects and music";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{display:"flex",width:"100%",height:"100%",background:"#202022",color:"#ede8e8",padding:"78px",flexDirection:"column",justifyContent:"center",borderBottom:"8px solid #ca7370"}}>
    <div style={{display:"flex",fontSize:88,fontWeight:700,letterSpacing:-3}}>Spencer Wilford</div>
    <div style={{display:"flex",marginTop:24,fontSize:30,color:"#df8a85"}}>CS @ JMU | Prev. SWE at NSWCDD, NGA</div>
    <div style={{display:"flex",marginTop:72,fontSize:24,color:"#b8b0b0"}}>Software engineering · Projects · Music</div>
    <div style={{display:"flex",marginTop:20,fontSize:22,color:"#df8a85"}}>spencerwilford.com</div>
  </div>, size);
}
