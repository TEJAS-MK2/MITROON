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
let roundWins=[0,0],roundNumber=1,matchComplete=false,tournamentActive=false,tournamentOpponents=[],tournamentIndex=0;
const SCORE_KEY="mitroon-leaderboard-v1";
function loadScores(){try{return JSON.parse(localStorage.getItem(SCORE_KEY)||"[]").filter(x=>x&&typeof x.name==="string"&&Number.isFinite(x.wins)&&Number.isFinite(x.losses));}catch{return [];}}
function saveResult(won,tournament=false){const scores=loadScores(),name=roster[selectedHero].name;let row=scores.find(x=>x.name===name);if(!row){row={name,wins:0,losses:0,tournaments:0};scores.push(row);}if(won)row.wins++;else row.losses++;if(tournament&&won)row.tournaments=(row.tournaments||0)+1;scores.sort((a,b)=>b.tournaments-a.tournaments||b.wins-a.wins||a.losses-b.losses);try{localStorage.setItem(SCORE_KEY,JSON.stringify(scores.slice(0,10)));}catch{}renderLeaderboard();}
function renderLeaderboard(){const el=$("leaderboardList");if(!el)return;const rows=loadScores();el.innerHTML=rows.length?rows.map((x,i)=>`<div class="leader-row"><b>${i+1}. ${escapeText(x.name)}</b><span>${x.wins} W · ${x.losses} L · ${x.tournaments||0} cups</span></div>`).join(""):'<p class="leader-empty">No records yet. Win your first match to claim the board.</p>';}
function escapeText(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function updateScoreboard(){$("roundScore").textContent=`${roundWins[0]} — ${roundWins[1]}`;$("roundNumber").textContent=String(roundNumber).padStart(2,"0");}
const roster=[
{name:"NARENDRA MODI",party:"BJP",role:"PRIME-TIME CAMPAIGNER",initials:"NM",color:"#d9773c",accent:"#f7c56c",look:"white-beard",special:"VIKAS VOLT",power:3,speed:3},
{name:"AMIT SHAH",party:"BJP",role:"ORGANISATION STRATEGIST",initials:"AS",color:"#4d8b79",accent:"#a5dfc6",look:"bald-glasses",special:"ORGANISATION GRID",power:4,speed:2},
{name:"YOGI ADITYANATH",party:"BJP",role:"SAFFRON-ROBED CHALLENGER",initials:"YA",color:"#b66a2c",accent:"#ffd28a",look:"shaved-saffron",special:"SAFFRON SURGE",power:4,speed:3},
{name:"RAHUL GANDHI",party:"INC",role:"WHITE-TEE ROAD WARRIOR",initials:"RG",color:"#477fba",accent:"#b8dfff",look:"white-tee-beard",special:"PADYATRA PULSE",power:3,speed:4},
{name:"MAMATA BANERJEE",party:"AITC",role:"BENGAL STREET FIGHTER",initials:"MB",color:"#4f9b8a",accent:"#d9f2e8",look:"white-sari",special:"BENGAL BOUNCE",power:2,speed:5},
{name:"ARVIND KEJRIWAL",party:"AAP",role:"MUFFLER-WEARING DEBATER",initials:"AK",color:"#b94c6a",accent:"#ffb2c5",look:"muffler-glasses",special:"MUFFLER CYCLONE",power:3,speed:4},
{name:"AKHILESH YADAV",party:"SP",role:"RED-CAP PLAYMAKER",initials:"AY",color:"#a94343",accent:"#f2b0a8",look:"red-cap",special:"RED-CAP RUSH",power:3,speed:4},
{name:"M. K. STALIN",party:"DMK",role:"DARK-GLASSES VETERAN",initials:"MK",color:"#6f68a8",accent:"#c3bcff",look:"dark-glasses",special:"DRAVIDA DRIVE",power:4,speed:3}

,{name:"PRIYANKA GANDHI",party:"INC",role:"CAMPAIGN TRAILBLAZER",initials:"PG",color:"#347eaa",accent:"#b8dfff",look:"green-shawl",special:"JAN-SAMVAD SPARK",power:3,speed:4}
,{name:"MALLIKARJUN KHARGE",party:"INC",role:"VETERAN FLOOR GENERAL",initials:"MK",color:"#765b48",accent:"#e5c6a2",look:"grey-hair",special:"HOUSE OF DEBATE",power:4,speed:2}
,{name:"PINARAYI VIJAYAN",party:"CPI(M)",role:"KERALA'S STEADY OPERATOR",initials:"PV",color:"#b84a4a",accent:"#f0b0a6",look:"spectacles",special:"RED-FLAG RHYTHM",power:4,speed:2}
,{name:"UDDHAV THACKERAY",party:"SHIV SENA (UBT)",role:"MAHARASHTRA'S SILENT STRATEGIST",initials:"UT",color:"#668b73",accent:"#c2e0c8",look:"black-glasses",special:"MATOSHREE MOMENTUM",power:3,speed:3}
,{name:"DEVENDRA FADNAVIS",party:"BJP",role:"MAHARASHTRA'S QUICK PLANNER",initials:"DF",color:"#397c68",accent:"#a9dfc5",look:"spectacles",special:"MANTRALAYA MANEUVER",power:3,speed:4}
,{name:"NITISH KUMAR",party:"JD(U)",role:"BIHAR'S SEASONED NAVIGATOR",initials:"NK",color:"#6d91a9",accent:"#c5dce8",look:"white-kurta",special:"PALATU PIVOT",power:2,speed:4}
,{name:"N. CHANDRABABU NAIDU",party:"TDP",role:"TECH-FOCUSED CAMPAIGNER",initials:"CN",color:"#9a8b43",accent:"#f0dc83",look:"grey-hair",special:"AMARAVATI ACCELERATOR",power:3,speed:4}
,{name:"HEMANT SOREN",party:"JMM",role:"JHARKHAND'S GROUNDED CAMPAIGNER",initials:"HS",color:"#397b55",accent:"#a9dfb8",look:"regional-scarf",special:"JUNGLE JOSH",power:3,speed:4}
];
function renderRoster(){
 const grid=$("rosterGrid");grid.innerHTML="";
 roster.forEach((r,i)=>{const card=document.createElement("button");card.type="button";card.className="roster-card"+(i===selectedHero?" selected":"");card.innerHTML='<span class="pick-tag">'+(i===selectedHero?"YOUR NETA":"SELECT")+'</span><span class="roster-avatar" style="background:'+r.color+'">'+r.initials+'</span><span class="roster-name">'+r.name+'</span><span class="roster-party">'+r.party+'</span><span class="roster-role">'+r.role+'</span><span class="roster-special">SIGNATURE · '+r.special+'</span><span class="roster-stats">POWER <b>'+r.power+'</b> SPEED <b>'+r.speed+'</b></span>';card.addEventListener("click",()=>{selectedHero=i;renderRoster();});grid.appendChild(card);});
 const opponent=$("opponentSelect");opponent.innerHTML=roster.map((r,i)=>'<option value="'+i+'">'+r.name+'</option>').join("");opponent.value=String(selectedCpu);
}
function openSelect(next){pendingMode=next;home.classList.add("hidden");modes.classList.add("hidden");gameSection.classList.add("hidden");onlinePanel.classList.add("hidden");selectSection.classList.remove("hidden");renderRoster();}
function applyRosterFighter(f,character){Object.assign(f,{name:character.name,color:character.color,accent:character.accent,look:character.look,special:character.special,power:character.power,speed:character.speed});}
function showGame(title,sub){home.classList.add("hidden");modes.classList.add("hidden");onlinePanel.classList.add("hidden");gameSection.classList.remove("hidden");$("gameTitle").textContent=title;$("overlayTitle").textContent="READY?";$("overlayMessage").textContent=sub;$("arenaOverlay").classList.remove("hidden");}
function reset(){fighters.forEach((f,i)=>Object.assign(f,{x:i?730:230,y:floor,vx:0,vy:0,hp:100,grounded:true,attack:0,attackType:"",cooldown:0,block:false,stun:0,energy:0,celebrate:false}));roundOver=false;running=false;matchComplete=false;roundWins=[0,0];roundNumber=1;remoteState=null;updateHud();updateScoreboard();}
function updateHud(){$("leftHealth").style.width=fighters[0].hp+"%";$("rightHealth").style.width=fighters[1].hp+"%";}
function setMode(next){
 mode=next==="tournament"?"cpu":next;if(next==="cpu"||next==="tournament")playerId=0;reset();
 tournamentActive=next==="tournament";tournamentIndex=0;tournamentOpponents=roster.map((_,i)=>i).filter(i=>i!==selectedHero);
 selectedCpu=Number($("opponentSelect").value||selectedCpu);
 selectedStage=$("stageSelect").value;difficulty=$("difficultySelect").value;
 const localIndex=next==="online"&&playerId===2?1:0;
 applyRosterFighter(fighters[localIndex],roster[selectedHero]);
 if(next==="cpu")applyRosterFighter(fighters[1],roster[selectedCpu]);else if(next==="tournament")applyRosterFighter(fighters[1],roster[tournamentOpponents[tournamentIndex]]);
 $("leftName").textContent=roster[selectedHero].name;
 $("rightName").textContent=next==="online"?"FRIEND":next==="tournament"?roster[tournamentOpponents[0]].name:roster[selectedCpu].name;
 $("connectionStatus").innerHTML=next==="tournament"?'<span class="live-dot"></span> TOURNAMENT RUN':next==="cpu"?'<span class="live-dot"></span> LOCAL MATCH':'<span class="live-dot"></span> PRIVATE ROOM';
 selectSection.classList.add("hidden");
 showGame(next==="tournament"?"TOURNAMENT RUN":next==="cpu"?"CPU CHALLENGE":"FRIEND DUEL",next==="tournament"?"Defeat every rival and claim the cup.":next==="cpu"?"A challenger approaches.":"Your friend is in the arena.");
}
function setInput(k,on){if(k==="a")input.left=on;if(k==="d")input.right=on;if(k==="w")input.jump=on;if(k==="j")input.punch=on;if(k==="k")input.kick=on;if(k==="l")input.special=on;if(k==="s")input.block=on;}
function attack(f,type){if(f.cooldown>0||f.stun>0||f.attack>0)return;f.attack=type==="special"?.42:.25;f.attackType=type;f.cooldown=type==="special"?.9:.42;if(type==="special")f.energy=0;else f.energy=Math.min(100,f.energy+22);}
function damage(attacker,target,type){const range=type==="special"?145:type==="kick"?110:88;if(Math.abs(attacker.x-target.x)>range||Math.abs(attacker.y-target.y)>90)return;if(target.block){target.hp=Math.max(0,target.hp-(type==="special"?5:2));target.stun=.06;spawn(target.x,target.y-65,"#a9d7f2",5);return;}const amount=Math.round((type==="special"?24:type==="kick"?13:8)*(attacker.power||3)/3);target.hp=Math.max(0,target.hp-amount);target.stun=.18;target.vx=attacker.face*(type==="special"?460:240);target.vy=type==="special"?-230:-80;screenShake=type==="special"?13:6;spawn(target.x,target.y-75,type==="special"?"#ffbe55":"#f4e6d0",type==="special"?24:10);updateHud();if(target.hp<=0)finish(attacker);}
function finish(winner){if(roundOver)return;roundOver=true;running=false;fighters.forEach(f=>f.celebrate=f===winner);const localIndex=playerId===2?1:0,localWinner=winner===fighters[localIndex];if(localWinner)roundWins[localIndex]++;else roundWins[1-localIndex]++;updateScoreboard();if(roundWins[localIndex]>=2||roundWins[1-localIndex]>=2){matchComplete=true;const won=roundWins[localIndex]>=2;saveResult(won,false);$("overlayTitle").textContent=won?"MATCH WON!":"MATCH LOST";$("overlayMessage").textContent=won?"Two rounds secured. You own this arena.":"That one got away. Reset, adapt and run it back.";if(tournamentActive&&won){$("overlayMessage").textContent="Match secured. One step closer to the MITROON cup.";}$("startFight").textContent=tournamentActive&&won?"NEXT RIVAL":"REMATCH";}else{$("overlayTitle").textContent=localWinner?"ROUND WON!":"ROUND LOST";$("overlayMessage").textContent=`Round ${roundNumber} complete. First to two rounds takes the match.`;$("startFight").textContent="NEXT ROUND";}$("arenaOverlay").classList.remove("hidden");}
function spawn(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*420,vy:(Math.random()-.8)*-350,life:.35+Math.random()*.45,color,size:2+Math.random()*5});}
function cpuThink(f,enemy,dt){const d=enemy.x-f.x,ad=Math.abs(d),skill=difficulty==="easy"?.65:difficulty==="hard"?1.5:1;f.block=ad<105&&Math.random()<.012*skill;if(ad>105){f.vx=Math.sign(d)*115*(f.speed||3)/3*skill;if(Math.random()<.003*skill)f.vy=-540;}else{f.vx=0;if(Math.random()<.014*skill)attack(f,Math.random()<.3&&f.energy>=70?"special":Math.random()<.55?"kick":"punch");}}
function updateFighter(f,other,dt,local){f.cooldown=Math.max(0,f.cooldown-dt);f.attack=Math.max(0,f.attack-dt);f.stun=Math.max(0,f.stun-dt);if(f.stun<=0){if(local){f.block=input.block;f.vx=(input.right?1:0)-(input.left?1:0);f.vx*=235*(f.speed||3)/3;if(input.jump&&f.grounded){f.vy=-610;f.grounded=false;}if(input.punch)attack(f,"punch");if(input.kick)attack(f,"kick");if(input.special&&f.energy>=70)attack(f,"special");}else if(mode==="cpu")cpuThink(f,other,dt);else if(remoteState){f.x+=(remoteState.x-f.x)*Math.min(1,dt*15);f.y+=(remoteState.y-f.y)*Math.min(1,dt*15);f.hp=remoteState.hp;updateHud();if(f.hp<=0)finish(other);if(Number.isInteger(remoteState.characterIndex)&&roster[remoteState.characterIndex])applyRosterFighter(f,roster[remoteState.characterIndex]);f.block=remoteState.block;f.attack=remoteState.attack;f.attackType=remoteState.attackType;f.face=remoteState.face;}}
if(f.attack>0&&f.attackType&&!f.hitDone){f.hitDone=true;damage(f,other,f.attackType);}if(f.attack<=0)f.hitDone=false;
if(!(mode==="online"&&!local&&remoteState)){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=gravity*dt;if(f.y>=floor){f.y=floor;f.vy=0;f.grounded=true;}}f.x=Math.max(65,Math.min(895,f.x));if(local||mode==="cpu")f.face=other.x>f.x?1:-1;
}
function drawFighter(f){
 const t=performance.now()/1000, bob=f.grounded?Math.sin(t*7+(f.x%13))*2:Math.sin(t*18)*4;
 const celebrating=!!f.celebrate, attacking=f.attack>0, special=attacking&&f.attackType==="special";
 const attackFrame=attacking?Math.min(3,Math.floor((1-f.attack/(special?.42:.25))*4)):0;
 const attackReach=[44,58,78,56][attackFrame],attackLift=[-104,-132,-158,-124][attackFrame];
 const victoryFrame=Math.floor(t*5)%4,victoryLift=[-172,-194,-208,-188][victoryFrame];
 const walkFrame=Math.floor(t*10)%4,walkStride=[-5,0,5,0][walkFrame];
 ctx.save();ctx.translate(f.x,f.y+bob);ctx.scale(f.face||1,1);
 // Ground shadow and character silhouette
 ctx.fillStyle="#0009";ctx.beginPath();ctx.ellipse(0,3,48,9,0,0,Math.PI*2);ctx.fill();
 if(celebrating){ctx.translate(0,-Math.abs(Math.sin(t*5))*5);}
 // Legs with a small fighting stance
 const stride=running&&!roundOver?walkStride:0;
 ctx.fillStyle="#202a3a";ctx.beginPath();ctx.roundRect(-25,-82+stride,21,62,8);ctx.roundRect(5,-82-stride,21,62,8);ctx.fill();
 ctx.fillStyle="#eee7da";ctx.beginPath();ctx.roundRect(-31,-25+stride,34,12,5);ctx.roundRect(2,-25-stride,34,12,5);ctx.fill();
 // Torso and party-neutral costume accents
 ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(-28,-148);ctx.quadraticCurveTo(0,-158,28,-148);ctx.lineTo(36,-78);ctx.quadraticCurveTo(0,-67,-36,-78);ctx.closePath();ctx.fill();
 ctx.fillStyle=f.accent;ctx.beginPath();ctx.moveTo(-27,-93);ctx.lineTo(27,-93);ctx.lineTo(31,-82);ctx.lineTo(-31,-82);ctx.closePath();ctx.fill();
 // Outfit-specific silhouettes
 if(f.look==="white-tee-beard"){ctx.fillStyle="#f4f1e9";ctx.beginPath();ctx.moveTo(-28,-148);ctx.lineTo(28,-148);ctx.lineTo(36,-78);ctx.lineTo(-36,-78);ctx.closePath();ctx.fill();ctx.strokeStyle="#d9d5cc";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-143);ctx.lineTo(0,-82);ctx.stroke();}
 if(f.look==="white-sari"){ctx.fillStyle="#f7f2e8";ctx.beginPath();ctx.moveTo(-28,-148);ctx.lineTo(28,-148);ctx.lineTo(36,-78);ctx.lineTo(-36,-78);ctx.closePath();ctx.fill();ctx.strokeStyle="#27977a";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-27,-145);ctx.lineTo(25,-86);ctx.stroke();ctx.fillStyle="#27977a";ctx.fillRect(-29,-91,58,4);}
 if(f.look==="shaved-saffron"){ctx.fillStyle="#ef9d27";ctx.beginPath();ctx.moveTo(-28,-148);ctx.lineTo(28,-148);ctx.lineTo(36,-78);ctx.lineTo(-36,-78);ctx.closePath();ctx.fill();ctx.fillStyle="#ffd28a";ctx.fillRect(-5,-192,10,14);}
 if(f.look==="muffler-glasses"){ctx.fillStyle="#dce0e4";ctx.beginPath();ctx.moveTo(-28,-145);ctx.lineTo(28,-145);ctx.lineTo(31,-130);ctx.lineTo(-31,-130);ctx.closePath();ctx.fill();ctx.fillRect(18,-133,12,50);}
 if(f.look==="green-shawl"||f.look==="regional-scarf"){ctx.strokeStyle=f.accent;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-24,-145);ctx.lineTo(20,-82);ctx.stroke();ctx.fillStyle=f.accent;ctx.fillRect(-29,-91,58,5);}
 if(f.look==="white-kurta"){ctx.fillStyle="#f1eee5";ctx.beginPath();ctx.moveTo(-28,-148);ctx.lineTo(28,-148);ctx.lineTo(36,-78);ctx.lineTo(-36,-78);ctx.closePath();ctx.fill();ctx.strokeStyle=f.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-144);ctx.lineTo(0,-84);ctx.stroke();}

 // Arms animate during attack and victory
 const armY=celebrating?victoryLift:(attacking?attackLift:-101);
 ctx.strokeStyle="#a96c4d";ctx.lineWidth=15;ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(-24,-135);ctx.lineTo(-42,celebrating?-184:-101);ctx.stroke();
 ctx.beginPath();ctx.moveTo(24,-135);ctx.lineTo(attacking?attackReach:38,armY);ctx.stroke();
 ctx.fillStyle="#a96c4d";ctx.beginPath();ctx.arc(attacking?attackReach:38,armY,9,0,Math.PI*2);ctx.fill();
 // Neck and face, shaded with simple comic highlights
 ctx.fillStyle="#a96c4d";ctx.beginPath();ctx.roundRect(-8,-157,16,18,5);ctx.fill();
 ctx.fillStyle="#b97b59";ctx.beginPath();ctx.ellipse(0,-181,23,27,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#d69a72";ctx.beginPath();ctx.ellipse(-8,-190,7,5,-.3,0,Math.PI*2);ctx.fill();
 // Hair / headwear
 if(f.look==="white-beard"){ctx.fillStyle="#f2eee4";ctx.beginPath();ctx.arc(0,-197,24,Math.PI,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-17,-165);ctx.quadraticCurveTo(0,-147,17,-165);ctx.quadraticCurveTo(15,-146,0,-145);ctx.quadraticCurveTo(-15,-146,-17,-165);ctx.fill();}
 if(f.look==="bald-glasses"||f.look==="shaved-saffron"){ctx.fillStyle="#986246";ctx.beginPath();ctx.ellipse(0,-197,23,9,0,Math.PI,Math.PI*2);ctx.fill();}
 if(f.look==="white-tee-beard"){ctx.fillStyle="#513d32";ctx.beginPath();ctx.arc(0,-197,24,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#513d32";ctx.beginPath();ctx.roundRect(-17,-164,34,16,7);ctx.fill();}
 if(f.look==="red-cap"||f.look==="white-beard"){ctx.fillStyle=f.look==="red-cap"?"#bd3434":f.accent;ctx.beginPath();ctx.roundRect(-25,-207,50,14,7);ctx.fill();ctx.fillRect(-28,-196,56,5);}
 if(f.look==="dark-glasses"){ctx.fillStyle="#241c1a";ctx.beginPath();ctx.arc(0,-196,24,Math.PI,Math.PI*2);ctx.fill();}
 if(f.look==="grey-hair"){ctx.fillStyle="#d4d0c7";ctx.beginPath();ctx.arc(0,-197,24,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-22,-198,44,6);}

 if(f.look==="white-sari"){ctx.fillStyle="#211d1c";ctx.beginPath();ctx.arc(0,-197,23,Math.PI,Math.PI*2);ctx.fill();}
 // Eyes, brows, nose and expression
 ctx.fillStyle="#34241f";ctx.fillRect(-14,-187,10,3);ctx.fillRect(4,-187,10,3);
 ctx.fillStyle="#17191f";ctx.beginPath();ctx.ellipse(-9,-180,2.7,3.2,0,0,Math.PI*2);ctx.ellipse(9,-180,2.7,3.2,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#744a38";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-179);ctx.lineTo(-2,-169);ctx.stroke();
 ctx.strokeStyle="#5c342c";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,-161);ctx.quadraticCurveTo(0,-157,7,-161);ctx.stroke();
 // Recognisable accessory details
 if(["bald-glasses","muffler-glasses","dark-glasses","spectacles","black-glasses"].includes(f.look)){ctx.strokeStyle=(f.look==="dark-glasses"||f.look==="black-glasses")?"#101218":"#24232a";ctx.lineWidth=3;ctx.fillStyle=(f.look==="dark-glasses"||f.look==="black-glasses")?"#171a20":"#d7e0e5";ctx.fillRect(-17,-185,14,8);ctx.fillRect(3,-185,14,8);ctx.strokeRect(-18,-187,16,12);ctx.strokeRect(2,-187,16,12);ctx.beginPath();ctx.moveTo(-2,-181);ctx.lineTo(2,-181);ctx.stroke();}
 if(["white-beard","bald-glasses","white-tee-beard","muffler-glasses","dark-glasses"].includes(f.look)){ctx.fillStyle=f.look==="white-beard"?"#f2eee4":"#35251f";ctx.beginPath();ctx.ellipse(0,-158,13,6,0,0,Math.PI*2);ctx.fill();}
 if(f.look==="white-beard"){ctx.fillStyle="#f1eee5";ctx.beginPath();ctx.moveTo(-15,-166);ctx.quadraticCurveTo(0,-153,15,-166);ctx.lineTo(10,-146);ctx.lineTo(-10,-146);ctx.closePath();ctx.fill();}
 if(f.look==="red-cap"){ctx.fillStyle="#34241f";ctx.beginPath();ctx.ellipse(0,-158,12,4,0,0,Math.PI*2);ctx.fill();}
 if(f.look==="shaved-saffron"){ctx.fillStyle="#f3d7a3";ctx.fillRect(-4,-191,8,12);}
 // Guard / block aura
 if(f.block){ctx.strokeStyle="#9bdcff";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-112,62,-1.4,1.4);ctx.stroke();}
 // Signature special move: character-coloured kinetic rings and sparks
 if(special){const pulse=.8+Math.sin(t*24)*.2;ctx.globalAlpha=.9;ctx.strokeStyle=f.accent;ctx.lineWidth=8;ctx.beginPath();ctx.arc(52,-121,72*pulse,-1.05,.75);ctx.stroke();ctx.strokeStyle="#fff3d1";ctx.lineWidth=3;ctx.beginPath();ctx.arc(52,-121,55*pulse,-.9,.6);ctx.stroke();ctx.fillStyle=f.accent;for(let i=0;i<7;i++){const a=-1.1+i*.3;ctx.beginPath();ctx.arc(55+Math.cos(a)*75,-121+Math.sin(a)*75,3+(i%2),0,Math.PI*2);ctx.fill();}}
 else if(attacking){ctx.strokeStyle=f.accent;ctx.lineWidth=5;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(53,-120,48,-.9,.7);ctx.stroke();}
 if(celebrating){ctx.fillStyle="#ffd166";ctx.font="900 14px DM Sans";ctx.textAlign="center";ctx.fillText("VICTORY!",0,-224);ctx.strokeStyle="#ffd166";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-20,-212);ctx.lineTo(-30,-226);ctx.lineTo(-8,-220);ctx.lineTo(0,-237);ctx.lineTo(9,-220);ctx.lineTo(30,-226);ctx.lineTo(20,-212);ctx.closePath();ctx.stroke();}
 ctx.restore();
}
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
function start(){if(mode==="online"&&!socket){$("overlayMessage").textContent="Connect to a multiplayer server first.";return;}if(roundOver){if(matchComplete){if(tournamentActive){if(roundWins[0]>=2){tournamentIndex++;if(tournamentIndex>=tournamentOpponents.length){const board=loadScores(),row=board.find(x=>x.name===roster[selectedHero].name);if(row){row.tournaments=(row.tournaments||0)+1;try{localStorage.setItem(SCORE_KEY,JSON.stringify(board));}catch{}renderLeaderboard();}tournamentActive=false;$("overlayTitle").textContent="MITROON CUP CHAMPION!";$("overlayMessage").textContent="Every rival defeated. The cup is yours.";$("startFight").textContent="PLAY AGAIN";$("arenaOverlay").classList.remove("hidden");return;}applyRosterFighter(fighters[1],roster[tournamentOpponents[tournamentIndex]]);$("rightName").textContent=roster[tournamentOpponents[tournamentIndex]].name;}else{tournamentActive=false;}}roundWins=[0,0];roundNumber=1;matchComplete=false;}else roundNumber++;fighters.forEach((f,i)=>Object.assign(f,{x:i?730:230,y:floor,vx:0,vy:0,hp:100,grounded:true,attack:0,attackType:"",cooldown:0,block:false,stun:0,energy:0,celebrate:false}));updateHud();updateScoreboard();roundOver=false;}running=true;$("arenaOverlay").classList.add("hidden");$("startFight").textContent="START FIGHT";}
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