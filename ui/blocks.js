import * as D from './drafting.js';
import {entityPoints} from './exchange.js';

export const BLOCK_PRIMITIVE_TYPES=Object.freeze(['line','rect','circle','arc','text','leader','dim','polyline']);
export const BLOCK_LIMITS=Object.freeze({definitions:500,primitivesPerDefinition:1000,totalPrimitives:20000,totalDefinitionVertices:100000,instances:5000,expandedPrimitives:50000,expandedVertices:500000});

export function createBlockDefinition({id,name,entities,base,layers,createId}){
 if(typeof id!=='string'||!id||typeof name!=='string'||!name.trim()||name.trim().length>100)throw Error('Enter a block name no longer than 100 characters.');
 if(!Array.isArray(entities)||!entities.length||entities.length>BLOCK_LIMITS.primitivesPerDefinition)throw Error('A block needs 1 to 1,000 supported objects.');
 if(!base||![base.x,base.y].every(Number.isFinite))throw Error('Enter a finite block base point.');
 let primitiveIds=new Map(entities.map(entity=>[entity.id,createId()]));
 for(let entity of entities)if(entity.type==='leader'&&entity.leaderTextId&&!primitiveIds.has(entity.leaderTextId))throw Error('Include the text object attached to a leader when creating a block.');
 let geometry=entities.map(entity=>{
  if(!BLOCK_PRIMITIVE_TYPES.includes(entity.type))throw Error(`Blocks cannot contain ${entity.type} objects. Use lines, rectangles, circles, arcs, text, leaders, dimensions or polylines.`);
  let style=layers?.find(layer=>layer.id===entity.layer);
  let local=D.transform(entity,{base,dx:-base.x,dy:-base.y});
  local.id=primitiveIds.get(entity.id);
  if(local.type==='leader'&&local.leaderTextId)local.leaderTextId=primitiveIds.get(local.leaderTextId);
  local.blockStyle=style?{color:style.color,lineType:style.lineType||'continuous',lineWeight:style.lineWeight??.25}:undefined;
  return local;
 });
 return {id,name:name.trim(),geometry};
}

export function createBlockInstance({id,definitionId,origin,scale=1,rotation=0,layer}){
 if(typeof id!=='string'||!id||typeof definitionId!=='string'||!definitionId||typeof layer!=='string'||!layer)throw Error('A block instance needs valid identity, definition and layer references.');
 if(!origin||![origin.x,origin.y].every(Number.isFinite)||!Number.isFinite(scale)||scale<=0||!Number.isFinite(rotation))throw Error('Block placement needs a finite origin, positive scale and finite rotation.');
 return {id,type:'block',definitionId,a:{x:origin.x,y:origin.y},scale,rotation,layer};
}

export function expandBlockInstance(instance,definition){
 if(!definition||!Array.isArray(definition.geometry))throw Error(`Missing block definition: ${instance.definitionId}`);
 return definition.geometry.map(primitive=>{
  let entity=D.transform(primitive,{base:{x:0,y:0},factor:instance.scale,angle:instance.rotation,dx:instance.a.x,dy:instance.a.y});
  delete entity.blockStyle;
  entity.id=`${instance.id}:${primitive.id}`;
  if(entity.type==='leader'&&entity.leaderTextId)entity.leaderTextId=`${instance.id}:${entity.leaderTextId}`;
  entity.layer=primitive.layer;
  entity.blockStyle=primitive.blockStyle;
  entity.blockLayer=instance.layer;
  entity.blockInstance=instance.id;
  entity.blockRotation=instance.rotation;
  return entity;
 });
}

export function expandModelEntities(entities,definitions=[]){
 let blocks=new Map(definitions.map(definition=>[definition.id,definition]));
 return entities.flatMap(entity=>entity.type==='block'?expandBlockInstance(entity,blocks.get(entity.definitionId)):[entity]);
}

export function transformBlockInstance(instance,{base={x:0,y:0},factor=1,angle=0,dx=0,dy=0}={}){
 if(![base.x,base.y,factor,angle,dx,dy].every(Number.isFinite)||factor<=0)throw Error('Use a positive, finite scale and valid transform coordinates.');
 let x=(instance.a.x-base.x)*factor,y=(instance.a.y-base.y)*factor;
 return {...structuredClone(instance),a:{x:base.x+x*Math.cos(angle)-y*Math.sin(angle)+dx,y:base.y+x*Math.sin(angle)+y*Math.cos(angle)+dy},scale:instance.scale*factor,rotation:instance.rotation+angle};
}

