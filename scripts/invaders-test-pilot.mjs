import {invadersDifficulty} from '../src/lib/crawler/invaders.mjs';
// A deterministic test pilot for local engine/browser play-throughs. It uses
// ordinary movement/fire controls; no health, enemies or scores are changed.
export function invadersTestPilot(s){
 const d=invadersDifficulty(s),enemies=s.enemies.filter(e=>e.alive);
 if(!enemies.length)return{fire:true,targetX:s.playerX};
 let best=s.playerX,cost=Infinity;
 for(let x=37;x<s.width-37;x+=8){
  let c=Math.abs(x-s.playerX)*.09+Math.min(...enemies.map(e=>Math.abs(x-(e.x+s.direction*d.speed*(s.playerY-53-e.y)/520))))*.6;
  for(const b of s.threats){
   const t=(s.playerY-30-b.y)/b.vy;if(t<0||t>1.6)continue;
   const bx=b.x+b.vx*t,px=s.playerX+Math.max(-440*t,Math.min(440*t,x-s.playerX));
   if(Math.abs(px-bx)<30)c+=1000*(1-t/2);
  }
  if(c<cost){best=x;cost=c;}
 }
 return{fire:true,targetX:best};
}
