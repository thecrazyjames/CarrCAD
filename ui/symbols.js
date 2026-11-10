const symbols=[
 {id:'deciduous-tree',name:'Deciduous tree',category:'Landscape',parts:[{type:'circle',center:[0,0],radius:1},{type:'line',points:[[-.65,0],[.65,0]]},{type:'line',points:[[0,-.65],[0,.65]]},{type:'line',points:[[-.46,-.46],[.46,.46]]},{type:'line',points:[[-.46,.46],[.46,-.46]]}]},
 {id:'conifer',name:'Conifer tree',category:'Landscape',parts:[{type:'polyline',closed:true,points:[[0,1],[-.8,-.6],[.8,-.6]]},{type:'line',points:[[0,-.6],[0,-1]]}]},
 {id:'shrub',name:'Shrub',category:'Landscape',parts:[{type:'circle',center:[-.38,0],radius:.58},{type:'circle',center:[.38,0],radius:.58},{type:'circle',center:[0,.32],radius:.58}]},
 {id:'manhole',name:'Sanitary / storm manhole',category:'Utilities',parts:[{type:'circle',center:[0,0],radius:.82},{type:'circle',center:[0,0],radius:.62},{type:'line',points:[[-.32,0],[.32,0]]},{type:'line',points:[[0,-.32],[0,.32]]}]},
 {id:'catch-basin',name:'Catch basin',category:'Drainage',parts:[{type:'polyline',closed:true,points:[[-.9,-.65],[.9,-.65],[.9,.65],[-.9,.65]]},{type:'line',points:[[-.5,-.4],[-.5,.4]]},{type:'line',points:[[0,-.4],[0,.4]]},{type:'line',points:[[.5,-.4],[.5,.4]]}]},
 {id:'fire-hydrant',name:'Fire hydrant',category:'Utilities',parts:[{type:'circle',center:[0,0],radius:.25},{type:'line',points:[[0,-.8],[0,.8]]},{type:'line',points:[[-.52,-.35],[.52,-.35]]},{type:'line',points:[[-.45,.42],[.45,.42]]},{type:'line',points:[[-.5,-.35],[-.5,.1]]},{type:'line',points:[[.5,-.35],[.5,.1]]}]},
 {id:'light-pole',name:'Light pole',category:'Electrical',parts:[{type:'circle',center:[0,0],radius:.2},{type:'line',points:[[-.8,0],[.8,0]]},{type:'line',points:[[0,-.8],[0,.8]]},{type:'line',points:[[-.5,-.5],[.5,.5]]},{type:'line',points:[[-.5,.5],[.5,-.5]]}]},
 {id:'utility-pole',name:'Utility pole',category:'Electrical',parts:[{type:'circle',center:[0,0],radius:.24},{type:'line',points:[[-1,0],[1,0]]},{type:'line',points:[[-.7,.32],[.7,.32]]},{type:'line',points:[[0,-.7],[0,.7]]}]},
 {id:'water-valve',name:'Water valve',category:'Utilities',parts:[{type:'circle',center:[0,0],radius:.22},{type:'line',points:[[-.75,-.75],[.75,.75]]},{type:'line',points:[[-.75,.75],[.75,-.75]]}]},
 {id:'sign',name:'Site sign',category:'Site features',parts:[{type:'polyline',closed:true,points:[[-.8,.2],[.8,.2],[.8,1],[-.8,1]]},{type:'line',points:[[0,.2],[0,-1]]}]},
 {id:'water-meter',name:'Water meter',category:'Utilities',parts:[{type:'circle',center:[0,0],radius:.58},{type:'line',points:[[-.35,0],[.35,0]]},{type:'line',points:[[0,-.35],[0,.35]]}]},
 {id:'sewer-cleanout',name:'Sewer cleanout',category:'Utilities',parts:[{type:'circle',center:[0,0],radius:.55},{type:'line',points:[[-.38,-.38],[.38,.38]]},{type:'line',points:[[-.38,.38],[.38,-.38]]}]},
 {id:'electric-handhole',name:'Electrical handhole',category:'Electrical',parts:[{type:'polyline',closed:true,points:[[-.8,-.55],[.8,-.55],[.8,.55],[-.8,.55]]},{type:'line',points:[[-.5,0],[.5,0]]},{type:'line',points:[[0,-.35],[0,.35]]}]},
 {id:'transformer',name:'Transformer',category:'Electrical',parts:[{type:'polyline',closed:true,points:[[-.8,-.55],[.8,-.55],[.8,.55],[-.8,.55]]},{type:'circle',center:[-.35,0],radius:.2},{type:'circle',center:[.35,0],radius:.2}]},
 {id:'bollard',name:'Bollard',category:'Site features',parts:[{type:'circle',center:[0,0],radius:.5},{type:'line',points:[[-.28,-.28],[.28,.28]]},{type:'line',points:[[-.28,.28],[.28,-.28]]}]},
 {id:'parking-space',name:'Parking space',category:'Site features',parts:[{type:'line',points:[[-.75,-1],[.75,-1]]},{type:'line',points:[[-.75,1],[.75,1]]},{type:'line',points:[[-.75,-1],[-.75,1]]},{type:'line',points:[[.75,-1],[.75,1]]}]},
 {id:'accessible-parking',name:'Accessible parking',category:'Site features',parts:[{type:'polyline',closed:true,points:[[-.85,-1],[.85,-1],[.85,1],[-.85,1]]},{type:'circle',center:[0,.48],radius:.25},{type:'line',points:[[0,.22],[0,-.25]]},{type:'line',points:[[0,-.25],[.38,-.25]]},{type:'line',points:[[.38,-.25],[.38,-.62]]}]},
 {id:'bench',name:'Bench',category:'Site features',parts:[{type:'polyline',closed:true,points:[[-1,-.38],[1,-.38],[1,.38],[-1,.38]]},{type:'line',points:[[-.65,-.38],[-.65,.38]]},{type:'line',points:[[.65,-.38],[.65,.38]]}]},
 {id:'drainage-inlet',name:'Drainage inlet',category:'Drainage',parts:[{type:'polyline',closed:true,points:[[-.85,-.55],[.85,-.55],[.85,.55],[-.85,.55]]},{type:'line',points:[[-.55,-.3],[-.55,.3]]},{type:'line',points:[[-.18,-.3],[-.18,.3]]},{type:'line',points:[[.18,-.3],[.18,.3]]},{type:'line',points:[[.55,-.3],[.55,.3]]}]},
 {id:'test-pit',name:'Test pit',category:'Survey',parts:[{type:'polyline',closed:true,points:[[0,.85],[-.75,-.55],[.75,-.55]]},{type:'line',points:[[-.34,-.1],[.34,-.1]]},{type:'line',points:[[0,-.43],[0,.24]]}]},
 {id:'well',name:'Well',category:'Utilities',parts:[{type:'circle',center:[0,0],radius:.8},{type:'circle',center:[0,0],radius:.46},{type:'line',points:[[-.32,0],[.32,0]]},{type:'line',points:[[0,-.32],[0,.32]]}]},
 {id:'survey-monument',name:'Survey monument',category:'Survey',parts:[{type:'circle',center:[0,0],radius:.85},{type:'circle',center:[0,0],radius:.3},{type:'line',points:[[-1,0],[1,0]]},{type:'line',points:[[0,-1],[0,1]]}]},
 {id:'spot-elevation',name:'Spot elevation marker',category:'Survey',parts:[{type:'polyline',closed:true,points:[[0,.65],[-.65,-.5],[.65,-.5]]},{type:'line',points:[[-.35,-.18],[.35,-.18]]}]},
 {id:'fence-post',name:'Fence post',category:'Site features',parts:[{type:'polyline',closed:true,points:[[-.45,-.45],[.45,-.45],[.45,.45],[-.45,.45]]},{type:'line',points:[[-.3,-.3],[.3,.3]]},{type:'line',points:[[-.3,.3],[.3,-.3]]}]},
 {id:'brush-clump',name:'Brush clump',category:'Landscape',parts:[{type:'circle',center:[-.45,0],radius:.5},{type:'circle',center:[0,.3],radius:.5},{type:'circle',center:[.45,0],radius:.5},{type:'circle',center:[0,-.3],radius:.5}]},
 {id:'slope-arrow',name:'Slope direction',category:'Survey',parts:[{type:'line',points:[[-.85,-.55],[.85,.55]]},{type:'line',points:[[.85,.55],[.25,.48]]},{type:'line',points:[[.85,.55],[.6,-.02]]}]}
];

