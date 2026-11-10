import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CIVIL_LAYER_PRESETS,civilLayersToAdd,drawHatch,HATCH_PATTERNS,lineWeightPixels,LINE_TYPE_DASHES,LINE_TYPE_MARKERS,lineTypeMarkerSegments,lineTypePreviewSVG,LINE_TYPES} from '../ui/appearance.js';

function context(){
 let calls=[];
 return {calls,save(){calls.push('save')},restore(){calls.push('restore')},setLineDash(){},beginPath(){calls.push('beginPath')},moveTo(){},lineTo(){},closePath(){},arc(){calls.push('arc')},clip(){calls.push('clip')},stroke(){calls.push('stroke')},fillRect(){calls.push('fillRect')}};
}

test('layer appearance maps line types and plotted weights to visible canvas styles',()=>{
 assert.deepEqual(LINE_TYPE_DASHES.dotted,[1,4]);
 assert.deepEqual(LINE_TYPE_DASHES['fence-line'],[8,4]);
 assert.ok(['center','hidden','phantom','divide'].every(type=>LINE_TYPES.includes(type)&&LINE_TYPE_DASHES[type].length>0));
 assert.ok(LINE_TYPES.every(type=>Array.isArray(LINE_TYPE_DASHES[type])));
 assert.ok(lineWeightPixels(.7)>lineWeightPixels(.25));
 assert.ok(lineWeightPixels(1)<=4);
});

test('fence linetype has repeated X markers and an accessible visual sample',()=>{
 assert.equal(LINE_TYPE_MARKERS['fence-line'],'cross');
 assert.equal(lineTypeMarkerSegments([{x:0,y:0},{x:40,y:0}],false,12,4,10).length,6);
 assert.match(lineTypePreviewSVG('fence-line','#123456'),/aria-label="fence line sample"/);
 assert.match(lineTypePreviewSVG('fence-line','#123456'),/stroke-dasharray="8 4"/);
 assert.throws(()=>lineTypePreviewSVG('fence-line','red'),/line-type preview/);
});

test('civil legend layer presets are unique, styled, bounded and duplicate-safe',()=>{
 assert.ok(CIVIL_LAYER_PRESETS.length>60);
 assert.equal(new Set(CIVIL_LAYER_PRESETS.map(item=>item.name)).size,CIVIL_LAYER_PRESETS.length);
 assert.ok(CIVIL_LAYER_PRESETS.every(item=>LINE_TYPES.includes(item.lineType)&&/^#[0-9a-f]{6}$/i.test(item.color)&&(!item.hatchPattern||HATCH_PATTERNS.some(pattern=>pattern.value===item.hatchPattern))));
 let additions=civilLayersToAdd([{name:CIVIL_LAYER_PRESETS[0].name.toLowerCase()}]);
 assert.equal(additions.length,CIVIL_LAYER_PRESETS.length-1);
 assert.throws(()=>civilLayersToAdd(Array.from({length:99},(_,index)=>({name:'Custom '+index}))),/100-layer/);
});

test('earth hatching draws clipped soil marks',()=>{
 let ctx=context();
 drawHatch(ctx,[{x:0,y:0},{x:30,y:0},{x:30,y:20},{x:0,y:20}],'earth','#fff');
 assert.ok(ctx.calls.includes('clip'));
 assert.ok(ctx.calls.includes('arc'));
 assert.equal(ctx.calls.at(-1),'restore');
});

test('hatch scale increases pattern spacing without changing the polygon clip',()=>{
 let normal=context(),large=context(),points=[{x:0,y:0},{x:30,y:0},{x:30,y:20},{x:0,y:20}];
 drawHatch(normal,points,'earth','#fff',1);
 drawHatch(large,points,'earth','#fff',2);
 assert.ok(large.calls.filter(call=>call==='arc').length<normal.calls.filter(call=>call==='arc').length);
 assert.ok(large.calls.includes('clip'));
 assert.throws(()=>drawHatch(context(),points,'earth','#fff',101),/scale/);
});

test('civil material and wetland hatches render clipped patterns',()=>{
 for(let pattern of ['brick','pavers','concrete','wetland']){
  let ctx=context();
  drawHatch(ctx,[{x:0,y:0},{x:30,y:0},{x:30,y:20},{x:0,y:20}],pattern,'#fff');
  assert.ok(ctx.calls.includes('clip'),pattern);
  assert.ok(ctx.calls.includes('stroke')||ctx.calls.includes('arc'),pattern);
  assert.equal(ctx.calls.at(-1),'restore');
 }
});

test('hatch drawing clips pattern strokes to the selected polygon',()=>{
 let ctx=context();
 drawHatch(ctx,[{x:0,y:0},{x:30,y:0},{x:30,y:20},{x:0,y:20}],'crosshatch','#fff');
 assert.equal(ctx.calls[0],'save');
 assert.ok(ctx.calls.includes('clip'));
 assert.ok(ctx.calls.filter(call=>call==='stroke').length>0);
 assert.equal(ctx.calls.at(-1),'restore');
});

test('solid hatches fill while no-hatch leaves the canvas untouched',()=>{
 let solid=context();
 drawHatch(solid,[{x:0,y:0},{x:10,y:0},{x:10,y:10}],'solid','#fff');
 assert.ok(solid.calls.includes('fillRect'));
 let none=context();
 drawHatch(none,[{x:0,y:0},{x:10,y:0},{x:10,y:10}],'none','#fff');
 assert.deepEqual(none.calls,[]);
});
