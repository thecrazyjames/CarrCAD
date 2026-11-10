import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBlockDefinition,createBlockInstance,expandBlockInstance,expandModelEntities,transformBlockInstance,validateBlockDefinitions,validateBlockInstances} from '../ui/blocks.js';
import {exportDXF} from '../ui/exchange.js';
import {defaultSheet,renderSheet} from '../ui/sheets.js';
import {freshProject,migrateProject,surveyPointEntities,validateProjectModel} from '../ui/project-model.js';
import {bounds as geometryBounds,withinBox} from '../ui/drafting.js';
import {boundsOf} from '../ui/sheets.js';
import {leaderPointsForEntity} from '../ui/leader-geometry.js';

const layers=[{id:'drawing',name:'Drawing',color:'#bde880',lineType:'continuous',lineWeight:.25,visible:true,locked:false}];
const source=[{id:'source',type:'line',layer:'drawing',a:{x:10,y:20},b:{x:14,y:20}}];
const definition=()=>createBlockDefinition({id:'tree',name:'Tree',entities:source,base:{x:10,y:20},layers,createId:(()=>{let id=0;return ()=>`primitive-${++id}`})()});

test('block creation localizes selected geometry and inserts linked scaled/rotated geometry',()=>{
 let block=definition(),instance=createBlockInstance({id:'instance',definitionId:block.id,origin:{x:100,y:200},scale:2,rotation:Math.PI/2,layer:'drawing'}),[line]=expandBlockInstance(instance,block);
 assert.deepEqual(block.geometry[0].a,{x:0,y:0});assert.deepEqual(block.geometry[0].b,{x:4,y:0});
 assert.ok(Math.abs(line.a.x-100)<1e-10&&Math.abs(line.a.y-200)<1e-10);
 assert.ok(Math.abs(line.b.x-100)<1e-10&&Math.abs(line.b.y-208)<1e-10);
 assert.equal(line.blockLayer,'drawing');assert.equal(line.blockStyle.color,'#bde880');
 let moved=transformBlockInstance(instance,{base:{x:0,y:0},angle:Math.PI/2,dx:1,dy:2});
 assert.ok(Math.abs(moved.a.x+199)<1e-10&&Math.abs(moved.a.y-102)<1e-10);
 assert.equal(moved.rotation,Math.PI);
 block.geometry[0].b.x=5;
 assert.ok(Math.abs(expandBlockInstance(instance,block)[0].b.y-210)<1e-10,'definition edits affect existing placements');
});

test('version 2 migration supplies empty blocks and validates definitions and references strictly',()=>{
 let old={...freshProject(),blocks:undefined},migrated=migrateProject(old);
 assert.deepEqual(migrated.blocks,[]);assert.equal(validateProjectModel(migrated),undefined);
 let project=freshProject();project.blocks=[definition()];project.entities=[createBlockInstance({id:'instance',definitionId:'tree',origin:{x:0,y:0},layer:'drawing'})];
 assert.equal(validateProjectModel(project),undefined);
 assert.throws(()=>validateBlockDefinitions([{...definition(),id:''}],layers),/definition/);
 assert.throws(()=>validateBlockDefinitions([{...definition(),geometry:[{...definition().geometry[0],type:'point'}]}],layers),/primitive identity, type or layer/);
 assert.throws(()=>validateProjectModel({...project,entities:[{...project.entities[0],definitionId:'missing'}]}),/block instance reference/);
 assert.throws(()=>validateProjectModel({...project,entities:[{...project.entities[0],scale:0}]}),/block instance reference/);
 assert.throws(()=>validateProjectModel({...project,entities:[{...project.entities[0],a:{x:Infinity,y:0}}]}),/block instance reference/);
 assert.throws(()=>validateProjectModel({...project,blocks:[{...project.blocks[0],geometry:[{...project.blocks[0].geometry[0],a:{x:Infinity,y:0}}]}]}),/coordinates/);
});

