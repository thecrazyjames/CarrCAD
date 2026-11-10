import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exportDXF,importDXF} from '../ui/exchange.js';
import {freshProject} from '../ui/project-model.js';
import {LINE_TYPES,HATCH_PATTERNS} from '../ui/appearance.js';

test('expanded layer linetypes and civil hatches export to DXF',()=>{
 let project=freshProject(),names=LINE_TYPES.map(value=>value.toUpperCase().replaceAll('-',''));
 project.layers[0].lineType='center';
 project.entities=[{id:'site',type:'polyline',layer:'drawing',closed:true,hatchPattern:'earth',points:[{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:0,y:10}]}];
 let dxf=exportDXF(project);
 for(let name of names)assert.ok(dxf.includes(`\n${name}\n`),`missing DXF linetype ${name}`);
 assert.match(dxf,/\nEARTH\n/);
 assert.equal(importDXF(dxf).entities.find(entity=>entity.type==='polyline')?.hatchPattern,'earth');
 assert.ok(HATCH_PATTERNS.some(pattern=>pattern.value==='earth'));
});

test('civil material hatches export from layer defaults and round-trip through DXF',()=>{
 for(let pattern of HATCH_PATTERNS.map(item=>item.value).filter(value=>value!=='none')){
  let project=freshProject();
  project.layers[0].hatchPattern=pattern;
  project.entities=[{id:'paving',type:'polyline',layer:'drawing',closed:true,points:[{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:0,y:10}]}];
  let dxf=exportDXF(project),imported=importDXF(dxf),dxfPattern=pattern==='crosshatch'?'ANSI37':pattern.toUpperCase();
  assert.match(dxf,new RegExp(`\\n${dxfPattern}\\n`));
  assert.equal(imported.entities.find(entity=>entity.type==='polyline')?.hatchPattern,pattern);
 }
});

test('DXF exports hatch scale and editable leader path, arrow and linetype',()=>{
 let project=freshProject();
 project.entities=[
  {id:'site',type:'polyline',layer:'drawing',closed:true,hatchPattern:'earth',hatchScale:3,points:[{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:0,y:10}]},
  {id:'leader',type:'leader',layer:'drawing',points:[{x:0,y:20},{x:12,y:20},{x:12,y:30}],note:'Flow',size:1,leaderLineStyle:'squiggly',leaderArrowType:'dot',leaderLineType:'dashed'}
 ];
 let dxf=exportDXF(project);
 let hatch=dxf.slice(dxf.indexOf('\n0\nHATCH\n')+1).split('\n'),pairs=Array.from({length:Math.floor(hatch.length/2)},(_,index)=>[hatch[index*2],hatch[index*2+1]]);
 assert.ok(pairs.some(([code,value])=>code==='46'&&Math.abs(Number(value)-.6)<1e-10));
 assert.ok(pairs.some(([code,value])=>code==='49'&&Math.abs(Number(value)+.6)<1e-10));
 assert.match(dxf,/\nLWPOLYLINE\n/);
 assert.match(dxf,/\nDASHED\n/);
 assert.match(dxf,/\nCIRCLE\n/);
 assert.match(dxf,/\nFlow\n/);
});
test('DXF keeps an attached text label single and exports a sized filled leader arrow',()=>{
 let project=freshProject();
 project.entities=[
  {id:'label',type:'text',layer:'drawing',a:{x:12,y:30},text:'GRASS AREA',size:2},
  {id:'leader',type:'leader',layer:'drawing',points:[{x:0,y:20},{x:8,y:20},{x:8,y:29}],note:'',size:2,leaderArrowSize:3,leaderArrowType:'filled',leaderTextId:'label',leaderTextOffset:{x:-1,y:-1}}
 ];
 let dxf=exportDXF(project);
 assert.equal((dxf.match(/\n1\nGRASS AREA\n/g)||[]).length,1);
 assert.match(dxf,/\nSOLID\n/);
});
