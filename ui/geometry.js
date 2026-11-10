// Geometry uses local Cartesian coordinates: X east, Y north, Z elevation.
export const EPS=1e-8;
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function nearRectangleBorder(p,minX,minY,maxX,maxY,tolerance=0){
 if(!p||![p.x,p.y,minX,minY,maxX,maxY,tolerance].every(Number.isFinite)||minX>maxX||minY>maxY||tolerance<0)throw Error('Invalid rectangle border hit test.');
 let horizontal=p.x>=minX-tolerance&&p.x<=maxX+tolerance&&(Math.abs(p.y-minY)<=tolerance||Math.abs(p.y-maxY)<=tolerance);
 let vertical=p.y>=minY-tolerance&&p.y<=maxY+tolerance&&(Math.abs(p.x-minX)<=tolerance||Math.abs(p.x-maxX)<=tolerance);
 return horizontal||vertical;
}
export const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
export function signedArea(p){return p.reduce((s,a,i)=>{let b=p[(i+1)%p.length];return s+a.x*b.y-b.x*a.y},0)/2}
export function area(p){return Math.abs(signedArea(p))}
export function length(p,closed=false){return p.reduce((s,a,i)=>i?s+distance(p[i-1],a):s,0)+(closed&&p.length>2?distance(p.at(-1),p[0]):0)}
export function closest(p,a,b){let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return {x:a.x+t*dx,y:a.y+t*dy,t}}
export function intersection(a,b,c,d,segments=true){let x=b.x-a.x,y=b.y-a.y,u=d.x-c.x,v=d.y-c.y,den=x*v-y*u;if(Math.abs(den)<EPS)return null;let t=((c.x-a.x)*v-(c.y-a.y)*u)/den,s=((c.x-a.x)*y-(c.y-a.y)*x)/den;if(segments&&(t<-EPS||t>1+EPS||s<-EPS||s>1+EPS))return null;return {x:a.x+t*x,y:a.y+t*y,t,u:s}}
export function simplePolygon(p){if(p.length<3||area(p)<EPS)return false;for(let i=0;i<p.length;i++){if(distance(p[i],p[(i+1)%p.length])<EPS)return false;for(let j=i+1;j<p.length;j++){if(j===i+1||(i===0&&j===p.length-1))continue;if(intersection(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]))return false}}return true}
export function convex(p){let signs=p.map((a,i)=>cross(a,p[(i+1)%p.length],p[(i+2)%p.length])).filter(n=>Math.abs(n)>EPS);return signs.every(n=>n>0)||signs.every(n=>n<0)}
export function offsetPolygon(p,d){if(!simplePolygon(p)||!convex(p))throw Error('Setbacks currently require a simple convex parcel.');let orientation=Math.sign(signedArea(p));let lines=p.map((a,i)=>{let b=p[(i+1)%p.length],l=distance(a,b),nx=-(b.y-a.y)/l*orientation*d,ny=(b.x-a.x)/l*orientation*d;return [{x:a.x+nx,y:a.y+ny},{x:b.x+nx,y:b.y+ny}]});let q=lines.map((l,i)=>intersection(...lines[(i+lines.length-1)%lines.length],...l,false));if(q.some(x=>!x)||!simplePolygon(q)||q.some(v=>p.some((a,i)=>cross(a,p[(i+1)%p.length],v)*orientation<-EPS)))throw Error('Setback distance collapses this parcel.');if(d>0&&q.some(v=>lines.some(l=>cross(l[0],l[1],v)*orientation<-EPS)))throw Error('Setback distance collapses this parcel.');return q.map(({x,y})=>({x,y}))}
export function offsetPolyline(source,d,closed=false){
 if(!Array.isArray(source)||!Number.isFinite(d)||Math.abs(d)<EPS)throw Error('Offset requires a nonzero finite distance and a valid path.');
 let points=source.map(point=>({...point}));
 if(closed&&points.length>1&&distance(points[0],points.at(-1))<EPS)points.pop();
 if(points.length<(closed?3:2)||points.some(point=>!point||![point.x,point.y].every(Number.isFinite)))throw Error('Offset path has too few or invalid vertices.');
 if(closed&&!simplePolygon(points))throw Error('Closed offset paths must be simple polygons.');
 let segmentCount=closed?points.length:points.length-1,segments=[];
 for(let i=0;i<segmentCount;i++){
  let a=points[i],b=points[(i+1)%points.length],length=distance(a,b);
  if(length<EPS)throw Error('Offset path contains a zero-length segment.');
  let normal={x:-(b.y-a.y)/length,y:(b.x-a.x)/length},offset=closed?Math.sign(signedArea(points))*d:d;
  segments.push({a:{...a,x:a.x+normal.x*offset,y:a.y+normal.y*offset},b:{...b,x:b.x+normal.x*offset,y:b.y+normal.y*offset},normal});
 }
 let vertex=(index,previous,current)=>{
  let hit=intersection(previous.a,previous.b,current.a,current.b,false);
  if(!hit){
   let prior=points[(index+points.length-1)%points.length],next=points[(index+1)%points.length];
   let priorVector={x:points[index].x-prior.x,y:points[index].y-prior.y},nextVector={x:next.x-points[index].x,y:next.y-points[index].y};
   if(priorVector.x*nextVector.x+priorVector.y*nextVector.y<=0)throw Error('Offset path doubles back at a vertex.');
   return {...points[index],x:points[index].x+current.normal.x*(closed?Math.sign(signedArea(points))*d:d),y:points[index].y+current.normal.y*(closed?Math.sign(signedArea(points))*d:d)};
  }
  if(distance(points[index],hit)>Math.abs(d)*1000+EPS)throw Error('Offset creates an excessively sharp corner. Reduce the distance or split the path.');
  return {...points[index],x:hit.x,y:hit.y};
 };
 let result;
 if(closed)result=points.map((_,index)=>vertex(index,segments[(index+segments.length-1)%segments.length],segments[index]));
 else{
  let offset=d,first=segments[0],last=segments.at(-1);
  result=[{...points[0],x:points[0].x+first.normal.x*offset,y:points[0].y+first.normal.y*offset}];
  for(let index=1;index<points.length-1;index++)result.push(vertex(index,segments[index-1],segments[index]));
  result.push({...points.at(-1),x:points.at(-1).x+last.normal.x*offset,y:points.at(-1).y+last.normal.y*offset});
 }
 if(result.some(point=>![point.x,point.y].every(value=>Number.isFinite(value)&&Math.abs(value)<1e10)))throw Error('Offset produces invalid coordinates.');
 let edges=closed?result.length:result.length-1;
 for(let i=0;i<edges;i++)for(let j=i+2;j<edges;j++){
  if(closed&&i===0&&j===edges-1)continue;
  if(intersection(result[i],result[(i+1)%result.length],result[j],result[(j+1)%result.length]))throw Error('Offset self-intersects. Reduce the distance or split the path.');
 }
 for(let i=0;i<edges;i++){
  let a=points[i],b=points[(i+1)%points.length],c=result[i],next=result[(i+1)%result.length];
  if((b.x-a.x)*(next.x-c.x)+(b.y-a.y)*(next.y-c.y)<=EPS)throw Error('Offset collapses or reverses a path segment.');
 }
 if(closed){
  if(!simplePolygon(result)||Math.sign(signedArea(result))!==Math.sign(signedArea(points)))throw Error('Offset collapses or reverses the polygon.');
  if(d>0&&area(result)>=area(points)-EPS||d<0&&area(result)<=area(points)+EPS)throw Error('Offset collapses or reverses the polygon.');
 }
 return result;
}
export function bearing(a,b){let dx=b.x-a.x,dy=b.y-a.y;let deg=Math.atan2(Math.abs(dx),Math.abs(dy))*180/Math.PI;let dd=Math.floor(deg),mm=Math.floor((deg-dd)*60),ss=Math.round(((deg-dd)*60-mm)*60);if(ss===60){ss=0;mm++}if(mm===60){mm=0;dd++}return `${dy>=0?'N':'S'} ${dd}°${String(mm).padStart(2,'0')}′${String(ss).padStart(2,'0')}″ ${dx>=0?'E':'W'}`}
export function parseDistance(value,units='ft'){
 let millimeters={ft:304.8,in:25.4,m:1000,mm:1}[units];
 if(!millimeters)throw Error('Choose valid drawing units before entering a course distance.');
 let input=String(value??'').trim();
 if(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(input)){let distance=Number(input);if(distance>0&&Number.isFinite(distance))return distance;throw Error('Course distance must be positive.')}
 let match=input.match(/^(?:((?:\d+(?:\.\d*)?|\.\d+))\s*(?:'|′|’|feet?|ft)\s*)?(?:((?:\d+(?:\.\d*)?|\.\d+))\s*(?:"|″|”|inches?|in))?$/i);
 if(!match||match[1]===undefined&&match[2]===undefined)throw Error("Enter a positive distance in drawing units or feet and inches, for example 193' 11\".");
 let feet=Number(match[1]||0),inches=Number(match[2]||0);
 if(match[1]!==undefined&&inches>=12)throw Error('When feet are specified, inches must be less than 12.');
 let distance=(feet*304.8+inches*25.4)/millimeters;
 if(!(distance>0)||!Number.isFinite(distance))throw Error('Course distance must be positive and finite.');
 return distance;
}
export function traversePoint(a,ns,deg,min,sec,ew,dist){if(![deg,min,sec,dist].every(Number.isFinite)||deg<0||deg>90||min<0||min>=60||sec<0||sec>=60||deg+min/60+sec/3600>90||dist<=0)throw Error('Use a bearing between 0° and 90° and a positive distance.');let ang=(deg+min/60+sec/3600)*Math.PI/180;return {x:a.x+Math.sin(ang)*dist*(ew==='E'?1:-1),y:a.y+Math.cos(ang)*dist*(ns==='N'?1:-1)}}
export function referenceRotationAngle(origin,reference,target){if(![origin,reference,target].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))throw Error('Reference rotation requires three valid points.');if(distance(origin,reference)<=EPS||distance(origin,target)<=EPS)throw Error('Reference and target points must be away from the rotation pivot.');return Math.atan2(target.y-origin.y,target.x-origin.x)-Math.atan2(reference.y-origin.y,reference.x-origin.x)}
const vector=(a,b)=>({x:b.x-a.x,y:b.y-a.y});
const cross2=(a,b)=>a.x*b.y-a.y*b.x;
const dot2=(a,b)=>a.x*b.x+a.y*b.y;
function checkedLine(line,label='LINE'){
 if(!line||!line.a||!line.b||![line.a.x,line.a.y,line.b.x,line.b.y].every(Number.isFinite))throw Error(`${label} must have finite endpoints.`);
 if([line.a.z??0,line.b.z??0].some(z=>!Number.isFinite(z)||Math.abs(z)>EPS))throw Error(`${label} must lie in the XY plane at Z=0.`);
 let d=vector(line.a,line.b),size=Math.hypot(d.x,d.y);
 if(size<=EPS)throw Error(`${label} must have nonzero length.`);
 return {d,size};
}
function lerpPoint(a,b,t){let p={...a,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(Number.isFinite(a.z)&&Number.isFinite(b.z))p.z=a.z+(b.z-a.z)*t;return p}
function endpointAlong(line,origin,direction){return dot2(vector(origin,line.a),direction)>=dot2(vector(origin,line.b),direction)?'a':'b'}
function segmentIntersections(line,boundaries){
 let {d,size}=checkedLine(line,'Target LINE'),hits=[];
 if(!Array.isArray(boundaries)||!boundaries.length)throw Error('Select at least one boundary LINE.');
 for(let i=0;i<boundaries.length;i++){
  let boundary=boundaries[i],{d:s,size:boundarySize}=checkedLine(boundary,`Boundary ${i+1}`);
  let q=vector(line.a,boundary.a),den=cross2(d,s),parallelTolerance=EPS*Math.max(1,size*boundarySize);
  if(Math.abs(den)<=parallelTolerance){
   if(Math.abs(cross2(q,d))<=EPS*Math.max(1,size*Math.hypot(q.x,q.y))){
    let t0=dot2(q,d)/(size*size),t1=t0+dot2(s,d)/(size*size);
    if(Math.max(Math.min(t0,t1),0)<=Math.min(Math.max(t0,t1),1)+EPS)throw Error('A boundary LINE overlaps the target; trim/extend would be ambiguous.');
   }
   continue;
  }
  let t=cross2(q,s)/den,u=cross2(q,d)/den;
  if(t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS){
   t=Math.max(0,Math.min(1,t));
   if(t>EPS&&t<1-EPS)hits.push({t,point:lerpPoint(line.a,line.b,t),boundaryIndex:i});
  }
 }
 hits.sort((a,b)=>a.t-b.t);
 let unique=[];
 for(let hit of hits){let prior=unique.at(-1),separation=prior?Math.abs(hit.t-prior.t)*size:Infinity;if(prior&&separation<=EPS)continue;if(prior&&separation<=EPS*10)throw Error('Boundary intersections are too close to resolve safely.');unique.push(hit)}
 return {hits:unique,size};
}
export function trimLineByBoundaries(line,boundaries,pick){
 let {hits,size}=segmentIntersections(line,boundaries);
 if(!pick||![pick.x,pick.y].every(Number.isFinite))throw Error('Pick a valid point on the LINE segment to remove.');
 if(!hits.length)throw Error('No boundary LINE intersects the target segment.');
 let d=vector(line.a,line.b),t=Math.max(0,Math.min(1,dot2(vector(line.a,pick),d)/(size*size)));
 if(hits.some(hit=>Math.abs(hit.t-t)*size<=EPS*10))throw Error('Pick within a trim segment, not directly on an intersection.');
 let cuts=[0,...hits.map(hit=>hit.t),1],interval=cuts.findIndex((value,i)=>i<cuts.length-1&&t>=value-EPS&&t<=cuts[i+1]+EPS);
 if(interval<0)throw Error('Could not identify the trim segment. Pick again away from an intersection.');
 let removed={a:lerpPoint(line.a,line.b,cuts[interval]),b:lerpPoint(line.a,line.b,cuts[interval+1])};
 let segments=[];
 if(interval>0)segments.push({a:line.a,b:removed.a});
 if(interval<cuts.length-2)segments.push({a:removed.b,b:line.b});
 if(segments.some(segment=>distance(segment.a,segment.b)<=EPS))throw Error('Trim would create zero-length geometry.');
 return {segments,removed,intersections:hits.map(hit=>hit.point)};
}
export function extendLineToBoundaries(line,boundaries,endpoint){
 checkedLine(line,'Target LINE');
 if(endpoint!=='a'&&endpoint!=='b')throw Error('Choose the start or end endpoint to extend.');
 if(!Array.isArray(boundaries)||!boundaries.length)throw Error('Select at least one boundary LINE.');
 let origin=line[endpoint],other=line[endpoint==='a'?'b':'a'],direction=vector(other,origin),length=Math.hypot(direction.x,direction.y);
 direction={x:direction.x/length,y:direction.y/length};
 let hits=[];
 for(let i=0;i<boundaries.length;i++){
  let boundary=boundaries[i],{d:s,size}=checkedLine(boundary,`Boundary ${i+1}`),q=vector(origin,boundary.a),den=cross2(direction,s);
  if(Math.abs(den)<=EPS*Math.max(1,size)){
   if(Math.abs(cross2(q,direction))<=EPS*Math.max(1,Math.hypot(q.x,q.y))){
    let t0=dot2(q,direction),t1=dot2(vector(origin,boundary.b),direction);
    if(Math.max(t0,t1)>=-EPS)throw Error('A boundary LINE overlaps the extension ray; extend would be ambiguous.');
   }
   continue;
  }
  let t=cross2(q,s)/den,u=cross2(q,direction)/den;
  if(t>EPS&&u>=-EPS&&u<=1+EPS)hits.push({t,point:{x:origin.x+direction.x*t,y:origin.y+direction.y*t}});
 }
 hits.sort((a,b)=>a.t-b.t);
 let unique=[];
 for(let hit of hits){let prior=unique.at(-1),separation=prior?Math.abs(hit.t-prior.t):Infinity;if(prior&&separation<=EPS)continue;if(prior&&separation<=EPS*10)throw Error('Boundary intersections are too close to resolve safely.');unique.push(hit)}
 if(!unique.length)throw Error('No boundary LINE meets the selected endpoint’s extension ray.');
 let end=unique[0].point;
 if(distance(origin,end)<=EPS)throw Error('The endpoint already meets the nearest boundary.');
 return {...line,[endpoint]:{...origin,x:end.x,y:end.y},intersection:end};
}
function intersectingLines(first,second){
 checkedLine(first,'First LINE');checkedLine(second,'Second LINE');
 let q=intersection(first.a,first.b,second.a,second.b);
 if(!q)throw Error('The selected LINEs must intersect as finite segments.');
 if(distance(first.a,first.b)<EPS||distance(second.a,second.b)<EPS)throw Error('Both LINEs must have nonzero length.');
 let p={x:q.x,y:q.y};
 return {p,t:q.t,u:q.u};
}
function selectedRays(first,second,corner,p){
 if(!corner||![corner.x,corner.y].every(Number.isFinite))throw Error('Pick a valid corner direction.');
 let hit=intersectingLines(first,second),rays=[];
 for(let line of [first,second]){
  let d=vector(line.a,line.b),size=Math.hypot(d.x,d.y),unit={x:d.x/size,y:d.y/size},projection=dot2(vector(hit.p,corner),unit);
  if(Math.abs(projection)<=EPS*10)throw Error('Pick clearly inside one of the four corners formed by the LINEs.');
  let direction={x:unit.x*Math.sign(projection),y:unit.y*Math.sign(projection)},end=endpointAlong(line,hit.p,direction),available=dot2(vector(hit.p,line[end]),direction);
  if(available<=EPS)throw Error('The chosen corner does not extend along both selected LINE segments.');
  rays.push({line,direction,end,available});
 }
 let dot=Math.max(-1,Math.min(1,dot2(rays[0].direction,rays[1].direction))),angle=Math.acos(dot);
 if(angle<=1e-7||Math.PI-angle<=1e-7)throw Error('Parallel or nearly parallel LINEs do not define a stable corner.');
 return {...hit,rays,angle};
}
function positiveModificationDistance(value,label){
 if(!Number.isFinite(value)||value<=EPS)throw Error(`${label} must be a positive finite distance.`);
}
function shortenLineAt(line,end,point){let changed=structuredClone(line);changed[end]={...changed[end],x:point.x,y:point.y};return changed}
export function filletLines(first,second,radius,corner){
 positiveModificationDistance(radius,'Fillet radius');
 let {p,rays,angle}=selectedRays(first,second,corner),tangent=radius/Math.tan(angle/2);
 if(!Number.isFinite(tangent)||rays.some(ray=>tangent>ray.available+EPS))throw Error('Fillet radius is too large for the selected LINE lengths.');
 let points=rays.map(ray=>({x:p.x+ray.direction.x*tangent,y:p.y+ray.direction.y*tangent})),bisector={x:rays[0].direction.x+rays[1].direction.x,y:rays[0].direction.y+rays[1].direction.y},bisectorLength=Math.hypot(bisector.x,bisector.y);
 if(bisectorLength<=EPS)throw Error('The selected corner has no stable fillet bisector.');
 let centerDistance=radius/Math.sin(angle/2),center={x:p.x+bisector.x/bisectorLength*centerDistance,y:p.y+bisector.y/bisectorLength*centerDistance},angles=points.map(point=>Math.atan2(point.y-center.y,point.x-center.x)),sweep=(angles[1]-angles[0]+Math.PI*2)%(Math.PI*2),start=sweep<=Math.PI?angles[0]:angles[1],end=sweep<=Math.PI?angles[1]:angles[0];
 if(distance(points[0],points[1])<=EPS)throw Error('Fillet would collapse to a point.');
 return {first:shortenLineAt(first,rays[0].end,points[0]),second:shortenLineAt(second,rays[1].end,points[1]),arc:{type:'arc',a:center,r:radius,start,end},tangentPoints:points,corner:p};
}
export function chamferLines(first,second,offset,corner){
 positiveModificationDistance(offset,'Chamfer distance');
 let {p,rays}=selectedRays(first,second,corner);
 if(rays.some(ray=>offset>ray.available+EPS))throw Error('Chamfer distance is too large for the selected LINE lengths.');
 let points=rays.map(ray=>({x:p.x+ray.direction.x*offset,y:p.y+ray.direction.y*offset}));
 if(distance(points[0],points[1])<=EPS)throw Error('Chamfer would collapse to a point.');
 return {first:shortenLineAt(first,rays[0].end,points[0]),second:shortenLineAt(second,rays[1].end,points[1]),connector:{type:'line',a:points[0],b:points[1]},corner:p};
}
export function pointAt(p,s){for(let i=1;i<p.length;i++){let l=distance(p[i-1],p[i]);if(s<=l+EPS){let t=l?Math.max(0,Math.min(1,s/l)):0;return {x:p[i-1].x+(p[i].x-p[i-1].x)*t,y:p[i-1].y+(p[i].y-p[i-1].y)*t}}s-=l}return {...p.at(-1)}}
export function station(n){let sign=n<0?'-':'';n=Math.abs(n);return `${sign}${Math.floor(n/100)}+${(n%100).toFixed(2).padStart(5,'0')}`}
function circum(a,b,c){let d=2*(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));if(Math.abs(d)<EPS)return null;let aa=a.x*a.x+a.y*a.y,bb=b.x*b.x+b.y*b.y,cc=c.x*c.x+c.y*c.y;let x=(aa*(b.y-c.y)+bb*(c.y-a.y)+cc*(a.y-b.y))/d,y=(aa*(c.x-b.x)+bb*(a.x-c.x)+cc*(b.x-a.x))/d;return {x,y,r2:(a.x-x)**2+(a.y-y)**2}}
// Bowyer–Watson, unconstrained TIN. Working coordinates are normalized for stability.
export function triangulate(input){if(input.length<3)throw Error('At least three survey points are required.');if(input.length>1500)throw Error('TIN generation currently supports up to 1,500 points.');let unique=new Map;input.forEach(p=>{let k=`${p.x},${p.y}`;if(unique.has(k))throw Error('Duplicate XY coordinates found. Remove duplicates before creating a TIN.');unique.set(k,p)});let cx=input.reduce((s,p)=>s+p.x,0)/input.length,cy=input.reduce((s,p)=>s+p.y,0)/input.length,span=Math.max(...input.map(p=>Math.max(Math.abs(p.x-cx),Math.abs(p.y-cy))));if(span<EPS)throw Error('Survey points are coincident.');let pts=input.map(p=>({x:(p.x-cx)/span,y:(p.y-cy)/span})),n=pts.length;pts.push({x:-20,y:-20},{x:0,y:20},{x:20,y:-20});let tris=[[n,n+1,n+2]];for(let i=0;i<n;i++){let edges=new Map,keep=[];for(let t of tris){let c=circum(...t.map(j=>pts[j]));if(c&&((pts[i].x-c.x)**2+(pts[i].y-c.y)**2)<=c.r2+1e-10){for(let j=0;j<3;j++){let a=t[j],b=t[(j+1)%3],key=[a,b].sort((x,y)=>x-y).join(',');if(edges.has(key))edges.delete(key);else edges.set(key,[a,b])}}else keep.push(t)}tris=keep.concat([...edges.values()].map(([a,b])=>[a,b,i]))}let result=tris.filter(t=>t.every(i=>i<n)&&Math.abs(cross(...t.map(i=>pts[i])))>EPS);if(!result.length)throw Error('Survey points are collinear; a surface cannot be built.');return result}
export function interpolate(p,points,tris){for(let t of tris){let [a,b,c]=t.map(i=>points[i]),den=cross(a,b,c),u=cross(p,b,c)/den,v=cross(a,p,c)/den,w=1-u-v;if(u>=-EPS&&v>=-EPS&&w>=-EPS)return u*a.z+v*b.z+w*c.z}return null}
export function contours(points,tris,interval){if(!(interval>0))throw Error('Contour interval must be positive.');let min=Math.min(...points.map(p=>p.z)),max=Math.max(...points.map(p=>p.z));if((max-min)/interval>250)throw Error('Use a larger interval (maximum 250 contour levels).');let lines=[];for(let z=Math.ceil(min/interval)*interval;z<=max+EPS;z+=interval){for(let t of tris){let p=t.map(i=>points[i]),hits=[];for(let i=0;i<3;i++){let a=p[i],b=p[(i+1)%3];if((a.z<=z&&b.z>z)||(b.z<=z&&a.z>z)){let f=(z-a.z)/(b.z-a.z);hits.push({x:a.x+f*(b.x-a.x),y:a.y+f*(b.y-a.y)})}}if(hits.length===2)lines.push({a:hits[0],b:hits[1],z})}}return lines}
// Exact planar TIN volumes relative to a constant elevation, including triangles crossing datum.
export function volumes(points,tris,datum){let cut=0,fill=0,totalArea=0;function clip(poly,positive){let out=[];for(let i=0;i<poly.length;i++){let a=poly[i],b=poly[(i+1)%poly.length],ina=positive?a.h>=0:a.h<=0,inb=positive?b.h>=0:b.h<=0;if(ina)out.push(a);if(ina!==inb){let t=a.h/(a.h-b.h);out.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y),h:0})}}return out}function integrate(poly){let v=0;for(let i=1;i<poly.length-1;i++)v+=Math.abs(cross(poly[0],poly[i],poly[i+1]))/2*(poly[0].h+poly[i].h+poly[i+1].h)/3;return v}for(let t of tris){let p=t.map(i=>({...points[i],h:points[i].z-datum}));totalArea+=area(p);cut+=integrate(clip(p,true));fill-=integrate(clip(p,false))}return {cut,fill,area:totalArea,net:cut-fill}}
export function parsePoints(text,format){let rows=text.trim().split(/\r?\n/).filter(s=>s.trim()&&!s.trim().startsWith('#'));if(rows.length>1501)throw Error('Maximum 1,500 survey points.');let out=[];for(let i=0;i<rows.length;i++){let c=parseCSVRow(rows[i]);let p=format==='pnezd'?{id:c[0],y:+c[1],x:+c[2],z:+c[3],description:c.slice(4).join(',')}:{id:String(out.length+1),x:+c[0],y:+c[1],z:+c[2],description:c.slice(3).join(',')};let need=format==='pnezd'?4:3;if(c.length<need||![p.x,p.y,p.z].every(Number.isFinite)||c.slice(format==='pnezd'?1:0,need).some(s=>!s)){if(i===0&&/^(point|number|id|x|easting|northing|name)/i.test(c[0]))continue;throw Error(`Invalid point data on row ${i+1}.`)}out.push(p)}if(!out.length)throw Error('No valid points found.');return out}

export function parseCSVRow(row){let out=[],value='',quoted=false;for(let i=0;i<row.length;i++){let c=row[i];if(c==='"'){if(quoted&&row[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if((c===','||c==='\t')&&!quoted){out.push(value.trim());value=''}else value+=c}if(quoted)throw Error('Unclosed CSV quote.');out.push(value.trim());return out}
