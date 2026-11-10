import * as G from './geometry.js';
import {defaultSheet, validateSheet} from './sheets.js';
import {entityPoints} from './exchange.js';
import {HATCH_PATTERNS,LINE_TYPES,LINE_WEIGHTS} from './appearance.js';
import {validateBlockDefinitions,validateBlockInstances} from './blocks.js';
import {validateConstraints} from './constraints.js';
import {defaultLabelStyles,defaultActiveLabelStyles,labelFamilyForEntity,validateLabelStyles} from './label-styles.js';
import {defaultTextStyles,validateTextStyles} from './text-styles.js';
import {LEADER_ARROW_TYPES,LEADER_LINE_STYLES} from './leader-geometry.js';

const baseLayers=()=>[{id:'drawing',name:'Drawing',color:'#bde880',lineType:'continuous',lineWeight:0.25,visible:true,locked:false},{id:'boundary',name:'Boundaries',color:'#e5bb79',lineType:'continuous',lineWeight:0.35,visible:true,locked:false},{id:'survey',name:'Survey points',color:'#8cbed8',lineType:'continuous',lineWeight:0.18,visible:true,locked:false},{id:'design',name:'Design',color:'#de9cb1',lineType:'continuous',lineWeight:0.25,visible:true,locked:false}];
const createProjectId=()=>typeof globalThis.crypto.randomUUID==='function'?globalThis.crypto.randomUUID():Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
const MAX_PAPER_IMAGE_DATA=12*1024*1024;
const MAX_RASTER_REFERENCE_DATA=12*1024*1024;
const MAX_RASTER_REFERENCES=64;
export const surveyPointEntities=entities=>entities.filter(entity=>entity.type==='point');

function copySheet(sheet){return JSON.parse(JSON.stringify(sheet))}
function initialSheetPages(sheet,createId=createProjectId){let id=createId();return {sheet,sheetPages:[{id,name:sheet.sheetNo,settings:copySheet(sheet)}],activeSheetId:id}}
export const defaultSheetSet=(name='Untitled drawing')=>({name,description:'',issue:'',revision:''});
export const freshProject=()=>{let sheet=defaultSheet(),labelStyles=defaultLabelStyles(),textStyles=defaultTextStyles();return {version:2,name:'Untitled drawing',sheetSet:defaultSheetSet(),units:'ft',grid:1,layers:baseLayers(),activeLayer:'drawing',entities:[],constraints:[],blocks:[],labelStyles,activeLabelStyles:defaultActiveLabelStyles(labelStyles),textStyles,activeTextStyleId:textStyles[0].id,surface:null,surfaceDefinition:null,rasters:[],...initialSheetPages(sheet)}};