export function validateBlockDefinitions(definitions,layers){
 if(definitions===undefined)return [];
 if(!Array.isArray(definitions)||definitions.length>BLOCK_LIMITS.definitions)throw Error('Invalid block definitions.');
 let ids=new Set,layersById=new Set(layers.map(layer=>layer.id)),total=0,totalVertices=0;
 for(let definition of definitions){
  if(!definition||typeof definition.id!=='string'||!definition.id||ids.has(definition.id)||typeof definition.name!=='string'||!definition.name.trim()||definition.name.length>100||!Array.isArray(definition.geometry)||!definition.geometry.length||definition.geometry.length>BLOCK_LIMITS.primitivesPerDefinition)throw Error('Invalid block definition.');
  ids.add(definition.id);total+=definition.geometry.length;
  if(total>BLOCK_LIMITS.totalPrimitives)throw Error('Too many block primitives.');
  let primitiveIds=new Set;
  for(let entity of definition.geometry){
   if(!entity||!BLOCK_PRIMITIVE_TYPES.includes(entity.type)||typeof entity.id!=='string'||!entity.id||primitiveIds.has(entity.id)||!layersById.has(entity.layer))throw Error('Invalid block primitive identity, type or layer.');
   primitiveIds.add(entity.id);
   let points=entityPoints(entity);
   if(!points.length||points.length>10000||points.some(point=>!point||![point.x,point.y,point.z??0].every(value=>Number.isFinite(value)&&Math.abs(value)<1e10)))throw Error('Invalid block primitive coordinates.');
   totalVertices+=points.length;
   if(totalVertices>BLOCK_LIMITS.totalDefinitionVertices)throw Error('Too many block definition vertices.');
   if(['line','rect','dim'].includes(entity.type)&&!entity.b)throw Error('Missing block primitive endpoint.');
   if(entity.type==='polyline'&&points.length<2)throw Error('A block polyline needs at least two vertices.');
   if(['circle','arc'].includes(entity.type)&&(!Number.isFinite(entity.r)||entity.r<=0))throw Error('Block radius must be positive.');
   if(entity.type==='arc'&&![entity.start,entity.end].every(Number.isFinite))throw Error('Invalid block arc angles.');
   if(entity.type==='text'&&(typeof entity.text!=='string'||entity.text.length>500||!Number.isFinite(entity.size)||entity.size<=0||entity.size>100))throw Error('Invalid block text.');
   if(entity.type==='leader'&&(!Array.isArray(entity.points)||entity.points.length<2||entity.points.length>20||typeof entity.note!=='string'||entity.note.length>500||!entity.note.trim()&&!entity.leaderTextId||!Number.isFinite(entity.size)||entity.size<=0||entity.size>100||entity.leaderArrowSize!==undefined&&(!Number.isFinite(entity.leaderArrowSize)||entity.leaderArrowSize<=0||entity.leaderArrowSize>100)||entity.leaderTextId!==undefined&&(typeof entity.leaderTextId!=='string'||!entity.leaderTextId||!entity.leaderTextOffset||![entity.leaderTextOffset.x,entity.leaderTextOffset.y].every(Number.isFinite))))throw Error('Invalid block leader.');
   if(entity.blockStyle!==undefined&&(!entity.blockStyle||!/^#[0-9a-f]{6}$/i.test(entity.blockStyle.color||'')||!['continuous','dashed','dotted','dash-dot'].includes(entity.blockStyle.lineType)||![.13,.18,.25,.35,.5,.7,1].includes(entity.blockStyle.lineWeight)))throw Error('Invalid block primitive style.');
  }
  for(let entity of definition.geometry)if(entity.type==='leader'&&entity.leaderTextId&&!definition.geometry.some(candidate=>candidate.id===entity.leaderTextId&&candidate.type==='text'))throw Error('Invalid block leader text reference.');
 }
 return definitions;
}

export function validateBlockInstances(entities,definitions,layers){
 let definitionIds=new Set(definitions.map(definition=>definition.id)),layerIds=new Set(layers.map(layer=>layer.id)),instances=entities.filter(entity=>entity.type==='block');
 if(instances.length>BLOCK_LIMITS.instances)throw Error('Too many block instances.');
 let byDefinition=new Map(definitions.map(definition=>[definition.id,{primitives:definition.geometry.length,vertices:definition.geometry.reduce((sum,entity)=>sum+entityPoints(entity).length,0)}])),expanded=0,expandedVertices=0;
 for(let instance of instances){
  if(!definitionIds.has(instance.definitionId)||!layerIds.has(instance.layer)||!instance.a||![instance.a.x,instance.a.y].every(value=>Number.isFinite(value)&&Math.abs(value)<1e10)||!Number.isFinite(instance.scale)||instance.scale<.0001||instance.scale>10000||!Number.isFinite(instance.rotation)||Math.abs(instance.rotation)>1e6)throw Error('Invalid block instance reference or transform.');
  let cost=byDefinition.get(instance.definitionId);expanded+=cost.primitives;expandedVertices+=cost.vertices;
  if(expanded>BLOCK_LIMITS.expandedPrimitives||expandedVertices>BLOCK_LIMITS.expandedVertices)throw Error('Block instances exceed the geometry rendering limit.');
 }
}
