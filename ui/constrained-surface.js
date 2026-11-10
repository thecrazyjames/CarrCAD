import {EPS,area,cross,distance,intersection,interpolate,simplePolygon,triangulate} from './geometry.js';

const edgeKey=(a,b)=>a<b?`${a},${b}`:`${b},${a}`;
const pointId=()=>globalThis.crypto.randomUUID();

function normalized(points){
 let minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
 let minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 let span=Math.max(maxX-minX,maxY-minY);
 if(!(span>0))throw Error('Constraint coordinates are coincident.');
 return points.map(p=>({x:(p.x-minX)/span,y:(p.y-minY)/span}));
}

function tolerance(points){
 let magnitude=Math.max(1,...points.flatMap(p=>[Math.abs(p.x),Math.abs(p.y)]));
 let span=Math.max(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)));
 return Math.max(EPS,magnitude*Number.EPSILON*32,span*1e-12);
}

function normalizedTolerance(points,tol){
 let span=Math.max(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)));
 return Math.max(1e-12,tol/Math.max(1,span));
}

function onSegment(p,a,b,pts,tol){
 let dx=pts[b].x-pts[a].x,dy=pts[b].y-pts[a].y,len2=dx*dx+dy*dy;
 if(len2<=tol*tol)return Math.hypot(pts[p].x-pts[a].x,pts[p].y-pts[a].y)<=tol;
 let t=((pts[p].x-pts[a].x)*dx+(pts[p].y-pts[a].y)*dy)/len2;
 if(t<-tol||t>1+tol)return false;
 let x=pts[a].x+t*dx,y=pts[a].y+t*dy;
 return Math.hypot(pts[p].x-x,pts[p].y-y)<=tol;
}

function pointInRing(p,ring,pts){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  let a=pts[ring[i]],b=pts[ring[j]];
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}

function segmentsTouch(a,b,c,d,pts,tol){
 if(intersection(pts[a],pts[b],pts[c],pts[d],true))return true;
 return onSegment(a,c,d,pts,tol)||onSegment(b,c,d,pts,tol)||onSegment(c,a,b,pts,tol)||onSegment(d,a,b,pts,tol);
}

function ringPath(path,label){
 let points=path.map(p=>({x:p.x,y:p.y}));
 if(points.length>1&&distance(points[0],points.at(-1))<=EPS)points.pop();
 if(!simplePolygon(points))throw Error(`${label} must be a simple, non-crossing closed polygon.`);
 return points;
}

function findMatchingPoint(p,points,tol){
 let matches=[];
 for(let i=0;i<points.length;i++)if(Math.hypot(p.x-points[i].x,p.y-points[i].y)<=tol)matches.push(i);
 if(matches.length>1)throw Error('A constraint vertex is within tolerance of multiple survey points.');
 return matches[0]??-1;
}

function splitSegment(a,b,points,pts,tol){
 let found=[];
 for(let i=0;i<points.length;i++)if(onSegment(i,a,b,pts,tol)){
  let dx=pts[b].x-pts[a].x,dy=pts[b].y-pts[a].y,len2=dx*dx+dy*dy;
  let t=len2?((pts[i].x-pts[a].x)*dx+(pts[i].y-pts[a].y)*dy)/len2:0;
  found.push({i,t});
 }
 found.sort((x,y)=>x.t-y.t);
 let result=[];
 for(let item of found)if(result.at(-1)!==item.i)result.push(item.i);
 return result.slice(1).map((id,i)=>[result[i],id]);
}

function orient(a,b,c,pts){
 let turn=cross(pts[a],pts[b],pts[c]);
 if(Math.abs(turn)<EPS)return null;
 return turn>0?[a,b,c]:[a,c,b];
}

function adjacency(triangles){
 let map=new Map;
 for(let i=0;i<triangles.length;i++){
  let t=triangles[i];
  for(let j=0;j<3;j++){
   let a=t[j],b=t[(j+1)%3],key=edgeKey(a,b),entry=map.get(key)||[];
   entry.push({triangle:i,a,b,opposite:t[(j+2)%3]});
   map.set(key,entry);
  }
 }
 return map;
}

function crossesSegment(a,b,c,d,pts){
 let hit=intersection(pts[a],pts[b],pts[c],pts[d],true);
 return !!hit&&hit.t>EPS&&hit.t<1-EPS&&hit.u>EPS&&hit.u<1-EPS;
}

