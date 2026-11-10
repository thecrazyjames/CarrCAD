export const LEADER_LINE_STYLES=Object.freeze(['straight','squiggly']);
export const LEADER_ARROW_TYPES=Object.freeze(['arrow','filled','dot','none']);

export function leaderArrowSizeFor(entity){return entity.leaderArrowSize??(entity.size||1)*.8}

export function leaderPointsForEntity(entity,entities=[]){
 let points=entity.points.map(point=>({...point}));
 if(entity.leaderTextId&&entity.leaderTextOffset){
  let text=entities.find(candidate=>candidate.id===entity.leaderTextId&&candidate.type==='text');
  if(text?.a)points[points.length-1]={x:text.a.x+entity.leaderTextOffset.x,y:text.a.y+entity.leaderTextOffset.y};
 }
 return points;
}

export function leaderPathPoints(points,style='straight',size=1){
 if(!Array.isArray(points)||points.length<2||points.some(point=>!point||![point.x,point.y].every(Number.isFinite)))throw Error('A leader path needs at least two finite points.');
 if(!LEADER_LINE_STYLES.includes(style)||!Number.isFinite(size)||size<=0)throw Error('Invalid leader line style.');
 if(style==='straight')return points.map(point=>({...point}));
 let path=[{...points[0]}];
 for(let index=1;index<points.length;index++){
  let start=points[index-1],end=points[index],dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy);
  if(length<1e-8){path.push({...end});continue}
  let amplitude=Math.min(size*.25,length*.12),cycles=Math.min(24,Math.max(1,Math.round(length/Math.max(size*3,1)))),steps=cycles*8,nx=-dy/length,ny=dx/length;
  for(let step=1;step<=steps;step++){
   let t=step/steps,offset=amplitude*Math.sin(t*cycles*2*Math.PI);
   path.push({x:start.x+dx*t+nx*offset,y:start.y+dy*t+ny*offset});
  }
 }
 return path;
}

export function leaderArrowGeometry(points,type='arrow',size=1){
 if(!Array.isArray(points)||points.length<2||points.some(point=>!point||![point.x,point.y].every(Number.isFinite))||!LEADER_ARROW_TYPES.includes(type)||!Number.isFinite(size)||size<=0)throw Error('Invalid leader arrow geometry.');
 let first=points[0];
 if(type==='none')return {type};
 if(type==='dot')return {type,center:{...first},radius:size*.18};
 let next=points[1],angle=Math.atan2(next.y-first.y,next.x-first.x);
 if(type==='filled'){
  let back={x:first.x+Math.cos(angle)*size,y:first.y+Math.sin(angle)*size},width=size*.38;
  return {type,points:[{...first},{x:back.x-Math.sin(angle)*width,y:back.y+Math.cos(angle)*width},{x:back.x+Math.sin(angle)*width,y:back.y-Math.cos(angle)*width}]};
 }
 return {type,lines:[angle+Math.PI-.5,angle+Math.PI+.5].map(direction=>[
  {...first},
  {x:first.x+Math.cos(direction)*size,y:first.y+Math.sin(direction)*size}
 ])};
}
