import React, { useEffect, useRef, useState } from "react";
import FullGame from "./game/FullGame.jsx";
import characters from "./assets/sprites/osama_lila_characters.png";
import menuTheme from "./assets/music/menu_theme.wav";
import kingVoice from "./assets/music/king_voice.wav";
import i18n_en from "./i18n/en.json";
import i18n_ar from "./i18n/ar.json";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

i18next.use(initReactI18next).init({
  resources: { en: { translation: i18n_en }, ar: { translation: i18n_ar } },
  lng: (localStorage.getItem("lang") || (navigator.language && navigator.language.startsWith("ar") ? "ar" : "en")),
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default function App(){
  const [stage, setStage] = useState("intro");
  const audioRef = useRef({});
  const [soundOn, setSoundOn] = useState(true);
  useEffect(()=>{
    audioRef.current.menu = new Audio(menuTheme);
    audioRef.current.king = new Audio(kingVoice);
    audioRef.current.menu.loop = true;
    audioRef.current.menu.volume = 0.6;
    if(soundOn) audioRef.current.king.play().catch(()=>{});
    const t = setTimeout(()=>{ setStage("menu"); if(soundOn) audioRef.current.menu.play().catch(()=>{}); },7000);
    return ()=>{ clearTimeout(t); Object.values(audioRef.current).forEach(a=>a.pause()); }
  },[]);

  return (
    <div className="container">
      {stage==="intro" && <div className="card" style={{height:420,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 40%, rgba(80,30,120,0.12), transparent 30%), linear-gradient(180deg, rgba(0,0,0,0.6), transparent 40%)"}} />
        <div style={{position:"absolute",left:20,top:60,opacity:0.95}}>🦇</div>
        <div style={{position:"absolute",right:40,top:30,opacity:0.95}}>🦇</div>
        <div style={{fontSize:80,color:"#ffd166",textShadow:"0 6px 30px rgba(255,200,80,0.2)",transform:"rotateY(10deg)"}}>👑</div>
        <div style={{position:"absolute",bottom:40,left:"10%",right:"10%",height:6,background:"linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))",borderRadius:8,overflow:"hidden"}}>
          <div style={{width:"30%",height:"100%",background:"linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.9), rgba(255,255,255,0.0))",transform:"translateX(-120%)",animation:"sweep 6s linear forwards"}} />
        </div>
        <style>{`@keyframes sweep{ to { transform: translateX(220%);} }`}</style>
      </div>}

      {stage==="menu" && <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h1>Osama x Lila</h1><div><button className="btn" onClick={()=>setStage("play")}>Play</button></div></div>
      <div style={{marginTop:12}} className="card"><div style={{display:"flex",gap:18,alignItems:"center"}}><img src={characters} style={{width:160,borderRadius:10}} alt="chars"/><div><h2>Osama x Lila — Royal Subway Love</h2><p className="small">Escape the royal guards with love and style.</p></div></div></div></div>}

      {stage==="play" && <div><FullGame /></div>}
    </div>
  );
}
