import {simplePolygon} from './geometry.js';
import {expandModelEntities} from './blocks.js';
import {LINE_TYPES,LINE_TYPE_MARKERS,lineTypeMarkerSegments} from './appearance.js';
import {textStyleFor} from './text-styles.js';
import {leaderArrowGeometry,leaderArrowSizeFor,leaderPathPoints,leaderPointsForEntity} from './leader-geometry.js';
export const unitCodes={in:1,ft:2,mm:4,m:6};
export function entityPoints(e){if(e.points)return e.points;if(e.type==='rect')return [e.a,{x:e.b.x,y:e.a.y},e.b,{x:e.a.x,y:e.b.y}];if(e.a)return e.b?[e.a,e.b]:[e.a];return []}
export function exportDXF(model){
 let o=[];const p=(...a)=>o.push(...a),clean=s=>s.replace(/[<>/\\":;?*|=,]/g,'_');
 let patterns={continuous:[],dashed:[.5,-.25],dotted:[.05,-.25],'dash-dot':[.5,-.25,.05,-.25],center:[.75,-.1875,.125,-.1875],hidden:[.25,-.1875],phantom:[.75,-.1875,.125,-.1875,.125,-.1875],divide:[.75,-.1875,.125,-.1875,.125,-.1875,.125,-.1875],'long-dash':[1,-.3125],'short-dash':[.1875,-.1875],'dash-dot-dot':[.5,-.1875,.0625,-.1875,.0625,-.1875],'property-boundary':[1,-.25,.0625,-.25],floodplain:[1,-.1875,.0625,-.1875,.0625,-.1875],'storm-sewer':[.75,-.1875,.0625,-.1875],'sanitary-sewer':[.625,-.1875,.0625,-.1875,.0625,-.1875],'water-main':[.75,-.1875,.125,-.1875,.125,-.1875],'gas-line':[.5,-.125,.125,-.125],'electric-line':[.375,-.125,.0625,-.125],'telecom-line':[.3125,-.125,.0625,-.125,.0625,-.125],'fence-line':[.5,-.25],'tree-line':[.1875,-.0625,.0625,-.0625]},types=LINE_TYPES.map(value=>({name:value.toUpperCase().replaceAll('-',''),description:value+' line',segments:patterns[value]})),typeName=Object.fromEntries(types.map((type,index)=>[LINE_TYPES[index],type.name]));
 p(0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1015',9,'$INSUNITS',70,unitCodes[model.units],0,'ENDSEC',0,'SECTION',2,'TABLES',0,'TABLE',2,'LTYPE',70,types.length);
 for(let t of types)p(0,'LTYPE',100,'AcDbSymbolTableRecord',100,'AcDbLinetypeTableRecord',2,t.name,70,0,3,t.description,72,65,73,t.segments.length,40,t.segments.reduce((sum,n)=>sum+Math.abs(n),0),...t.segments.flatMap(n=>[49,n]));
 p(0,'ENDTAB',0,'TABLE',2,'LAYER',70,model.layers.length);
 for(let l of model.layers)p(0,'LAYER',100,'AcDbSymbolTableRecord',100,'AcDbLayerTableRecord',2,clean(l.name),70,l.locked?4:0,62,l.visible?7:-7,420,parseInt(l.color.slice(1),16),6,typeName[l.lineType]||'CONTINUOUS',370,Math.round((l.lineWeight??.25)*100));
 p(0,'ENDTAB',0,'ENDSEC',0,'SECTION',2,'ENTITIES');
 function layerStyle(e){return model.layers.find(l=>l.id===e.layer)}
 function layer(e){let l=layerStyle(e);return l?clean(l.name):'Drawing'}
 function line(a,b,l,linetype){p(0,'LINE',8,l,...(linetype?[6,linetype]:[]),10,a.x,20,a.y,30,a.z||0,11,b.x,21,b.y,31,b.z||0)}
 function solid(points,l){let vertices=[...points,points[2]];p(0,'SOLID',8,l,...vertices.flatMap((point,index)=>[10+index,point.x,20+index,point.y,30+index,point.z||0]))}
 function txt(a,text,l,size=1,rotation=0){p(0,'TEXT',8,l,10,a.x,20,a.y,30,a.z||0,40,size,...(rotation?[50,rotation*180/Math.PI]:[]),1,String(text).replace(/[\r\n]/g,' '))}
 function hatch(e,l){
  let definitions={
   solid:{name:'SOLID',solid:1,lines:[]},
   ansi31:{name:'ANSI31',solid:0,lines:[{angle:45,offset:[0,.125],dash:[.1768,-.1768]}]},
   crosshatch:{name:'ANSI37',solid:0,lines:[{angle:45,offset:[0,.125],dash:[.1768,-.1768]},{angle:135,offset:[0,.125],dash:[.1768,-.1768]}]},
   ansi32:{name:'ANSI32',solid:0,lines:[{angle:45,offset:[0,.25],dash:[.1768,-.1768]},{angle:135,offset:[0,.25],dash:[.1768,-.1768]}]},
   earth:{name:'EARTH',solid:0,lines:[{angle:0,offset:[0,.2],dash:[0,-.2]}]},
   brick:{name:'BRICK',solid:0,lines:[{angle:0,offset:[0,.25],dash:[]},{angle:90,offset:[0,.5],dash:[]},{angle:90,offset:[.25,.5],dash:[]}]},
   pavers:{name:'PAVERS',solid:0,lines:[{angle:0,offset:[0,.25],dash:[]},{angle:90,offset:[0,.25],dash:[]}]},
   concrete:{name:'CONCRETE',solid:0,lines:[{angle:0,offset:[0,.2],dash:[.02,-.18]}]},
   wetland:{name:'WETLAND',solid:0,lines:[{angle:0,offset:[0,.25],dash:[.1,-.1,.1,-.1]}]}
  },definition=definitions[e.hatchPattern],pts=entityPoints(e),scale=e.hatchScale??1;
  if(!definition||pts.length<3)return;
  p(0,'HATCH',100,'AcDbEntity',8,l,100,'AcDbHatch',10,0,20,0,30,0,210,0,220,0,230,1,2,definition.name,70,definition.solid,71,0,91,1,92,3,72,0,73,1,93,pts.length);
  for(let q of pts)p(10,q.x,20,q.y);
  p(97,0,75,0,76,1,78,definition.lines.length);
  for(let pattern of definition.lines)p(53,pattern.angle,43,0,44,0,45,pattern.offset[0]*scale,46,pattern.offset[1]*scale,79,pattern.dash.length,...pattern.dash.flatMap(n=>[49,n*scale]));
  p(98,0);
 }
 let expandedEntities=expandModelEntities(model.entities,model.blocks||[]);
 for(let e of expandedEntities){
  let style=layerStyle(e)||e.blockStyle,l=layer(e),closed=e.closed||e.type==='rect'||e.type==='parcel',hatchPattern=e.hatchPattern??style?.hatchPattern;
  if(closed&&hatchPattern&&hatchPattern!=='none')hatch({...e,hatchPattern},l);
  if(e.type==='leader'){let leaderPoints=leaderPointsForEntity(e,expandedEntities),pts=leaderPathPoints(leaderPoints,e.leaderLineStyle||'straight',e.size||1),arrow=leaderArrowGeometry(leaderPoints,e.leaderArrowType||'arrow',leaderArrowSizeFor(e)),lineType=e.leaderLineType?typeName[e.leaderLineType]:null;p(0,'LWPOLYLINE',8,l,...(lineType?[6,lineType]:[]),90,pts.length,70,0);for(let q of pts)p(10,q.x,20,q.y);if(arrow.type==='filled')solid(arrow.points,l);else if(arrow.type==='arrow')for(let segment of arrow.lines)line(segment[0],segment[1],l);else if(arrow.type==='dot')p(0,'CIRCLE',8,l,10,arrow.center.x,20,arrow.center.y,30,0,40,arrow.radius);if(e.note?.trim()&&!e.leaderTextId)txt(leaderPoints.at(-1),e.note,l,e.size||1,e.blockRotation||0)}
  else if(e.type==='line'||e.type==='dim'){line(e.a,e.b,l);if(e.type==='dim')txt({x:(e.a.x+e.b.x)/2,y:(e.a.y+e.b.y)/2+.5},Math.hypot(e.b.x-e.a.x,e.b.y-e.a.y).toFixed(2)+' '+model.units,l,.8,e.blockRotation||0)}
  else if(['rect','polyline','parcel','alignment'].includes(e.type)){let pts=entityPoints(e);p(0,'LWPOLYLINE',8,l,90,pts.length,70,closed?1:0);for(let q of pts)p(10,q.x,20,q.y)}
  else if(e.type==='circle'||e.type==='arc'){p(0,e.type.toUpperCase(),8,l,10,e.a.x,20,e.a.y,30,0,40,e.r);if(e.type==='arc')p(50,e.start*180/Math.PI,51,e.end*180/Math.PI)}
  else if(e.type==='text')txt(e.a,e.text,l,e.size??textStyleFor(model,e.textStyleId).textHeight,e.blockRotation||0);
  else if(e.type==='point')p(0,'POINT',8,l,10,e.a.x,20,e.a.y,30,e.a.z||0);
  if(LINE_TYPE_MARKERS[style?.lineType]==='cross'&&['line','polyline','rect','parcel'].includes(e.type))for(let [a,b]of lineTypeMarkerSegments(entityPoints(e),closed,.75,.25,.625))line(a,b,l,'CONTINUOUS');
 }
if(model.surface?.triangles){let terrainPoints=new Map([...model.entities.filter(e=>e.type==='point').map(e=>[e.id,e.a]),...(model.surface.vertices||[]).map(e=>[e.id,e])]);for(let t of model.surface.triangles){let ps=t.map(id=>terrainPoints.get(id));if(ps.some(p=>!p))continue;p(0,'3DFACE',8,'Terrain');for(let i=0;i<4;i++){let q=ps[Math.min(i,2)];p(10+i,q.x,20+i,q.y,30+i,q.z)}}}p(0,'ENDSEC',0,'EOF');return o.join('\n')+'\n'}
function importDXFBase(text){let lines=text.replace(/\r/g,'').split('\n'),pairs=[];if(lines[0]?.startsWith('AutoCAD Binary'))throw Error('Binary DXF is not supported. Use ASCII DXF.');for(let i=0;i+1<lines.length;i+=2){let code=Number(lines[i].trim());if(!Number.isInteger(code))throw Error('Invalid ASCII DXF group code.');pairs.push([code,lines[i+1].trim()])}let groups=[],cur=null,inEntities=false,section=false,units=null;for(let i=0;i<pairs.length;i++){let [c,v]=pairs[i];if(c===9&&v==='$INSUNITS')units=pairs[i+1]?.[1];if(c===0&&v==='SECTION'){section=true;continue}if(section&&c===2){inEntities=v==='ENTITIES';section=false;continue}if(c===0&&v==='ENDSEC'){if(cur)groups.push(cur);cur=null;inEntities=false;continue}if(!inEntities)continue;if(c===0){if(cur)groups.push(cur);cur={kind:v,pairs:[]}}else if(cur)cur.pairs.push([c,v])}if(cur)groups.push(cur);if(!groups.length)throw Error('No ENTITIES section found in this DXF.');if(groups.length>20000)throw Error('DXF import supports at most 20,000 entities.');let entities=[],skipped={},faces=[];
for(let g of groups){let value=(c,d=0)=>g.pairs.find(p=>p[0]===c)?.[1]??d,n=c=>Number(value(c)),pt=(i=0)=>({x:n(10+i),y:n(20+i),z:n(30+i)}),layer=String(value(8,'Drawing')),e;switch(g.kind){case 'LINE':e={type:'line',a:pt(),b:pt(1)};break;case 'CIRCLE':e={type:'circle',a:pt(),r:n(40)};break;case 'ARC':e={type:'arc',a:pt(),r:n(40),start:n(50)*Math.PI/180,end:n(51)*Math.PI/180};break;case 'POINT':e={type:'point',a:pt(),name:String(value(5,'Imported point')),description:''};break;case 'TEXT':e={type:'text',a:pt(),text:String(value(1,'')),size:n(40)||1};break;case 'LWPOLYLINE':{if(g.pairs.some(([c,v])=>c===42&&Math.abs(+v)>1e-10)){skipped['LWPOLYLINE with bulges']=(skipped['LWPOLYLINE with bulges']||0)+1;continue}let points=[];for(let [c,v] of g.pairs){if(c===10)points.push({x:+v,y:0});if(c===20&&points.length)points.at(-1).y=+v}if(points.length<2)continue;e={type:'polyline',points,closed:!!(n(70)&1)};break}case '3DFACE':faces.push([pt(),pt(1),pt(2)]);if(Math.hypot(pt(3).x-pt(2).x,pt(3).y-pt(2).y)>1e-9)faces.push([pt(),pt(2),pt(3)]);continue;default:skipped[g.kind]=(skipped[g.kind]||0)+1;continue}let p=entityPoints(e);if(p.some(p=>![p.x,p.y,p.z??0].every(Number.isFinite))||(['circle','arc'].includes(e.type)&&!(e.r>0))){skipped.invalid=(skipped.invalid||0)+1;continue}entities.push({...e,layerName:layer})}return {entities,faces,skipped,units:Object.keys(unitCodes).find(k=>unitCodes[k]===+units)||null}}
function dxfEntityGroups(text){
 let lines=text.replace(/\r/g,'').split('\n'),pairs=[];
 for(let i=0;i+1<lines.length;i+=2){let code=Number(lines[i].trim());pairs.push([code,lines[i+1].trim()])}
 let groups=[],current=null,inEntities=false,awaitingSection=false;
 for(let [code,value] of pairs){
  if(code===0&&value==='SECTION'){awaitingSection=true;continue}
  if(awaitingSection&&code===2){inEntities=value==='ENTITIES';awaitingSection=false;continue}
  if(code===0&&value==='ENDSEC'){if(current)groups.push(current);current=null;inEntities=false;continue}
  if(!inEntities)continue;
  if(code===0){if(current)groups.push(current);current={kind:value,pairs:[]}}
  else if(current)current.pairs.push([code,value]);
 }
 if(current)groups.push(current);
 return groups;
}
function verticesFromPairs(pairs){
 let vertices=[],current=null;
 for(let [code,value] of pairs){
  if(code===10){current={x:Number(value),y:NaN,bulge:0};vertices.push(current)}
  else if(code===20&&current)current.y=Number(value);
  else if(code===42&&current)current.bulge=Number(value);
 }
 return vertices;
}
function tessellateBulges(vertices,closed){
 let result=[],edgeCount=closed?vertices.length:vertices.length-1;
 for(let i=0;i<vertices.length;i++){
  let a=vertices[i];result.push({x:a.x,y:a.y});
  if(i>=edgeCount)continue;
  let b=vertices[(i+1)%vertices.length],bulge=a.bulge;
  if(Math.abs(bulge)<1e-10)continue;
  let dx=b.x-a.x,dy=b.y-a.y,chord=Math.hypot(dx,dy),sweep=4*Math.atan(bulge);
  if(!Number.isFinite(sweep)||chord<1e-10)continue;
  let radius=chord*(1+bulge*bulge)/(4*Math.abs(bulge)),offset=chord*(1-bulge*bulge)/(4*bulge),cx=(a.x+b.x)/2-dy/chord*offset,cy=(a.y+b.y)/2+dx/chord*offset,start=Math.atan2(a.y-cy,a.x-cx),tolerance=Math.max(.001,radius*.002),step=Math.min(Math.PI/8,2*Math.acos(Math.max(-1,Math.min(1,1-tolerance/radius)))),count=Math.max(2,Math.min(128,Math.ceil(Math.abs(sweep)/(step||Math.PI/8))));
  for(let j=1;j<count;j++){let angle=start+sweep*j/count;result.push({x:cx+radius*Math.cos(angle),y:cy+radius*Math.sin(angle)})}
  if(result.length>10000)throw Error('DXF polyline exceeds the 10,000-vertex import limit after bulge conversion.');
 }
 return result;
}
function supportedHatch(group){
 let value=(code,fallback='')=>group.pairs.find(pair=>pair[0]===code)?.[1]??fallback,name=String(value(2)).toUpperCase(),pattern=name==='SOLID'?'solid':name==='ANSI31'?'ansi31':name==='ANSI32'?'ansi32':name==='EARTH'?'earth':name==='BRICK'?'brick':name==='PAVERS'?'pavers':name==='CONCRETE'?'concrete':name==='WETLAND'?'wetland':['ANSI37','CROSS','CROSSHATCH'].includes(name)?'crosshatch':null;
 if(!pattern)return null;
 let loops=[],index=0;
 while(index<group.pairs.length){
  while(index<group.pairs.length&&group.pairs[index][0]!==92)index++;
  if(index>=group.pairs.length)break;
  let flags=Number(group.pairs[index++][1]),end=index;
  while(end<group.pairs.length&&group.pairs[end][0]!==92&&group.pairs[end][0]!==75&&group.pairs[end][0]!==78)end++;
  if(!(flags&2)){index=end;continue}
  let path=group.pairs.slice(index,end),closed=path.find(pair=>pair[0]===73)?.[1]==='1',count=Number(path.find(pair=>pair[0]===93)?.[1]),vertices=verticesFromPairs(path.slice(Math.max(0,path.findIndex(pair=>pair[0]===93)+1)));
  if(!closed||!Number.isInteger(count)||count<3||count>4096||vertices.length!==count)return null;
  loops.push(tessellateBulges(vertices,true));index=end;
 }
 if(loops.length!==1||!simplePolygon(loops[0]))return null;
 return {type:'polyline',points:loops[0],closed:true,hatchPattern:pattern,layerName:String(value(8,'Drawing'))};
}
function removeSkipped(skipped,key){if(!skipped[key])return;skipped[key]--;if(!skipped[key])delete skipped[key]}
function sameRing(a,b){if(a.length!==b.length)return false;for(let start=0;start<b.length;start++)for(let direction of [1,-1])if(a.every((point,index)=>{let other=b[(start+direction*index+b.length*2)%b.length];return Math.abs(point.x-other.x)<1e-8&&Math.abs(point.y-other.y)<1e-8}))return true;return false}
export function importDXF(text){
 let result=importDXFBase(text),groups=dxfEntityGroups(text);
 for(let i=0;i<groups.length;i++){
  let group=groups[i];
  if(group.kind==='LWPOLYLINE'){
   let vertices=verticesFromPairs(group.pairs),closed=!!(Number(group.pairs.find(pair=>pair[0]===70)?.[1]||0)&1);
   if(vertices.length<2||!vertices.some(vertex=>Math.abs(vertex.bulge)>1e-10))continue;
   if(vertices.some(vertex=>![vertex.x,vertex.y,vertex.bulge].every(Number.isFinite))){removeSkipped(result.skipped,'LWPOLYLINE with bulges');result.skipped.invalid=(result.skipped.invalid||0)+1;continue}
   try{let points=tessellateBulges(vertices,closed);removeSkipped(result.skipped,'LWPOLYLINE with bulges');result.entities.push({type:'polyline',points,closed,layerName:String(group.pairs.find(pair=>pair[0]===8)?.[1]||'Drawing')})}catch{result.skipped.invalid=(result.skipped.invalid||0)+1}
  }else if(group.kind==='POLYLINE'){
   let flags=Number(group.pairs.find(pair=>pair[0]===70)?.[1]||0),vertices=[],sequence=[],next=i+1;
   while(next<groups.length&&groups[next].kind!=='SEQEND'){sequence.push(groups[next]);if(groups[next].kind==='VERTEX'){let pairs=groups[next].pairs,get=code=>Number(pairs.find(pair=>pair[0]===code)?.[1]);vertices.push({x:get(10),y:get(20),bulge:get(42)||0})}next++}
   if(next<groups.length)sequence.push(groups[next]);
   let supported=!(flags&(8|16|64))&&vertices.length>=2&&vertices.every(vertex=>Number.isFinite(vertex.x)&&Number.isFinite(vertex.y));
   if(supported){let closed=!!(flags&1);try{let points=tessellateBulges(vertices,closed);result.entities.push({type:'polyline',points,closed,layerName:String(group.pairs.find(pair=>pair[0]===8)?.[1]||'Drawing')});removeSkipped(result.skipped,'POLYLINE');for(let entry of sequence)removeSkipped(result.skipped,entry.kind)}catch{result.skipped.invalid=(result.skipped.invalid||0)+1}}
   i=next;
  }else if(group.kind==='HATCH'){
   let entity=supportedHatch(group);
   if(entity){removeSkipped(result.skipped,'HATCH');let boundary=result.entities.find(item=>item.type==='polyline'&&item.closed&&item.layerName===entity.layerName&&sameRing(item.points,entity.points));if(boundary)boundary.hatchPattern=entity.hatchPattern;else result.entities.push(entity)}
  }
 }
 return result;
}
export function csv(rows){return rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n')}
export function escapeXML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
