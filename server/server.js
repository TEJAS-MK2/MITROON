const http = require("node:http");
const { WebSocketServer, WebSocket } = require("ws");
const PORT = Number(process.env.PORT || 8080);
const rooms = new Map();
const server = http.createServer((req,res) => {
  if (req.url === "/health") { res.writeHead(200,{"content-type":"application/json","access-control-allow-origin":"*"}); return res.end(JSON.stringify({ok:true,service:"mitroon-realtime",rooms:rooms.size})); }
  res.writeHead(200,{"content-type":"text/plain"}); res.end("MITROON realtime server is running.\n");
});
const wss = new WebSocketServer({server,maxPayload:2048});
function send(ws,payload){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(payload));}
function leave(ws){const room=rooms.get(ws.room);if(!room)return;room.players.delete(ws.playerId);for(const peer of room.players.values())send(peer,{type:"peer-left"});if(room.players.size===0)rooms.delete(ws.room);ws.room=null;}
wss.on("connection",ws=>{
  ws.isAlive=true;ws.on("pong",()=>ws.isAlive=true);
  ws.on("message",raw=>{
    let msg;try{msg=JSON.parse(raw.toString());}catch{return send(ws,{type:"error",message:"Invalid message."});}
    if(!msg||typeof msg.type!=="string")return;
    if(msg.type==="create"){
      leave(ws);let code;do{code=Math.random().toString(36).slice(2,8).toUpperCase();}while(rooms.has(code));
      const room={players:new Map()};rooms.set(code,room);ws.room=code;ws.playerId=1;room.players.set(1,ws);return send(ws,{type:"created",room:code,playerId:1});
    }
    if(msg.type==="join"){
      const code=String(msg.room||"").toUpperCase();const room=rooms.get(code);
      if(!room)return send(ws,{type:"error",message:"Room not found. Check the code and try again."});
      if(room.players.size>=2)return send(ws,{type:"error",message:"That room is full."});
      leave(ws);ws.room=code;ws.playerId=2;room.players.set(2,ws);send(ws,{type:"joined",room:code,playerId:2});
      for(const peer of room.players.values())if(peer!==ws)send(peer,{type:"peer-joined"});return;
    }
    if(msg.type==="state"){
      if(!ws.room||msg.room!==ws.room)return;
      const room=rooms.get(ws.room);if(!room)return;
      const s=msg.state;if(!s||![s.x,s.y,s.hp,s.attack].every(Number.isFinite))return;
      const safe={x:Math.max(50,Math.min(910,s.x)),y:Math.max(0,Math.min(365,s.y)),hp:Math.max(0,Math.min(100,s.hp)),block:!!s.block,attack:Math.max(0,Math.min(1,s.attack)),attackType:["punch","kick","special",""].includes(s.attackType)?s.attackType:"",face:s.face<0?-1:1};
      for(const [id,peer] of room.players)if(id!==ws.playerId)send(peer,{type:"state",playerId:ws.playerId,state:safe});
    }
  });
  ws.on("close",()=>leave(ws));ws.on("error",()=>leave(ws));
});
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue;}ws.isAlive=false;ws.ping();}},30000);
wss.on("close",()=>clearInterval(heartbeat));
server.listen(PORT,"0.0.0.0",()=>console.log("MITROON realtime listening on "+PORT));
process.on("SIGTERM",()=>{clearInterval(heartbeat);for(const ws of wss.clients)ws.close();server.close(()=>process.exit(0));});