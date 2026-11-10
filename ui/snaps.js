import {closest,distance,intersection} from './geometry.js';
import {entityPoints} from './exchange.js';

const MODES=['endpoint','center','quadrant','midpoint','intersection','nearest','perpendicular'];
const modeKind={endpoint:'Endpoint',center:'Center',quadrant:'Quadrant',midpoint:'Midpoint',intersection:'Intersection',nearest:'Nearest',perpendicular:'Perpendicular'};

function segments(entity){
 if(['line','dim'].includes(entity.type))return entity.a&&entity.b?[[entity.a,entity.b]]:[];
 if(!['rect','polyline','parcel','alignment','leader'].includes(entity.type))return [];
 let points=entityPoints(entity),pairs=points.slice(1).map((point,index)=>[points[index],point]);
 if(entity.closed||['rect','parcel'].includes(entity.type))pairs.push([points.at(-1),points[0]]);
 return pairs.filter(([a,b])=>distance(a,b)>1e-8);
}
function arcEnds(entity){
 let end=entity.end;
 while(end<entity.start)end+=Math.PI*2;
 return [entity.start,end];
}
function angleOnArc(angle,start,end){
 while(angle<start)angle+=Math.PI*2;
 while(angle>end)angle-=Math.PI*2;
 return angle>=start-1e-8&&angle<=end+1e-8;
}
function nearestOnArc(point,entity){
 let [start,end]=arcEnds(entity),angle=Math.atan2(point.y-entity.a.y,point.x-entity.a.x);
 if(angleOnArc(angle,start,end))return {x:entity.a.x+entity.r*Math.cos(angle),y:entity.a.y+entity.r*Math.sin(angle)};
 return [start,end].map(value=>({x:entity.a.x+entity.r*Math.cos(value),y:entity.a.y+entity.r*Math.sin(value)})).sort((a,b)=>distance(point,a)-distance(point,b))[0];
}

export function objectSnapCandidates(entities,point,enabled={},tolerance=Infinity){
 let candidates=[],allSegments=[];
 const add=(p,kind)=>{if(Number.isFinite(p.x)&&Number.isFinite(p.y))candidates.push({x:p.x,y:p.y,kind:modeKind[kind]})};
 for(let entity of entities){
  let points=entityPoints(entity);
  if(enabled.endpoint){
   if(entity.type==='arc')for(let angle of [entity.start,entity.end])add({x:entity.a.x+entity.r*Math.cos(angle),y:entity.a.y+entity.r*Math.sin(angle)},'endpoint');
   else if(!['circle'].includes(entity.type))for(let p of points)add(p,'endpoint');
  }
  if(enabled.center&&['circle','arc'].includes(entity.type))add(entity.a,'center');
  if(enabled.quadrant&&entity.type==='circle')for(let angle of [0,Math.PI/2,Math.PI,Math.PI*1.5])add({x:entity.a.x+entity.r*Math.cos(angle),y:entity.a.y+entity.r*Math.sin(angle)},'quadrant');
  let pairs=segments(entity);
  if(enabled.midpoint)for(let [a,b] of pairs)add({x:(a.x+b.x)/2,y:(a.y+b.y)/2},'midpoint');
  if(enabled.nearest){
   for(let [a,b] of pairs)add(closest(point,a,b),'nearest');
   if(entity.type==='circle'&&entity.r>0){
    let angle=Math.atan2(point.y-entity.a.y,point.x-entity.a.x);
    if(distance(point,entity.a)<1e-8)angle=0;
    add({x:entity.a.x+entity.r*Math.cos(angle),y:entity.a.y+entity.r*Math.sin(angle)},'nearest');
   }else if(entity.type==='arc'&&entity.r>0)add(nearestOnArc(point,entity),'nearest');
  }
  if(enabled.perpendicular)for(let [a,b] of pairs){
   let dx=b.x-a.x,dy=b.y-a.y,t=((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy);
   if(t>=0&&t<=1)add({x:a.x+t*dx,y:a.y+t*dy},'perpendicular');
  }
  allSegments.push(...pairs.map(pair=>({pair,entity})));
 }
 if(enabled.intersection){
  let nearby=allSegments.filter(({pair})=>{let [a,b]=pair;return Math.max(a.x,b.x)>=point.x-tolerance&&Math.min(a.x,b.x)<=point.x+tolerance&&Math.max(a.y,b.y)>=point.y-tolerance&&Math.min(a.y,b.y)<=point.y+tolerance});
  for(let i=0;i<nearby.length;i++)for(let j=i+1;j<nearby.length;j++){
  let hit=intersection(...nearby[i].pair,...nearby[j].pair);
  if(hit)add(hit,'intersection');
  }
 }
 return candidates;
}

export function findObjectSnap(entities,point,{enabled={},tolerance=Infinity}={}){
 let priority=new Map(MODES.map((mode,index)=>[modeKind[mode],index]));
 return objectSnapCandidates(entities,point,enabled,tolerance)
  .map(candidate=>({...candidate,distance:distance(point,candidate)}))
  .filter(candidate=>candidate.distance<tolerance)
  .sort((a,b)=>a.distance-b.distance||(priority.get(a.kind)-priority.get(b.kind)))[0]||null;
}
