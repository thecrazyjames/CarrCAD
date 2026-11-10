export const LINE_TYPES=Object.freeze(['continuous','dashed','dotted','dash-dot','center','hidden','phantom','divide','long-dash','short-dash','dash-dot-dot','property-boundary','floodplain','storm-sewer','sanitary-sewer','water-main','gas-line','electric-line','telecom-line','fence-line','tree-line']);
export const LINE_TYPE_DASHES=Object.freeze({
 continuous:[],
 dashed:[8,5],
 dotted:[1,4],
 'dash-dot':[8,4,1,4],
 center:[12,3,2,3],
 hidden:[4,3],
 phantom:[12,3,2,3,2,3],
 divide:[12,3,2,3,2,3,2,3],
 'long-dash':[16,5],
 'short-dash':[3,3],
 'dash-dot-dot':[8,3,1,3,1,3],
 'property-boundary':[16,4,1,4],
 floodplain:[16,3,1,3,1,3],
 'storm-sewer':[12,3,1,3],
 'sanitary-sewer':[10,3,1,3,1,3],
 'water-main':[12,3,2,3,2,3],
 'gas-line':[8,2,2,2],
 'electric-line':[6,2,1,2],
 'telecom-line':[5,2,1,2,1,2],
 'fence-line':[8,4],
 'tree-line':[3,1,1,1]
});
export const LINE_TYPE_MARKERS=Object.freeze({'fence-line':'cross'});
export function lineTypeMarkerSegments(points,closed,spacing=12,size=4,offset=10){
 if(!Array.isArray(points)||!Number.isFinite(spacing)||spacing<=0||!Number.isFinite(size)||size<=0||!Number.isFinite(offset)||offset<0)throw Error('Invalid line-type marker geometry.');
 if(points.length<2)return [];
 let segments=[],count=closed?points.length:points.length-1,half=size/(2*Math.SQRT2);
 for(let index=0;index<count;index++){
  let a=points[index],b=points[(index+1)%points.length];
  if(![a?.x,a?.y,b?.x,b?.y].every(Number.isFinite))throw Error('Invalid line-type marker geometry.');
  let dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  if(length<=0)continue;
  let spacingForSegment=Math.max(spacing,length/500),start=spacingForSegment===spacing?offset:Math.min(spacingForSegment/2,offset*spacingForSegment/spacing),tx=dx/length,ty=dy/length,nx=-ty,ny=tx;
  for(let distance=start;distance+size/2<length;distance+=spacingForSegment){
   let x=a.x+tx*distance,y=a.y+ty*distance;
   segments.push([{x:x-half*(tx+nx),y:y-half*(ty+ny)},{x:x+half*(tx+nx),y:y+half*(ty+ny)}]);
   segments.push([{x:x-half*(tx-nx),y:y-half*(ty-ny)},{x:x+half*(tx-nx),y:y+half*(ty-ny)}]);
  }
 }
 return segments;
}
export function lineTypePreviewSVG(lineType,color='#667985'){
 if(!LINE_TYPES.includes(lineType)||!/^#[0-9a-f]{6}$/i.test(color))throw Error('Invalid line-type preview.');
 let dash=LINE_TYPE_DASHES[lineType],points=[{x:2,y:8},{x:78,y:8}],markers=LINE_TYPE_MARKERS[lineType]==='cross'?lineTypeMarkerSegments(points,false,12,4,10):[];
 return `<svg class="line-type-preview" viewBox="0 0 80 16" role="img" aria-label="${lineType.replaceAll('-',' ')} sample"><path d="M2 8H78" fill="none" stroke="${color}" stroke-width="1.5"${dash.length?` stroke-dasharray="${dash.join(' ')}"`:''}/>${markers.map(([a,b])=>`<path d="M${a.x} ${a.y}L${b.x} ${b.y}" fill="none" stroke="${color}" stroke-width="1.5"/>`).join('')}</svg>`;
}
export const LINE_WEIGHTS=Object.freeze([0.13,0.18,0.25,0.35,0.5,0.7,1]);
export const HATCH_PATTERNS=Object.freeze([
 {value:'none',label:'None'},
 {value:'solid',label:'Solid'},
 {value:'ansi31',label:'ANSI31 diagonal'},
 {value:'crosshatch',label:'Crosshatch'},
 {value:'ansi32',label:'ANSI32 cross diagonal'},
 {value:'earth',label:'Earth / soil'},
 {value:'brick',label:'Brick'},
 {value:'pavers',label:'Pavers'},
 {value:'concrete',label:'Concrete'},
 {value:'wetland',label:'Wetland'}
]);

const existingColor='#667985',proposedColor='#a64c4c';
const layer=(name,category,lineType='continuous',lineWeight=.25,color=existingColor,hatchPattern)=>({name,category,lineType,lineWeight,color,...(hatchPattern?{hatchPattern}:{})});
export const CIVIL_LAYER_PRESETS=Object.freeze([
 layer('EXISTING PROPERTY BOUNDARY','Existing site','continuous',.5),
 layer('PROPERTY BOUNDARY TO BE REMOVED','Existing site','short-dash',.35),
 layer('ADJOINING PROPERTY LINE','Existing site','property-boundary',.35),
 layer('FLOOD PLAIN LINE','Existing site','floodplain',.35),
 layer('TEST PIT LOCATION','Existing site','continuous',.25),
 layer('EXISTING RIGHT OF WAY','Existing site','long-dash',.35),
 layer('EXISTING DRAINAGE LINE','Existing utilities','storm-sewer',.25),
 layer('EXISTING 2 FT CONTOUR','Existing terrain','continuous',.18),
 layer('EXISTING 10 FT CONTOUR','Existing terrain','continuous',.35),
 layer('EXISTING SLOPE ELEVATION','Existing terrain','dotted',.18),
 layer('EXISTING BRICK','Existing materials','continuous',.25,existingColor,'brick'),
 layer('EXISTING PAVERS','Existing materials','continuous',.25,existingColor,'pavers'),
 layer('EXISTING CONCRETE','Existing materials','continuous',.25,existingColor,'concrete'),
 layer('EXISTING BRUSHLINE','Existing landscape','tree-line',.25),
 layer('EXISTING TREELINE','Existing landscape','tree-line',.25),
 layer('EXISTING TREE SYMBOLS','Existing landscape','continuous',.25),
 layer('EXISTING LIGHT','Existing utilities','continuous',.25),
 layer('EXISTING UTILITY POLE','Existing utilities','continuous',.25),
 layer('EXISTING WELL','Existing utilities','continuous',.25),
 layer('EXISTING WATER VALVE','Existing utilities','continuous',.25),
 layer('EXISTING SIGN','Existing site','continuous',.25),
 layer('EXISTING FENCE LINE','Existing site','fence-line',.25),
 layer('SOIL LINE AND DESCRIPTION','Existing terrain','dashed',.18),
 layer('STEP SLOPE 15%-25%','Existing terrain','short-dash',.18),
 layer('STEP SLOPE 25%-UP','Existing terrain','dashed',.25),
 layer('WETLAND AREA','Existing terrain','floodplain',.25,existingColor,'wetland'),
 layer('EXISTING STORM STRUCTURES & PIPE','Existing utilities','storm-sewer',.35),
 layer('EXISTING SANITARY STRUCTURES & PIPE','Existing utilities','sanitary-sewer',.35),
 layer('EXISTING ROAD CENTERLINE','Existing site','center',.35),
 layer('EXISTING CURB LINE','Existing site','continuous',.35),
 layer('EXISTING ROAD/PAVING','Existing materials','continuous',.25,existingColor,'pavers'),
 layer('EXISTING DRIVEWAY','Existing materials','continuous',.25,existingColor,'concrete'),
 layer('EXISTING STONE DIKE','Existing site','divide',.35),
 layer('EXISTING SANITARY LATERAL','Existing utilities','sanitary-sewer',.25),
 layer('EXISTING SANITARY FORCE MAIN','Existing utilities','sanitary-sewer',.35),
 layer('EXISTING WATER LINE','Existing utilities','water-main',.25),
 layer('EXISTING ELECTRIC LINE','Existing utilities','electric-line',.25),
 layer('EXISTING GAS LINE','Existing utilities','gas-line',.25),
 layer('EXISTING TELEPHONE LINE','Existing utilities','telecom-line',.25),
 layer('EXISTING FIBER OPTIC LINE','Existing utilities','divide',.25),
 layer('PROPOSED DITCH LINE','Proposed site','floodplain',.35,proposedColor),
 layer('PROPOSED MONUMENT','Proposed site','continuous',.35,proposedColor),
 layer('PROPOSED RIGHT OF WAY','Proposed site','property-boundary',.5,proposedColor),
 layer('PROPOSED EASEMENT LINE','Proposed site','dash-dot',.25,proposedColor),
 layer('PROPOSED 2 FT CONTOUR','Proposed terrain','continuous',.18,proposedColor),
 layer('PROPOSED 10 FT CONTOUR','Proposed terrain','continuous',.35,proposedColor),
 layer('PROPOSED SPOT ELEVATION','Proposed terrain','continuous',.25,proposedColor),
 layer('PROPOSED CONCRETE','Proposed materials','continuous',.25,proposedColor,'concrete'),
 layer('PROPOSED TREELINE','Proposed landscape','tree-line',.25,proposedColor),
 layer('PROPOSED UTILITY POLE','Proposed utilities','continuous',.25,proposedColor),
 layer('PROPOSED WATER VALVE','Proposed utilities','continuous',.25,proposedColor),
 layer('PROPOSED SIGN','Proposed site','continuous',.25,proposedColor),
 layer('PROPOSED FENCE LINE','Proposed site','fence-line',.25,proposedColor),
 layer('PROPOSED STORM STRUCTURES & PIPE','Proposed utilities','storm-sewer',.35,proposedColor),
 layer('PROPOSED SANITARY STRUCTURES & PIPE','Proposed utilities','sanitary-sewer',.35,proposedColor),
 layer('PROPOSED ROAD CENTERLINE','Proposed site','center',.35,proposedColor),
 layer('PROPOSED CURB LINE','Proposed site','continuous',.35,proposedColor),
 layer('PROPOSED ROAD/PAVING','Proposed materials','continuous',.25,proposedColor,'pavers'),
 layer('PROPOSED DRIVEWAY','Proposed materials','continuous',.25,proposedColor,'concrete'),
 layer('PROPOSED WALL','Proposed site','continuous',.5,proposedColor),
 layer('PROPOSED SANITARY LATERAL','Proposed utilities','sanitary-sewer',.25,proposedColor),
 layer('PROPOSED SANITARY FORCE MAIN','Proposed utilities','sanitary-sewer',.35,proposedColor),
 layer('PROPOSED WATER LINE','Proposed utilities','water-main',.25,proposedColor),
 layer('PROPOSED ELECTRIC LINE','Proposed utilities','electric-line',.25,proposedColor),
 layer('PROPOSED GAS LINE','Proposed utilities','gas-line',.25,proposedColor),
 layer('PROPOSED TELEPHONE LINE','Proposed utilities','telecom-line',.25,proposedColor),
 layer('PROPOSED FIBER OPTIC LINE','Proposed utilities','divide',.25,proposedColor)
].map(Object.freeze));

export function civilLayersToAdd(existingLayers,presets=CIVIL_LAYER_PRESETS){
 if(!Array.isArray(existingLayers)||!Array.isArray(presets))throw Error('Civil layer presets require valid layer lists.');
 let existingNames=new Set(existingLayers.map(item=>item.name.toLowerCase())),additions=[];
 for(let item of presets){let name=item.name.toLowerCase();if(existingNames.has(name))continue;existingNames.add(name);additions.push(item)}
 if(existingLayers.length+additions.length>100)throw Error('Adding these civil layers would exceed the 100-layer project limit. Add only the layers you need.');
 return additions.map(item=>({...item,visible:true,locked:false}));
}

export function lineWeightPixels(weight){
 return Math.min(4,Math.max(0.75,(Number(weight)||0.25)*5.2));
}

export function drawHatch(ctx,points,pattern,color,scale=1){
 if(pattern==='none'||!HATCH_PATTERNS.some(item=>item.value===pattern)||points.length<3)return;
 if(!Number.isFinite(scale)||scale<.1||scale>100)throw Error('Hatch scale must be from 0.1 to 100.');
 let xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 let center={x:(minX+maxX)/2,y:(minY+maxY)/2},diagonal=Math.hypot(maxX-minX,maxY-minY);
 ctx.save();
 ctx.setLineDash([]);
 ctx.beginPath();
 ctx.moveTo(points[0].x,points[0].y);
 for(let p of points.slice(1))ctx.lineTo(p.x,p.y);
 ctx.closePath();
 ctx.clip();
 ctx.fillStyle=color;
 ctx.strokeStyle=color;
 ctx.globalAlpha=0.55;
 if(pattern==='solid'){
  ctx.globalAlpha=0.16;
  ctx.fillRect(minX,minY,maxX-minX,maxY-minY);
 }else if(pattern==='earth'){
  ctx.globalAlpha=.5;
  ctx.lineWidth=.8;
  let spacing=Math.max(9,diagonal/80)*scale;
  for(let y=minY;y<=maxY;y+=spacing)for(let x=minX;x<=maxX;x+=spacing){
   ctx.beginPath();
   ctx.arc(x+(Math.floor(y/spacing)%2)*spacing*.5,y,1,0,Math.PI*2);
   ctx.stroke();
  }
 }else if(pattern==='concrete'){
  ctx.globalAlpha=.45;
  let spacing=Math.max(7,diagonal/100)*scale;
  for(let y=minY;y<=maxY;y+=spacing)for(let x=minX;x<=maxX;x+=spacing){
   ctx.beginPath();
   ctx.arc(x+(Math.floor(y/spacing)%2)*spacing*.5,y,Math.max(.5,spacing*.035),0,Math.PI*2);
   ctx.stroke();
  }
 }else if(pattern==='brick'||pattern==='pavers'||pattern==='wetland'){
  let spacing=Math.max(8,diagonal/55)*scale,row=0;
  ctx.lineWidth=.8;
  for(let y=minY;y<=maxY;y+=spacing,row++){
   ctx.beginPath();
   ctx.moveTo(minX,y);
   ctx.lineTo(maxX,y);
   if(pattern==='wetland'){
    for(let x=minX;x<maxX;x+=spacing)ctx.lineTo(Math.min(maxX,x+spacing*.25),y-spacing*.2),ctx.lineTo(Math.min(maxX,x+spacing*.5),y),ctx.lineTo(Math.min(maxX,x+spacing*.75),y+spacing*.2),ctx.lineTo(Math.min(maxX,x+spacing),y);
   }else{
    let cell=pattern==='brick'?spacing*2:spacing,offset=pattern==='brick'&&row%2?cell/2:0;
    for(let x=minX+offset;x<=maxX;x+=cell){ctx.moveTo(x,y);ctx.lineTo(x,y+spacing)}
   }
   ctx.stroke();
  }
 }else{
  let angles=pattern==='crosshatch'||pattern==='ansi32'?[-Math.PI/4,Math.PI/4]:[-Math.PI/4];
  ctx.lineWidth=0.8;
  for(let angle of angles){
   let normal={x:-Math.sin(angle),y:Math.cos(angle)};
   let centerProjection=center.x*normal.x+center.y*normal.y;
   let projections=points.map(p=>p.x*normal.x+p.y*normal.y);
   let min=Math.min(...projections),max=Math.max(...projections);
   let spacing=Math.max(8,(max-min)/1000)*scale;
   let start=Math.ceil(min/spacing)*spacing;
   for(let offset=start;offset<=max;offset+=spacing){
    let origin={x:center.x+normal.x*(offset-centerProjection),y:center.y+normal.y*(offset-centerProjection)};
    let direction={x:Math.cos(angle),y:Math.sin(angle)},length=diagonal+4;
    ctx.beginPath();
    ctx.moveTo(origin.x-direction.x*length,origin.y-direction.y*length);
    ctx.lineTo(origin.x+direction.x*length,origin.y+direction.y*length);
    ctx.stroke();
   }
  }
 }
 ctx.restore();
}
