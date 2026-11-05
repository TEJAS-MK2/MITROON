(() => {
"use strict";
const $ = id => document.getElementById(id);
const canvas=$("arena"),ctx=canvas.getContext("2d");
const home=$("homeScreen"),modes=$("modeSection"),selectSection=$("selectSection"),gameSection=$("gameSection"),onlinePanel=$("onlinePanel");
let mode="cpu",running=false,roundOver=false,muted=false,socket=null,room="",playerId=0,lastSent=0,remoteState=null,keys=new Set(),lastTime=0,screenShake=0;
const floor=365,gravity=1750;
const fighters=[
 {x:230,y:floor,vx:0,vy:0,hp:100,maxHp:100,face:1,color:"#f07838",accent:"#ffc46b",name:"YOU",grounded:true,attack:0,attackType:"",cooldown:0,block:false,stun:0,energy:0},
 {x:730,y:floor,vx:0,vy:0,hp:100,maxHp:100,face:-1,color:"#3b8fc7",accent:"#a5e0ff",name:"CPU",grounded:true,attack:0,attackType:"",cooldown:0,block:false,stun:0,energy:0}
];
const input={left:false,right:false,jump:false,punch:false,kick:false,special:false,block:false};
const particles=[];
let pendingMode="cpu",selectedHero=0,selectedCpu=1,selectedStage="sansad",difficulty="normal";
const roster=[
{name:"CHAI SHASTRI",role:"THE PEOPLE'S CAMPAIGNER",initials:"CS",color:"#d9773c",accent:"#f7c56c",look:"turban",power:3,speed:3},
{name:"RALLY RANI",role:"THE CROWD CONNECTOR",initials:"RR",color:"#b94c6a",accent:"#ffb2c5",look:"scarf",power:2,speed:5},
{name:"BUDGET BABU",role:"THE POLICY MACHINE",initials:"BB",color:"#4d8b79",accent:"#a5dfc6",look:"glasses",power:5,speed:2},
{name:"KURSI KUMAR",role:"THE COALITION CRAFTER",initials:"KK",color:"#6f68a8",accent:"#c3bcff",look:"cap",power:3,speed:4},
{name:"KISAN KESARI",role:"THE FIELD MARSHAL",initials:"KI",color:"#9a813b",accent:"#f3d77b",look:"headband",power:5,speed:2},
{name:"METRO MAHARAJ",role:"THE INFRA SHOWMAN",initials:"MM",color:"#3f7f9e",accent:"#9edcf1",look:"glasses",power:3,speed:4},
{name:"MANIFESTO MASTER",role:"THE PROMISE SPECIALIST",initials:"MA",color:"#a35f9c",accent:"#e9b6e2",look:"moustache",power:4,speed:3},
{name:"JANTA JAWAN",role:"THE GRASSROOTS GUARD",initials:"JJ",color:"#65844a",accent:"#c3e49a",look:"headband",power:3,speed:5}
];
function renderRoster(){
 const grid=$("rosterGrid");grid.innerHTML="";
 roster.forEach((r,i)=>{const card=document.createElement("button");card.type="button";card.className="roster-card"+(i===selectedHero?" selected":"");card.innerHTML='<span class="pick-tag">'+(i===selectedHero?"YOUR NETA":"SELECT")+'</span><span class="roster-avatar" style="background:'+r.color+'">'+r.initials+'</span><span class="roster-name">'+r.name+'</span><span class="roster-role">'+r.role+'</span><span class="roster-stats">POWER <b>'+r.power+'</b> SPEED <b>'+r.speed+'</b></span>';card.addEventListener("click",()=>{selectedHero=i;renderRoster();});grid.appendChild(card);});
 const opponent=$("opponentSelect");opponent.innerHTML=roster.map((r,i)=>'<option value="'+i+'">'+r.name+'</option>').join("");opponent.value=String(selectedCpu);
}
function openSelect(next){pendingMode=next;home.classList.add("hidden");modes.classList.add("hidden");gameSection.classList.add("hidden");onlinePanel.classList.add("hidden");selectSection.classList.remove("hidden");renderRoster();}
function applyRosterFighter(f,character){Object.assign(f,{name:character.name,color:character.color,accent:character.accent,look:character.look,power:character.power,speed:character.speed});}
function showGame(title,sub){home.classList.add("hidden");modes.classList.add("hidden");onlinePanel.classList.add("hidden");gameSection.classList.remove("hidden");$("gameTitle").textContent=title;$("overlayTitle").textContent="READY?";$("overlayMessage").textContent=sub;$("arenaOverlay").classList.remove("hidden");}
function reset(){fighters.forEach((f,i)=>Object.assign(f,{x:i?730:230,y:floor,vx:0,vy:0,hp:100,grounded:true,attack:0,attackType:"",cooldown:0,block:false,stun:0,energy:0}));roundOver=false;running=false;remoteState=null;updateHud();}
function updateHud(){$("leftHealth").style.width=fighters[0].hp+"%";$("rightHealth").style.width=fighters[1].hp+"%";}
function setMode(next){
 mode=next;if(next==="cpu")playerId=0;reset();
 selectedCpu=Number($("opponentSelect").value||selectedCpu);
 selectedStage=$("stageSelect").value;difficulty=$("difficultySelect").value;
 const localIndex=next==="online"&&playerId===2?1:0;
 applyRosterFighter(fighters[localIndex],roster[selectedHero]);
 if(next==="cpu")applyRosterFighter(fighters[1],roster[selectedCpu]);
 $("leftName").textContent=roster[selectedHero].name;
 $("rightName").textContent=next==="cpu"?roster[selectedCpu].name:"FRIEND";
 $("connectionStatus").innerHTML=next==="cpu"?'<span class="live-dot"></span> LOCAL MATCH':'<span class="live-dot"></span> PRIVATE ROOM';
 selectSection.classList.add("hidden");
 showGame(next==="cpu"?"CPU CHALLENGE":"FRIEND DUEL",next==="cpu"?"A challenger approaches.":"Your friend is in the arena.");
}
function setInput(k,on){if(k==="a")input.left=on;if(k==="d")input.right=on;if(k==="w")input.jump=on;if(k==="j")input.punch=on;if(k==="k")input.kick=on;if(k==="l")input.special=on;if(k==="s")input.block=on;}
function attack(f,type){if(f.cooldown>0||f.stun>0||f.attack>0)return;f.attack=type==="special"?.42:.25;f.attackType=type;f.cooldown=type==="special"?.9:.42;if(type==="special")f.energy=0;else f.energy=Math.min(100,f.energy+22);}
function damage(attacker,target,type){const range=type==="special"?145:type==="kick"?110:88;if(Math.abs(attacker.x-target.x)>range||Math.abs(attacker.y-target.y)>90)return;if(target.block){target.hp=Math.max(0,target.hp-(type==="special"?5:2));target.stun=.06;spawn(target.x,target.y-65,"#a9d7f2",5);return;}const amount=Math.round((type==="special"?24:type==="kick"?13:8)*(attacker.power||3)/3);target.hp=Math.max(0,target.hp-amount);target.stun=.18;target.vx=attacker.face*(type==="special"?460:240);target.vy=type==="special"?-230:-80;screenShake=type==="special"?13:6;spawn(target.x,target.y-75,type==="special"?"#ffbe55":"#f4e6d0",type==="special"?24:10);updateHud();if(target.hp<=0)finish(attacker);}
function finish(winner){if(roundOver)return;roundOver=true;running=false;const localWinner=winner===fighters[playerId===2?1:0];$("overlayTitle").textContent=localWinner?"YOU WIN!":"KNOCKED OUT";$("overlayMessage").textContent=localWinner?"The gully has a new champion.":"Run it back. Champions are made in rematches."; $("startFight").textContent="REMATCH";$("arenaOverlay").classList.remove("hidden");}
function spawn(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*420,vy:(Math.random()-.8)*-350,life:.35+Math.random()*.45,color,size:2+Math.random()*5});}
function cpuThink(f,enemy,dt){const d=enemy.x-f.x,ad=Math.abs(d),skill=difficulty==="easy"?.65:difficulty==="hard"?1.5:1;f.block=ad<105&&Math.random()<.012*skill;if(ad>105){f.vx=Math.sign(d)*115*(f.speed||3)/3*skill;if(Math.random()<.003*skill)f.vy=-540;}else{f.vx=0;if(Math.random()<.014*skill)attack(f,Math.random()<.3&&f.energy>=70?"special":Math.random()<.55?"kick":"punch");}}
function updateFighter(f,other,dt,local){f.cooldown=Math.max(0,f.cooldown-dt);f.attack=Math.max(0,f.attack-dt);f.stun=Math.max(0,f.stun-dt);if(f.stun<=0){if(local){f.block=input.block;f.vx=(input.right?1:0)-(input.left?1:0);f.vx*=235*(f.speed||3)/3;if(input.jump&&f.grounded){f.vy=-610;f.grounded=false;}if(input.punch)attack(f,"punch");if(input.kick)attack(f,"kick");if(input.special&&f.energy>=70)attack(f,"special");}else if(mode==="cpu")cpuThink(f,other,dt);else if(remoteState){f.x+=(remoteState.x-f.x)*Math.min(1,dt*15);f.y+=(remoteState.y-f.y)*Math.min(1,dt*15);f.hp=remoteState.hp;updateHud();if(f.hp<=0)finish(other);if(Number.isInteger(remoteState.characterIndex)&&roster[remoteState.characterIndex])applyRosterFighter(f,roster[remoteState.characterIndex]);f.block=remoteState.block;f.attack=remoteState.attack;f.attackType=remoteState.attackType;f.face=remoteState.face;}}
if(f.attack>0&&f.attackType&&!f.hitDone){f.hitDone=true;damage(f,other,f.attackType);}if(f.attack<=0)f.hitDone=false;
if(!(mode==="online"&&!local&&remoteState)){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=gravity*dt;if(f.y>=floor){f.y=floor;f.vy=0;f.grounded=true;}}f.x=Math.max(65,Math.min(895,f.x));if(local||mode==="cpu")f.face=other.x>f.x?1:-1;
}
function drawFighter(f){const x=f.x,y=f.y;ctx.save();ctx.translate(x,y);ctx.scale(f.face,1);ctx.fillStyle="#0008";ctx.beginPath();ctx.ellipse(0,3,48,9,0,0,Math.PI*2);ctx.fill();ctx.translate(0,f.grounded?0:Math.sin(performance.now()/75)*2);
ctx.fillStyle=f.accent;ctx.fillRect(-25,-154,50,12);ctx.fillStyle="#171a22";ctx.fillRect(-23,-143,46,11);
ctx.fillStyle="#a96c4d";ctx.beginPath();ctx.roundRect(-19,-190,38,43,10);ctx.fill();
if(f.look==="turban"){ctx.fillStyle=f.accent;ctx.beginPath();ctx.roundRect(-24,-199,48,18,8);ctx.fill();ctx.fillRect(-23,-187,46,7);}
if(f.look==="cap"){ctx.fillStyle=f.accent;ctx.fillRect(-23,-198,46,10);ctx.fillRect(-27,-190,54,5);}
if(f.look==="headband"){ctx.fillStyle=f.accent;ctx.fillRect(-22,-182,44,7);}
if(f.look==="scarf"){ctx.fillStyle=f.accent;ctx.fillRect(-29,-144,58,13);ctx.fillRect(19,-138,12,54);}
if(f.look==="glasses"){ctx.strokeStyle="#171a20";ctx.lineWidth=3;ctx.strokeRect(-17,-178,14,10);ctx.strokeRect(3,-178,14,10);ctx.beginPath();ctx.moveTo(-3,-174);ctx.lineTo(3,-174);ctx.stroke();}
if(f.look==="moustache"){ctx.fillStyle="#211a18";ctx.beginPath();ctx.ellipse(0,-153,12,4,0,0,Math.PI*2);ctx.fill();}
ctx.fillStyle="#191d26";ctx.fillRect(-21,-179,42,10);ctx.fillStyle="#fff";ctx.fillRect(7,-175,5,4);
ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(-27,-145);ctx.lineTo(27,-145);ctx.lineTo(35,-77);ctx.lineTo(-35,-77);ctx.closePath();ctx.fill();
ctx.fillStyle=f.accent;ctx.fillRect(-29,-91,58,9);
ctx.strokeStyle="#a96c4d";ctx.lineWidth=16;ctx.lineCap="round";
ctx.beginPath();ctx.moveTo(-24,-134);ctx.lineTo(-43,-99);ctx.stroke();
ctx.beginPath();ctx.moveTo(24,-134);ctx.lineTo(f.attack>0?65:38,-(f.attack>0?118:99));ctx.stroke();
ctx.fillStyle="#222b3a";ctx.fillRect(-25,-78,21,58);ctx.fillRect(5,-78,21,58);
ctx.fillStyle="#f2e8d9";ctx.fillRect(-30,-22,32,10);ctx.fillRect(3,-22,32,10);
if(f.block){ctx.strokeStyle="#9bdcff";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-110,62,-1.4,1.4);ctx.stroke();}
if(f.attack>0){ctx.strokeStyle=f.attackType==="special"?"#ffc45b":"#fff0d0";ctx.lineWidth=f.attackType==="special"?9:5;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(55,-120, f.attackType==="special"?75:48,-.9,.7);ctx.stroke();}
ctx.restore();}
function draw(){ctx.clearRect(0,0,960,440);const sky=ctx.createLinearGradient(0,0,0,440);sky.addColorStop(0,"#1d2637");sky.addColorStop(1,"#352b31");ctx.fillStyle=sky;ctx.fillRect(0,0,960,440);
ctx.fillStyle="#ff9a53";ctx.globalAlpha=.16;ctx.beginPath();ctx.arc(480,150,105,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
for(let i=0;i<9;i++){let bx=i*120;ctx.fillStyle=i%2?"#252b39":"#202633";ctx.fillRect(bx,140+(i%3)*18,85,220);ctx.fillStyle="#e7a75b";ctx.globalAlpha=.18;ctx.fillRect(bx+15,165+(i%3)*18,9,25);ctx.fillRect(bx+48,165+(i%3)*18,9,25);ctx.globalAlpha=1;}
ctx.fillStyle="#20242e";ctx.fillRect(0,330,960,110);ctx.strokeStyle="#566071";ctx.globalAlpha=.35;for(let i=-2;i<12;i++){ctx.beginPath();ctx.moveTo(480,330);ctx.lineTo(i*110,440);ctx.stroke();}ctx.beginPath();ctx.moveTo(0,365);ctx.lineTo(960,365);ctx.stroke();ctx.globalAlpha=1;
ctx.fillStyle="#ffbd74";ctx.font="800 11px DM Sans";ctx.fillText("MITROON FIGHT NIGHT",28,35);ctx.fillStyle="#9aa6b8";ctx.font="700 9px DM Sans";ctx.fillText(selectedStage==="sansad"?"SANSAD • NEW DELHI":selectedStage==="jantar"?"JANTAR MANTAR • DELHI":"DESI GULLY • KOLKATA",28,52);
drawFighter(fighters[0]);drawFighter(fighters[1]);
particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);});ctx.globalAlpha=1;
}
function loop(t){const dt=Math.min(.032,(t-lastTime)/1000||0);lastTime=t;if(running){const localIndex=mode==="online"&&playerId===2?1:0,remoteIndex=1-localIndex;updateFighter(fighters[localIndex],fighters[remoteIndex],dt,true);if(mode==="cpu")updateFighter(fighters[1],fighters[0],dt,false);else if(mode==="online"&&remoteState)updateFighter(fighters[remoteIndex],fighters[localIndex],dt,false);if(mode==="online"&&socket?.readyState===1&&t-lastSent>45){const own=fighters[localIndex];socket.send(JSON.stringify({type:"state",room,playerId,state:{x:own.x,y:own.y,hp:own.hp,block:own.block,attack:own.attack,attackType:own.attackType,face:own.face,characterIndex:selectedHero}}));lastSent=t;}}
particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=900*dt;p.life-=dt;});for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);if(screenShake>0)screenShake=Math.max(0,screenShake-dt*30);draw();requestAnimationFrame(loop);}
function start(){if(mode==="online"&&!socket){$("overlayMessage").textContent="Connect to a multiplayer server first.";return;}running=true;roundOver=false;$("arenaOverlay").classList.add("hidden");$("startFight").textContent="START FIGHT";}
function connect(action){const url=$("serverUrl").value.trim();if(!url){$("roomFeedback").textContent="Add your multiplayer server URL first.";return;}try{socket=new WebSocket(url);}catch(e){$("roomFeedback").textContent="That server URL doesn't look right.";return;}
$("roomFeedback").textContent="Connecting to MITROON server…";
socket.onopen=()=>socket.send(JSON.stringify({type:action,room:$("roomCode").value.trim().toUpperCase()}));
socket.onmessage=e=>{let msg;try{msg=JSON.parse(e.data)}catch{return;}if(msg.type==="created"||msg.type==="joined"){room=msg.room;playerId=msg.playerId;mode="online";$("roomCode").value=room;$("roomFeedback").textContent=(msg.type==="created"?"Room created.":"Joined room.")+" Share code "+room+" with your friend.";openSelect("online");$("connectionStatus").innerHTML='<span class="live-dot"></span> ONLINE • ROOM '+room;}
if(msg.type==="peer-joined")$("roomFeedback").textContent="Your mitroon joined. Start the fight!";
if(msg.type==="state"&&msg.playerId!==playerId)remoteState=msg.state;
if(msg.type==="error")$("roomFeedback").textContent=msg.message;
if(msg.type==="peer-left")$("connectionStatus").textContent="OPPONENT DISCONNECTED";
};
socket.onerror=()=>{$("roomFeedback").textContent="Couldn't connect. Check the server URL and try again.";};
socket.onclose=()=>{if(mode==="online"&&running){running=false;$("arenaOverlay").classList.remove("hidden");$("overlayTitle").textContent="CONNECTION LOST";$("overlayMessage").textContent="The connection closed. Return to the lobby and reconnect.";}}
}
$("playCpu").onclick=()=>openSelect("cpu");$("cpuCardButton").onclick=()=>openSelect("cpu");$("openOnline").onclick=()=>onlinePanel.classList.remove("hidden");$("onlineCardButton").onclick=()=>onlinePanel.classList.remove("hidden");$("closeOnline").onclick=()=>onlinePanel.classList.add("hidden");$("createRoom").onclick=()=>connect("create");$("joinRoom").onclick=()=>connect("join");$("startFight").onclick=start;
$("confirmFight").onclick=()=>setMode(pendingMode);
$("cancelSelect").onclick=()=>{selectSection.classList.add("hidden");home.classList.remove("hidden");modes.classList.remove("hidden");};
$("backHome").onclick=()=>{running=false;if(socket){socket.close();socket=null;}gameSection.classList.add("hidden");selectSection.classList.add("hidden");home.classList.remove("hidden");modes.classList.remove("hidden");};
$("soundToggle").onclick=()=>{muted=!muted;$("soundToggle").textContent="SOUND: "+(muted?"OFF":"ON");};
window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["a","d","w","s","j","k","l"," "].includes(k))e.preventDefault();keys.add(k);setInput(k,true);});
window.addEventListener("keyup",e=>{const k=e.key.toLowerCase();keys.delete(k);setInput(k,false);});
document.querySelectorAll("[data-key]").forEach(b=>{const k=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();setInput(k,true);});["pointerup","pointerleave","pointercancel"].forEach(ev=>b.addEventListener(ev,e=>{e.preventDefault();setInput(k,false);}));});
document.addEventListener("visibilitychange",()=>{if(document.hidden){Object.keys(input).forEach(k=>input[k]=false);}});
requestAnimationFrame(loop);
})();