function recoverConstraints(points,triangles,segments,pts){
 let locked=new Set,flips=0;
 for(let [start,end] of segments){
  let target=edgeKey(start,end),attempts=0;
  while(!adjacency(triangles).has(target)){
   if(++attempts>20000||++flips>50000)throw Error('Constraint recovery exceeded its safe work limit.');
   let edges=adjacency(triangles),crossings=[];
   for(let [key,entries] of edges){
    if(entries.length!==2||locked.has(key))continue;
    let {a,b}=entries[0];
    if(a===start||a===end||b===start||b===end)continue;
    let hit=intersection(pts[start],pts[end],pts[a],pts[b],true);
    if(hit&&hit.t>EPS&&hit.t<1-EPS&&hit.u>EPS&&hit.u<1-EPS)crossings.push({key,entries,t:hit.t});
   }
   crossings.sort((a,b)=>a.t-b.t);
   let changed=false;
   for(let {key,entries} of crossings){
    let {triangle:first,a,b,opposite:c}=entries[0],{triangle:second,opposite:d}=entries[1];
    if(c===d||cross(pts[a],pts[b],pts[c])*cross(pts[a],pts[b],pts[d])>=-EPS)continue;
    if(crossesSegment(start,end,c,d,pts))continue;
    let blocked=false;
    for(let edge of locked){let [u,v]=edge.split(',').map(Number);if(u!==c&&u!==d&&v!==c&&v!==d&&crossesSegment(c,d,u,v,pts)){blocked=true;break}}
    if(blocked)continue;
    let t1=orient(c,d,a,pts),t2=orient(d,c,b,pts);
    if(!t1||!t2)continue;
    triangles[first]=t1;
    triangles[second]=t2;
    changed=true;
    break;
   }
   if(!changed)throw Error('Could not recover a constraint edge. Check for crossing or conflicting constraints.');
  }
  locked.add(target);
 }
 return triangles;
}

function pathIndices(path,points,source,baseTriangles,tol,{surveyOnly=false}={}){
 let result=[];
 for(let p of path){
  let index=findMatchingPoint(p,source,tol);
  if(index<0){
   if(surveyOnly)throw Error('Every breakline vertex must match a surveyed point in XY.');
   let z=interpolate(p,source,baseTriangles);
   if(z===null)throw Error('Boundary and hole vertices must lie inside the survey-point hull.');
   let generated=points.findIndex(q=>Math.hypot(q.x-p.x,q.y-p.y)<=tol);
   if(generated>=0)index=generated;
   else{
    let id=pointId();
    points.push({id,x:p.x,y:p.y,z});
    index=points.length-1;
   }
  }
  if(result.at(-1)!==index)result.push(index);
 }
 if(surveyOnly&&result.length<2)throw Error('A breakline needs at least two distinct survey points.');
 return result;
}