export const CIVIL_SYMBOLS=symbols.map(({id,name,category})=>({id,name,category}));

export function civilSymbolPreviewSVG(id){
 let definition=symbols.find(symbol=>symbol.id===id);
 if(!definition)throw Error('Choose a supported civil symbol.');
 let n=value=>Number(value.toFixed(3)),point=([x,y])=>`${n(x)} ${n(-y)}`;
 let parts=definition.parts.map(part=>{
  if(part.type==='circle')return `<circle cx="${n(part.center[0])}" cy="${n(-part.center[1])}" r="${n(part.radius)}"/>`;
  let points=part.points;
  return `<path d="${points.map((value,index)=>(index?'L':'M')+point(value)).join('')}${part.type==='polyline'&&part.closed?'Z':''}"/>`;
 }).join('');
 return `<svg viewBox="-1.25 -1.25 2.5 2.5" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width=".08" stroke-linecap="round" stroke-linejoin="round">${parts}</svg>`;
}

export function createCivilSymbol(id,origin,size,rotation=0,layer='drawing',groupId){
 let definition=symbols.find(symbol=>symbol.id===id);
 if(!definition)throw Error('Choose a supported civil symbol.');
 if(![origin?.x,origin?.y,size,rotation].every(Number.isFinite)||size<=0||size>1e6)throw Error('Symbol position, size or rotation is invalid.');
 if(typeof layer!=='string'||!layer||typeof groupId!=='string'||!groupId)throw Error('Symbol layer and group are required.');
 let factor=size/2,c=Math.cos(rotation),s=Math.sin(rotation);
 let point=([x,y])=>({x:origin.x+factor*(x*c-y*s),y:origin.y+factor*(x*s+y*c)});
 return definition.parts.map(part=>{
  let base={layer,name:definition.name,symbolId:id,symbolGroup:groupId};
  if(part.type==='circle')return {...base,type:'circle',a:point(part.center),r:part.radius*factor};
  if(part.type==='line'){let [a,b]=part.points.map(point);return {...base,type:'line',a,b}}
  return {...base,type:'polyline',points:part.points.map(point),closed:part.closed};
 });
}