test('block expansions render on sheets and export as ordinary DXF geometry',()=>{
 let project=freshProject();project.blocks=[definition()];project.entities=[createBlockInstance({id:'instance',definitionId:'tree',origin:{x:50,y:60},layer:'drawing'})];
 assert.deepEqual(geometryBounds(expandModelEntities(project.entities,project.blocks)[0]),{minx:50,maxx:54,miny:60,maxy:60});
 assert.equal(withinBox(expandModelEntities(project.entities,project.blocks)[0],{x:49,y:59},{x:55,y:61}),true);
 assert.deepEqual(boundsOf(project),{minx:50,miny:60,maxx:54,maxy:60,empty:false});
 let reopened=migrateProject(JSON.parse(JSON.stringify(project)));assert.equal(validateProjectModel(reopened),undefined);assert.equal(reopened.blocks[0].name,'Tree');
 let svg=renderSheet(project,defaultSheet()).svg,dxf=exportDXF(project);
 assert.match(svg,/<path d="M[^"]+L[^"]+"/);
 assert.match(dxf,/LINE/);assert.match(dxf,/10\n50\n20\n60\n30\n0\n11\n54\n21\n60/);
 let viewport={id:'viewport',type:'viewport',at:{x:40,y:40},width:200,height:100,modelView:{minx:45,miny:55,maxx:60,maxy:70},color:'#223b49',lineWeight:.25};
 project.sheet={...defaultSheet(),border:'custom',paperEntities:[viewport]};
 let viewportSvg=renderSheet(project,project.sheet).svg;
 assert.match(viewportSvg,/data-paper-type="viewport"/);
 assert.ok((viewportSvg.match(/<path d="M/g)||[]).length>=2);
});

test('block records are never treated as survey points or valid TIN constraints',()=>{
 let block=createBlockInstance({id:'instance',definitionId:'tree',origin:{x:0,y:0},layer:'drawing'});
 assert.deepEqual(surveyPointEntities([block,{id:'survey',type:'point',layer:'drawing',a:{x:0,y:0,z:10}}]).map(point=>point.id),['survey']);
 let project=freshProject();project.blocks=[definition()];project.entities=[block];project.surfaceDefinition={boundary:'instance',holes:[],breaklines:[]};
 assert.throws(()=>validateProjectModel(project),/non-block model geometry/);
 assert.throws(()=>createBlockDefinition({id:'unsupported',name:'No points',entities:[{id:'p',type:'point',layer:'drawing',a:{x:0,y:0,z:0}}],base:{x:0,y:0},layers,createId:()=> 'p'}),/cannot contain point/);
});

test('block text and leader annotations retain insert rotation in SVG and DXF',()=>{
 let textDef=createBlockDefinition({id:'note',name:'Note',entities:[{id:'label',type:'text',layer:'drawing',a:{x:0,y:0},text:'North arrow',size:2}],base:{x:0,y:0},layers,createId:()=> 'label-local'});
 let project=freshProject();project.blocks=[textDef];project.entities=[createBlockInstance({id:'note-instance',definitionId:'note',origin:{x:20,y:30},rotation:Math.PI/2,layer:'drawing'})];
 assert.match(renderSheet(project,defaultSheet()).svg,/transform="rotate\(-90/);
 assert.match(exportDXF(project),/50\n90/);
});
test('block-attached leaders keep their text links and arrow sizes through placement transforms',()=>{
 let block=createBlockDefinition({id:'callout',name:'Callout',entities:[
  {id:'label',type:'text',layer:'drawing',a:{x:5,y:5},text:'Grass',size:1},
  {id:'leader',type:'leader',layer:'drawing',points:[{x:0,y:0},{x:6,y:5}],note:'',size:1,leaderArrowSize:1,leaderTextId:'label',leaderTextOffset:{x:1,y:0}}
 ],base:{x:5,y:5},layers,createId:(()=>{let id=0;return ()=>`callout-${++id}`})()}),instance=createBlockInstance({id:'callout-instance',definitionId:'callout',origin:{x:20,y:30},scale:2,rotation:Math.PI/2,layer:'drawing'}),expanded=expandBlockInstance(instance,block),leader=expanded.find(entity=>entity.type==='leader'),text=expanded.find(entity=>entity.type==='text');
 assert.equal(validateBlockDefinitions([block],layers).length,1);
 assert.equal(leader.leaderTextId,text.id);
 let endpoint=leaderPointsForEntity(leader,expanded).at(-1);
 assert.ok(Math.abs(endpoint.x-20)<1e-10&&Math.abs(endpoint.y-32)<1e-10);
 assert.equal(leader.leaderArrowSize,2);
});

test('all block references are expanded and unresolved references are not silently omitted',()=>{
 let instance=createBlockInstance({id:'instance',definitionId:'tree',origin:{x:0,y:0},layer:'drawing'});
 assert.equal(expandModelEntities([instance],[definition()]).length,1);
 assert.throws(()=>expandModelEntities([instance],[]),/Missing block definition/);
 validateBlockInstances([instance],[definition()],layers);
 assert.throws(()=>validateBlockInstances([instance],[definition()],[{id:'other'}]),/block instance reference/);
});