export function buildConstrainedSurface({points:input,boundary,holes=[],breaklines=[]}){
 if(!Array.isArray(input)||input.length<3||input.length>1500)throw Error('A constrained TIN needs between 3 and 1,500 survey points.');
 if(!Array.isArray(boundary)||!Array.isArray(holes)||!Array.isArray(breaklines))throw Error('Invalid surface constraints.');
 let points=input.map(p=>({id:p.id,x:p.x,y:p.y,z:p.z??0}));
 if(points.some(p=>typeof p.id!=='string'||![p.x,p.y,p.z].every(Number.isFinite)))throw Error('Invalid survey points for constrained TIN.');
 if(new Set(points.map(p=>p.id)).size!==points.length)throw Error('Survey point IDs must be unique.');
 let rings=[ringPath(boundary,'Outer boundary'),...holes.map((ring,i)=>ringPath(ring,`Hole ${i+1}`))];
 let rawPaths=[...rings,...breaklines.map((path,i)=>{if(!Array.isArray(path)||path.length<2)throw Error(`Breakline ${i+1} needs at least two vertices.`);return path.map(p=>({x:p.x,y:p.y}))})];
 if(rawPaths.reduce((sum,path)=>sum+path.length,0)>1500)throw Error('Surface constraints exceed 1,500 vertices.');
 let tol=tolerance([...points,...rawPaths.flat()]);
 let baseTriangles=triangulate(points),surfacePoints=points.map(p=>({...p}));
 let ringIds=rings.map(ring=>pathIndices(ring,surfacePoints,points,baseTriangles,tol,{surveyOnly:false}));
 let breaklineIds=breaklines.map((path,i)=>pathIndices(rawPaths[rings.length+i],surfacePoints,points,baseTriangles,tol,{surveyOnly:true}));
 let plane=normalized(surfacePoints);
 let planeTol=normalizedTolerance(surfacePoints,tol);
 let outer=ringIds[0],holeIds=ringIds.slice(1);
 for(let h of holeIds){
  if(!h.every(i=>pointInRing(plane[i],outer,plane)))throw Error('Every hole must lie entirely inside the outer boundary.');
  for(let [a,b] of h.flatMap((id,i)=>[[id,h[(i+1)%h.length]]]))for(let [c,d] of outer.flatMap((id,i)=>[[id,outer[(i+1)%outer.length]]]))if(segmentsTouch(a,b,c,d,plane,planeTol))throw Error('A hole cannot touch or cross the outer boundary.');
 }
 for(let i=0;i<holeIds.length;i++)for(let j=i+1;j<holeIds.length;j++){
  let a=holeIds[i],b=holeIds[j];
  if(a.some(id=>pointInRing(plane[id],b,plane))||b.some(id=>pointInRing(plane[id],a,plane))||a.some((id,k)=>b.some((other,l)=>segmentsTouch(id,a[(k+1)%a.length],other,b[(l+1)%b.length],plane,planeTol))))throw Error('Holes cannot overlap, nest, touch or cross.');
 }
 let segments=[];
 for(let ring of ringIds)for(let i=0;i<ring.length;i++)segments.push([ring[i],ring[(i+1)%ring.length]]);
 for(let path of breaklineIds)for(let i=1;i<path.length;i++){
  let a=path[i-1],b=path[i];
  if(a===b)throw Error('Breaklines cannot contain zero-length segments.');
  for(let p=0;p<points.length;p++)if(p!==a&&p!==b&&onSegment(p,a,b,plane,planeTol)){
   let dx=plane[b].x-plane[a].x,dy=plane[b].y-plane[a].y,t=((plane[p].x-plane[a].x)*dx+(plane[p].y-plane[a].y)*dy)/(dx*dx+dy*dy);
   let expected=points[a].z+t*(points[b].z-points[a].z);
   if(Math.abs(points[p].z-expected)>Math.max(EPS,Math.abs(expected)*1e-10))throw Error('A survey point on a breakline conflicts with its interpolated elevation.');
  }
  segments.push([a,b]);
 }
 let split=segments.flatMap(([a,b])=>splitSegment(a,b,surfacePoints,plane,planeTol));
 if(split.length>2000)throw Error('Surface constraints create too many segments.');
 let uniqueSegments=[...new Map(split.map(([a,b])=>[edgeKey(a,b),[a,b]])).values()];
 for(let i=0;i<uniqueSegments.length;i++)for(let j=i+1;j<uniqueSegments.length;j++){
  let [a,b]=uniqueSegments[i],[c,d]=uniqueSegments[j];
  if(a===c||a===d||b===c||b===d)continue;
  if(segmentsTouch(a,b,c,d,plane,planeTol))throw Error('Surface constraints cross without a shared vertex. Split them at a common surveyed point.');
 }
 for(let path of breaklineIds){
  for(let [a,b] of splitSegmentPath(path,surfacePoints,plane,planeTol)){
   let mid={x:(plane[a].x+plane[b].x)/2,y:(plane[a].y+plane[b].y)/2};
   if(!pointInRing(mid,outer,plane)||holeIds.some(ring=>pointInRing(mid,ring,plane)))throw Error('Breaklines must remain inside the outer boundary and outside holes.');
  }
 }
 let triangles=recoverConstraints(surfacePoints,triangulate(surfacePoints),uniqueSegments,plane);
 let kept=triangles.filter(t=>{
  let c={x:(plane[t[0]].x+plane[t[1]].x+plane[t[2]].x)/3,y:(plane[t[0]].y+plane[t[1]].y+plane[t[2]].y)/3};
  return pointInRing(c,outer,plane)&&!holeIds.some(ring=>pointInRing(c,ring,plane));
 });
 if(!kept.length)throw Error('Constraints leave no triangles in the surface area.');
 let keptEdges=new Set(adjacency(kept).keys());
 if(uniqueSegments.some(([a,b])=>!keptEdges.has(edgeKey(a,b))))throw Error('A constraint edge is outside the retained surface area.');
 let vertices=surfacePoints.slice(input.length);
 let surfaceArea=kept.reduce((sum,t)=>sum+area(t.map(i=>surfacePoints[i])),0);
 return {vertices,triangles:kept.map(t=>t.map(i=>surfacePoints[i].id)),area:surfaceArea};
}

function splitSegmentPath(path,points,plane,tol){
 let result=[];
 for(let i=1;i<path.length;i++)result.push(...splitSegment(path[i-1],path[i],points,plane,tol));
 return result;
}
