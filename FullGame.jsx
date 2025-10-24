import React, { useRef, useEffect, useState } from "react";
const CANVAS_W = 960;
const CANVAS_H = 540;
const LANES = 3;
const LANE_X = [CANVAS_W * 0.28, CANVAS_W * 0.5, CANVAS_W * 0.72];
function lerp(a, b, t) { return a + (b - a) * t; }
export default function FullGame() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(() => Number(localStorage.getItem("osama_high") || 0));
  const [speed, setSpeed] = useState(6);
  const [gameOver, setGameOver] = useState(false);
  const stateRef = useRef({
    players: [
      { id: "A", name: "أسامة", lane: 1, x: LANE_X[1], y: 0, vy:0, jumping:false, sliding:false, hp:1, targetLane:1 },
      { id: "B", name: "ليلى", lane: 1, x: LANE_X[1], y: 0, vy:0, jumping:false, sliding:false, hp:1, targetLane:1 }
    ],
    obstacles: [], coins: [], backgroundOffset:0, spawnTimer:0, coinTimer:0
  });
  useEffect(()=>{ function keydown(e){ if (e.repeat) return; if (!running) { if (e.key==="Enter") start(); return; } if (e.key==="ArrowLeft") movePlayer("A",-1); if (e.key==="ArrowRight") movePlayer("A",1); if (e.key==="ArrowUp") jumpPlayer("A"); if (e.key==="a"||e.key==="A") movePlayer("B",-1); if (e.key==="d"||e.key==="D") movePlayer("B",1); if (e.key==="w"||e.key==="W") jumpPlayer("B"); } window.addEventListener("keydown", keydown); return ()=> window.removeEventListener("keydown", keydown); },[running]);
  useEffect(()=>{ return ()=> cancelAnimationFrame(rafRef.current); },[]);
  function resetState(){ stateRef.current = { players:[ { id: "A", name: "أسامة", lane: 1, x: LANE_X[1], y: 0, vy:0, jumping:false, sliding:false, hp:1, targetLane:1 }, { id: "B", name: "ليلى", lane: 1, x: LANE_X[1], y: 0, vy:0, jumping:false, sliding:false, hp:1, targetLane:1 } ], obstacles:[], coins:[], backgroundOffset:0, spawnTimer:0, coinTimer:0 }; setScore(0); setSpeed(6); setGameOver(false); }
  function start(){ resetState(); setRunning(true); lastRef.current = performance.now(); rafRef.current = requestAnimationFrame(loop); }
  function endGame(){ setRunning(false); setGameOver(true); if (score>high){ setHigh(score); localStorage.setItem("osama_high", String(score)); } }
  function movePlayer(id, dir){ const st = stateRef.current; const p = st.players.find(x=>x.id===id); if (!p) return; p.targetLane = Math.max(0, Math.min(LANES-1, p.targetLane + dir)); }
  function jumpPlayer(id){ const st = stateRef.current; const p = st.players.find(x=>x.id===id); if (!p) return; if (!p.jumping && !p.sliding){ p.jumping = true; p.vy = -12; } }
  function touchMoveA(dir){ if (!running) return; movePlayer("A",dir); }
  function touchJumpA(){ if (!running) return; jumpPlayer("A"); }
  function touchMoveB(dir){ if (!running) return; movePlayer("B",dir); }
  function touchJumpB(){ if (!running) return; jumpPlayer("B"); }
  function spawnObstacle(){ const st = stateRef.current; const lane = Math.floor(Math.random()*LANES); const typeRoll = Math.random(); const type = typeRoll < 0.12 ? "police" : (typeRoll < 0.55 ? "barrel" : "cone"); st.obstacles.push({ id: Date.now()+Math.random(), lane, x: CANVAS_W + 80, type }); }
  function spawnCoin(){ const st = stateRef.current; const lane = Math.floor(Math.random()*LANES); st.coins.push({ id: Date.now()+Math.random(), lane, x: CANVAS_W + 80 }); }
  function loop(now){ const dtMs = Math.min(40, now - lastRef.current); lastRef.current = now; const dt = dtMs / 16.67; const st = stateRef.current; st.backgroundOffset = (st.backgroundOffset + speed * 0.35 * dt) % CANVAS_W; st.spawnTimer += dtMs; if (st.spawnTimer > 600 - Math.min(300, (score/10)*20)){ spawnObstacle(); st.spawnTimer = 0; } st.coinTimer += dtMs; if (st.coinTimer > 420){ if (Math.random() < 0.6) spawnCoin(); st.coinTimer = 0; } for (let ob of st.obstacles){ ob.x -= speed * dt; } for (let c of st.coins){ c.x -= (speed + 1) * dt; } st.obstacles = st.obstacles.filter(o => o.x > -120); st.coins = st.coins.filter(c => c.x > -80); for (let p of st.players){ const targetX = LANE_X[p.targetLane]; p.x = lerp(p.x, targetX, 0.18 * dt); if (p.jumping){ p.vy += 0.8 * dt; p.y += p.vy * dt; if (p.y >= 0){ p.y = 0; p.vy = 0; p.jumping = false; } } } for (let ob of st.obstacles.slice()){ if (ob.x < 240 && ob.x > 120){ for (let p of st.players){ const collideLane = (ob.lane === p.targetLane); const inAir = p.jumping; if (collideLane && !inAir && p.hp>0){ p.hp = 0; ob.x = -999; setScore(s => Math.max(0, s - 5)); } } } } for (let c of st.coins.slice()){ if (c.x < 240 && c.x > 120){ for (let p of st.players){ if (c.lane === p.targetLane && !p.jumping){ setScore(s => s + 10); c.x = -999; } } } } const bothDead = st.players.every(p => p.hp <= 0); if (bothDead){ endGame(); return; } setSpeed(s => Math.min(16, s + 0.001 * dtMs)); drawFrame(st); if (running) rafRef.current = requestAnimationFrame(loop); }
  function drawFrame(st){ const c = canvasRef.current; if (!c) return; const ctx = c.getContext("2d"); ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle = "#04050a"; ctx.fillRect(0,0,c.width,c.height); const carW = 240; for (let i = -2; i < 6; i++){ const x = (i * carW) - (st.backgroundOffset % carW); ctx.fillStyle = "rgba(40,40,60,0.6)"; ctx.fillRect(x, c.height - 180, carW - 10, 120); for (let w=0; w<4; w++){ ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(x + 18 + w*50, c.height - 150, 30, 24); } } ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 4; for (let i=0;i<LANES;i++){ const lx = LANE_X[i]; ctx.beginPath(); ctx.moveTo(lx, 60); ctx.lineTo(lx, c.height - 40); ctx.stroke(); } for (let coin of st.coins){ const x = coin.x; const y = c.height - 140 + coin.lane * 16; ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(x-3, y-10, 6, 4); } for (let ob of st.obstacles){ const x = ob.x; const y = c.height - 140 + ob.lane * 16; if (ob.type === "police"){ ctx.fillStyle = "#ef4444"; ctx.fillRect(x-26, y-24, 52, 32); ctx.fillStyle = "#fff"; ctx.fillRect(x-14, y-10, 12, 6); } else if (ob.type === "barrel"){ ctx.fillStyle = "#8b5e3c"; ctx.fillRect(x-12, y-18, 24, 24); } else { ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.moveTo(x, y-18); ctx.lineTo(x-12,y+12); ctx.lineTo(x+12,y+12); ctx.fill(); } } for (let p of st.players){ const px = p.x; const py = c.height - 140 + p.lane*16 + p.y - 24; ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.beginPath(); ctx.ellipse(px, py+48, 28, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = p.id === "A" ? "#06b6d4" : "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 24, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(px-8, py-6, 4,4); ctx.fillRect(px+4, py-6, 4,4); ctx.beginPath(); ctx.arc(px, py+4, 6, 0, Math.PI); ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 2; ctx.stroke(); if (p.id==="A"){ ctx.fillStyle = "#ffd166"; ctx.fillRect(px-12, py-32, 24,8); ctx.beginPath(); ctx.moveTo(px-12, py-32); ctx.lineTo(px-6, py-40); ctx.lineTo(px, py-32); ctx.lineTo(px+6, py-40); ctx.lineTo(px+12, py-32); ctx.fill(); } else { ctx.fillStyle = "#fff"; ctx.fillRect(px+14, py-28, 6,6); } } ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "18px sans-serif"; ctx.fillText(`Score: ${score}`, 18, 30); ctx.fillText(`High: ${high}`, CANVAS_W - 140, 30); if (!running && gameOver){ ctx.fillStyle = "rgba(2,2,4,0.75)"; ctx.fillRect(0,0,c.width,c.height); ctx.fillStyle = "#fff"; ctx.font = "26px sans-serif"; ctx.textAlign = "center"; ctx.fillText("الملك أسامة والملكة ليلى سيعودان أقوى ❤️", c.width/2, c.height/2 - 20); ctx.fillStyle = "#ff3b3b"; const bw = 240, bh = 56; ctx.fillRect(c.width/2 - bw/2, c.height/2 + 4, bw, bh); ctx.fillStyle = "#fff"; ctx.font = "22px sans-serif"; ctx.fillText("🔁 إعادة اللعب", c.width/2, c.height/2 + 42); } }
  function onCanvasClick(e){ if (gameOver){ const rect = canvasRef.current.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; const cx = CANVAS_W/2, cy = CANVAS_H/2 + 4; const bw = 240, bh = 56; if (x >= cx - bw/2 && x <= cx + bw/2 && y >= cy && y <= cy + bh){ start(); } } }
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
      <div style={{display:"flex",gap:12,width:CANVAS_W,justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:700,fontSize:20}}>Osama x Lila</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div>Score: <b>{score}</b></div>
          <div style={{width:8}} />
          {!running && !gameOver && <button onClick={start} style={{padding:"8px 14px",borderRadius:10,background:"linear-gradient(180deg,#ff5f2e,#ff3b1a)",color:"#fff",fontWeight:700}}>ابدأ</button>}
        </div>
      </div>
      <div style={{position:"relative", width:CANVAS_W, maxWidth:"100%"}}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{width:"100%",borderRadius:12,boxShadow:"0 10px 40px rgba(0,0,0,0.6)"}} onClick={onCanvasClick} />
        <div style={{position:"absolute",right:18,bottom:18,display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",gap:8}}>
            <button onTouchStart={()=>touchMoveA(-1)} onMouseDown={()=>touchMoveA(-1)} style={controlStyle()}>◀ أسامة</button>
            <button onTouchStart={()=>touchJumpA()} onMouseDown={()=>touchJumpA()} style={controlStyle()}>▲ قفز</button>
            <button onTouchStart={()=>touchMoveA(1)} onMouseDown={()=>touchMoveA(1)} style={controlStyle()}>▶</button>
          </div>
          <div style={{display:"flex",gap:8, marginTop:6}}>
            <button onTouchStart={()=>touchMoveB(-1)} onMouseDown={()=>touchMoveB(-1)} style={controlStyle("#7c3aed")}>◀ ليلى</button>
            <button onTouchStart={()=>touchJumpB()} onMouseDown={()=>touchJumpB()} style={controlStyle("#7c3aed")}>▲ قفز</button>
            <button onTouchStart={()=>touchMoveB(1)} onMouseDown={()=>touchMoveB(1)} style={controlStyle("#7c3aed")}>▶</button>
          </div>
        </div>
      </div>
      <div style={{width:CANVAS_W,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <small style={{color:"#9fb3d6"}}>Controls: أسامة = ← → ↑  • ليلى = A D W  • Touch for mobile</small>
        {gameOver && <button onClick={()=>start()} style={{padding:"10px 16px",borderRadius:10,background:"linear-gradient(180deg,#ff3b3b,#ff1a1a)",color:"#fff",fontWeight:700}}>🔁 إعادة اللعب</button>}
      </div>
    </div>
  );
}
function controlStyle(bg="#ff8a65"){ return { padding: "10px 12px", borderRadius: 10, border: "none", background: bg, color: "#fff", fontWeight: 700, boxShadow: "0 6px 18px rgba(0,0,0,0.45)" } }