export function validateProjectModel(m){
 if(m?.sheet)validateSheet(m.sheet);
 if(!m||typeof m.name!=='string'||m.name.length>500||m.version!==2||!Array.isArray(m.entities)||m.entities.length>20000||!Array.isArray(m.layers)||!m.layers.length||m.layers.length>100)throw Error('Invalid or unsupported project.');
 if(!['ft','in','m','mm'].includes(m.units)||!Number.isFinite(m.grid)||m.grid<=0)throw Error('Invalid drawing units or grid.');
 if(m.sheetSet!==undefined){
  let metadata=m.sheetSet,limits={name:150,description:1000,issue:150,revision:50};
  if(!metadata||typeof metadata!=='object'||Array.isArray(metadata)||Object.keys(metadata).some(key=>!Object.hasOwn(limits,key))||Object.keys(limits).some(key=>typeof metadata[key]!=='string'||metadata[key].length>limits[key]||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(metadata[key]))||!metadata.name.trim())throw Error('Invalid sheet-set metadata.');
 }
 validateLabelStyles(m.labelStyles,m.activeLabelStyles);
 validateTextStyles(m.textStyles,m.activeTextStyleId);
 let labelStylesById=new Map(Object.values(m.labelStyles).flat().map(style=>[style.id,style]));
 let textStyleIds=new Set(m.textStyles.map(style=>style.id));
 let ids=new Set;
 for(let l of m.layers){if(typeof l.id!=='string'||typeof l.name!=='string'||!/^#[0-9a-f]{6}$/i.test(l.color)||l.lineType!==undefined&&!LINE_TYPES.includes(l.lineType)||l.lineWeight!==undefined&&!LINE_WEIGHTS.includes(l.lineWeight)||l.hatchPattern!==undefined&&!HATCH_PATTERNS.some(pattern=>pattern.value===l.hatchPattern)||ids.has(l.id))throw Error('Invalid layer.');ids.add(l.id)}
 let blocks=validateBlockDefinitions(m.blocks,m.layers);
 for(let definition of blocks)for(let primitive of definition.geometry)if(primitive.textStyleId!==undefined&&(primitive.type!=='text'||!textStyleIds.has(primitive.textStyleId)))throw Error('Invalid block text style reference.');
 let blockPrimitiveIds=new Map(blocks.map(definition=>[definition.id,new Set]));
 for(let definition of blocks)for(let e of definition.geometry){
  let eids=blockPrimitiveIds.get(definition.id);
  if(typeof e.id!=='string'||eids.has(e.id)||!ids.has(e.layer))throw Error('Invalid block primitive identity or layer.');
  eids.add(e.id);
  let pts=entityPoints(e);
  if(!pts.length||pts.length>10000||pts.some(p=>!p||![p.x,p.y,p.z??0].every(n=>Number.isFinite(n)&&Math.abs(n)<1e10)))throw Error('Invalid block primitive coordinates.');
  if(['line','rect','dim'].includes(e.type)&&!e.b)throw Error('Missing block primitive endpoint.');
  if(e.type==='polyline'&&pts.length<2)throw Error('Not enough block vertices.');
  if(e.labelPosition&&![e.labelPosition.x,e.labelPosition.y].every(Number.isFinite))throw Error('Invalid block label position.');
  if(['circle','arc'].includes(e.type)&&(!Number.isFinite(e.r)||e.r<=0))throw Error('Block radius must be positive.');
  if(e.type==='arc'&&![e.start,e.end].every(Number.isFinite))throw Error('Invalid block arc angles.');
  if(e.type==='leader'&&(!Array.isArray(e.points)||e.points.length<2||e.points.length>20||typeof e.note!=='string'||e.note.length>500||!e.note.trim()&&!e.leaderTextId||!Number.isFinite(e.size)||e.size<=0||e.size>100||e.leaderArrowSize!==undefined&&(!Number.isFinite(e.leaderArrowSize)||e.leaderArrowSize<=0||e.leaderArrowSize>100)||e.leaderTextId!==undefined&&(typeof e.leaderTextId!=='string'||!e.leaderTextId||!e.leaderTextOffset||![e.leaderTextOffset.x,e.leaderTextOffset.y].every(Number.isFinite))||e.leaderLineStyle!==undefined&&!LEADER_LINE_STYLES.includes(e.leaderLineStyle)||e.leaderArrowType!==undefined&&!LEADER_ARROW_TYPES.includes(e.leaderArrowType)||e.leaderLineType!==undefined&&!LINE_TYPES.includes(e.leaderLineType)))throw Error('Invalid block leader.');
  if(e.hatchPattern!==undefined&&(!HATCH_PATTERNS.some(pattern=>pattern.value===e.hatchPattern)||!(['rect'].includes(e.type)||e.type==='polyline'&&e.closed)||e.hatchPattern!=='none'&&!G.simplePolygon(entityPoints(e))))throw Error('Invalid block hatch pattern.');
  if(e.hatchScale!==undefined&&(!Number.isFinite(e.hatchScale)||e.hatchScale<.1||e.hatchScale>100||!(['rect'].includes(e.type)||e.type==='polyline'&&e.closed)))throw Error('Invalid block hatch scale.');
 }
 let eids=new Set;
 for(let e of m.entities){
  if(typeof e.id!=='string'||eids.has(e.id)||!ids.has(e.layer))throw Error('Invalid object identity or layer.');
  eids.add(e.id);
  if(e.type==='block')continue;
  if(!['line','rect','circle','arc','text','leader','dim','polyline','parcel','alignment','point'].includes(e.type))throw Error('Unsupported object type.');
  let pts=entityPoints(e);
  if(!pts.length||pts.length>10000||pts.some(p=>!p||![p.x,p.y,p.z??0].every(n=>Number.isFinite(n)&&Math.abs(n)<1e10)))throw Error('Invalid coordinates.');
  if(['line','rect','dim'].includes(e.type)&&!e.b)throw Error('Missing endpoint.');
  if(['polyline','alignment'].includes(e.type)&&pts.length<2)throw Error('Not enough vertices.');
  if(e.labelPosition&&![e.labelPosition.x,e.labelPosition.y].every(Number.isFinite))throw Error('Invalid label position.');
  if(e.type==='parcel'&&!G.simplePolygon(pts))throw Error('A parcel must be a simple, non-intersecting polygon.');
  if(['circle','arc'].includes(e.type)&&(!Number.isFinite(e.r)||e.r<=0))throw Error('Radius must be positive.');
  if(e.type==='arc'&&![e.start,e.end].every(Number.isFinite))throw Error('Invalid arc angles.');
  if(e.type==='text'&&typeof e.text!=='string')throw Error('Invalid text.');
  if(e.textStyleId!==undefined&&(e.type!=='text'||!textStyleIds.has(e.textStyleId)))throw Error('Invalid text style reference.');
  if(e.type==='leader'&&(!Array.isArray(e.points)||e.points.length<2||e.points.length>20||typeof e.note!=='string'||e.note.length>500||!e.note.trim()&&!e.leaderTextId||!Number.isFinite(e.size)||e.size<=0||e.size>100||e.leaderArrowSize!==undefined&&(!Number.isFinite(e.leaderArrowSize)||e.leaderArrowSize<=0||e.leaderArrowSize>100)||e.leaderTextId!==undefined&&(typeof e.leaderTextId!=='string'||!e.leaderTextId||!e.leaderTextOffset||![e.leaderTextOffset.x,e.leaderTextOffset.y].every(Number.isFinite))||e.leaderLineStyle!==undefined&&!LEADER_LINE_STYLES.includes(e.leaderLineStyle)||e.leaderArrowType!==undefined&&!LEADER_ARROW_TYPES.includes(e.leaderArrowType)||e.leaderLineType!==undefined&&!LINE_TYPES.includes(e.leaderLineType)))throw Error('Invalid leader annotation.');
  if(e.contourLabel!==undefined&&(e.contourLabel!==true||e.type!=='text'||!Number.isFinite(e.contourElevation)))throw Error('Invalid contour label.');
  if(e.labelStyleId!==undefined){let family=labelFamilyForEntity(e),style=labelStylesById.get(e.labelStyleId);if(!family||!style||style.family!==family)throw Error('Invalid civil label style reference.')}
  if(e.labelOverrides!==undefined&&(e.type!=='text'||e.contourLabel!==true||!e.labelOverrides||typeof e.labelOverrides!=='object'||Array.isArray(e.labelOverrides)||Object.keys(e.labelOverrides).some(key=>!['text','textHeight'].includes(key))||e.labelOverrides.text!==undefined&&e.labelOverrides.text!==true||e.labelOverrides.textHeight!==undefined&&(!Number.isFinite(e.labelOverrides.textHeight)||e.labelOverrides.textHeight<=0||e.labelOverrides.textHeight>100)))throw Error('Invalid contour label overrides.');
  if(e.type==='alignment'&&!Number.isFinite(e.station||0))throw Error('Invalid start station.');
  if(e.hatchPattern!==undefined&&(!HATCH_PATTERNS.some(pattern=>pattern.value===e.hatchPattern)||!(['rect','parcel'].includes(e.type)||e.type==='polyline'&&e.closed)||e.hatchPattern!=='none'&&!G.simplePolygon(entityPoints(e))))throw Error('Invalid object hatch pattern.');
  if(e.hatchScale!==undefined&&(!Number.isFinite(e.hatchScale)||e.hatchScale<.1||e.hatchScale>100||!(['rect','parcel'].includes(e.type)||e.type==='polyline'&&e.closed)))throw Error('Invalid object hatch scale.');
 }
 for(let entity of m.entities)if(entity.type==='leader'&&entity.leaderTextId&&!m.entities.some(candidate=>candidate.id===entity.leaderTextId&&candidate.type==='text'))throw Error('Invalid leader text reference.');
 validateBlockInstances(m.entities,blocks,m.layers);
 for(let item of m.sheet?.paperEntities||[])if(item.type==='text'&&item.textStyleId!==undefined&&!textStyleIds.has(item.textStyleId))throw Error('Invalid Paper Space text style reference.');
 validateConstraints(m.constraints,m.entities);
 if(m.surfaceDefinition!==undefined&&m.surfaceDefinition!==null){
  let d=m.surfaceDefinition;
  if(typeof d.boundary!=='string'||!Array.isArray(d.holes)||!Array.isArray(d.breaklines)||[d.boundary,...d.holes,...d.breaklines].some(id=>typeof id!=='string')||new Set([d.boundary,...d.holes,...d.breaklines]).size!==1+d.holes.length+d.breaklines.length)throw Error('Invalid surface constraint references.');
  let entities=new Map(m.entities.map(entity=>[entity.id,entity]));
  if([d.boundary,...d.holes,...d.breaklines].some(id=>entities.get(id)?.type==='block'))throw Error('Surface constraints must reference non-block model geometry.');
 }
 if(m.sheetPages!==undefined||m.activeSheetId!==undefined){
  if(!Array.isArray(m.sheetPages)||!m.sheetPages.length||m.sheetPages.length>50)throw Error('Invalid sheet collection.');
  let pageIds=new Set,paperCount=0,paperImageData=0;
  for(let page of m.sheetPages){
   if(!page||typeof page.id!=='string'||!page.id||pageIds.has(page.id)||typeof page.name!=='string'||page.name.length>100||!page.settings)throw Error('Invalid sheet page.');
   pageIds.add(page.id);
   validateSheet(page.settings);
   for(let item of page.settings.paperEntities||[])if(item.type==='text'&&item.textStyleId!==undefined&&!textStyleIds.has(item.textStyleId))throw Error('Invalid Paper Space text style reference.');
   paperCount+=page.settings.paperEntities?.length||0;
   for(let item of page.settings.paperEntities||[])if(item.type==='image')paperImageData+=item.data.length;
  }
  if(paperCount>5000)throw Error('Too many paper-space objects.');
  if(paperImageData>MAX_PAPER_IMAGE_DATA)throw Error('Paper-space images exceed the project size budget.');
  if(typeof m.activeSheetId!=='string'||!pageIds.has(m.activeSheetId))throw Error('Invalid active sheet.');
 }
 if(m.surface?.vertices!==undefined){
  if(!Array.isArray(m.surface.vertices)||m.surface.vertices.length>1500)throw Error('Invalid generated surface vertices.');
  let ids=new Set(m.entities.map(e=>e.id));
  for(let p of m.surface.vertices){if(typeof p.id!=='string'||ids.has(p.id)||![p.x,p.y,p.z].every(n=>Number.isFinite(n)&&Math.abs(n)<1e10))throw Error('Invalid generated surface vertex.');ids.add(p.id)}
 }
 if(m.surface){
  let ids=new Set(m.entities.filter(e=>e.type==='point').map(e=>e.id));
  for(let p of m.surface.vertices||[])ids.add(p.id);
  if(!Array.isArray(m.surface.triangles)||m.surface.triangles.length>10000||m.surface.triangles.some(t=>!Array.isArray(t)||t.length!==3||t.some(id=>!ids.has(id))))throw Error('Invalid surface triangles.');
 }
 if(!Array.isArray(m.rasters)||m.rasters.length>MAX_RASTER_REFERENCES)throw Error('Invalid raster references.');
 let rasterIds=new Set,rasterDataLength=0;
 for(let raster of m.rasters){
  if(!raster||typeof raster.id!=='string'||!raster.id||raster.id.length>120||rasterIds.has(raster.id)||typeof raster.sourceName!=='string'||raster.sourceName.length>500||!/^data:image\/(png|jpeg|webp);base64,/.test(raster.data)||raster.data.length>2200000||![raster.x,raster.y,raster.width,raster.ratio].every(value=>Number.isFinite(value)&&Math.abs(value)<1e10)||raster.width<=0||raster.ratio<=0||typeof raster.visible!=='boolean'||typeof raster.locked!=='boolean'||!Number.isFinite(raster.opacity)||raster.opacity<0||raster.opacity>1)throw Error('Invalid raster reference.');
  rasterIds.add(raster.id);rasterDataLength+=raster.data.length;
 }
 if(rasterDataLength>MAX_RASTER_REFERENCE_DATA)throw Error('Raster references exceed the project size budget.');
}

export function migrateProject(d,createId=createProjectId){
 if(d.version===2){
  if(!Array.isArray(d.rasters))d.rasters=[];
  if(d.underlay){d.rasters.push({id:createId(),sourceName:d.underlay.sourceName||'Reference image',visible:true,locked:true,opacity:.65,...d.underlay});delete d.underlay}
  d.rasters=d.rasters.map(raster=>({...raster,id:raster.id||createId(),sourceName:raster.sourceName||'Reference image',visible:raster.visible!==false,locked:raster.locked!==false,opacity:Number.isFinite(raster.opacity)?raster.opacity:.65}));
  d.sheetSet=d.sheetSet===undefined?defaultSheetSet(d.name||'Untitled drawing'):{...defaultSheetSet(d.name||'Untitled drawing'),...d.sheetSet};
  if(d.labelStyles===undefined){d.labelStyles=defaultLabelStyles();d.activeLabelStyles=defaultActiveLabelStyles(d.labelStyles)}
  else if(d.activeLabelStyles===undefined)d.activeLabelStyles=defaultActiveLabelStyles(d.labelStyles);
  if(d.textStyles===undefined){d.textStyles=defaultTextStyles();d.activeTextStyleId=d.textStyles[0].id}
  else if(d.activeTextStyleId===undefined)d.activeTextStyleId=d.textStyles[0]?.id;
  if(d.blocks===undefined)d.blocks=[];
  if(d.constraints===undefined)d.constraints=[];
  if(d.sheetPages===undefined){
   let sheet={...defaultSheet(),...(d.sheet||{})},collection=initialSheetPages(sheet,createId);
   d.sheet=collection.sheet;d.sheetPages=collection.sheetPages;d.activeSheetId=collection.activeSheetId;
  }else{
   if(!Array.isArray(d.sheetPages)||!d.sheetPages.length)throw Error('Invalid sheet collection.');
   for(let page of d.sheetPages){if(!page?.settings)throw Error('Invalid sheet page.');page.settings={...defaultSheet(),...page.settings}}
   let active=d.sheetPages.find(page=>page.id===d.activeSheetId);
   if(!active&&d.activeSheetId===undefined)active=d.sheetPages[0];
   if(!active||!active.settings)throw Error('Invalid active sheet.');
   d.activeSheetId=active.id;d.sheet=copySheet(active.settings);
  }
  return d;
 }
 if(!Array.isArray(d.entities))throw Error('Not a Draft project.');
 let m=freshProject();
 m.name=d.name||'Imported drawing';
 m.sheetSet=defaultSheetSet(m.name);
 m.units=d.units||'ft';
 m.grid=d.grid||1;
 m.entities=d.entities.map(e=>({...e,id:createId(),layer:'drawing'}));
 let collection=initialSheetPages(m.sheet,createId);
 m.sheet=collection.sheet;m.sheetPages=collection.sheetPages;m.activeSheetId=collection.activeSheetId;
 return m;
}
