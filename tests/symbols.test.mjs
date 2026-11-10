import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CIVIL_SYMBOLS,civilSymbolPreviewSVG,createCivilSymbol} from '../ui/symbols.js';

test('civil symbol catalog stamps grouped editable geometry at a requested position and size',()=>{
 assert.ok(['test-pit','well','survey-monument','spot-elevation','fence-post','brush-clump','slope-arrow'].every(id=>CIVIL_SYMBOLS.some(symbol=>symbol.id===id)));
 for(let symbol of CIVIL_SYMBOLS){
  let parts=createCivilSymbol(symbol.id,{x:100,y:200},8,0,'survey','group-1');
  assert.ok(parts.length>1);
  assert.ok(parts.every(part=>part.symbolId===symbol.id&&part.symbolGroup==='group-1'&&part.layer==='survey'));
  assert.ok(parts.every(part=>part.type==='circle'?part.r>0:part.type==='line'?[part.a.x,part.a.y,part.b.x,part.b.y].every(Number.isFinite):part.points.length>=2));
 }
});

test('civil symbols rotate around their insertion point and reject invalid requests',()=>{
 let symbol=createCivilSymbol('fire-hydrant',{x:10,y:20},4,Math.PI/2,'drawing','group-2');
 assert.deepEqual(symbol[1].a,{x:11.6,y:20});
 assert.deepEqual(symbol[1].b,{x:8.4,y:20});
 assert.throws(()=>createCivilSymbol('unknown',{x:0,y:0},4,0,'drawing','g'),/supported civil symbol/);
 assert.throws(()=>createCivilSymbol('manhole',{x:0,y:0},0,0,'drawing','g'),/invalid/i);
});

test('every civil symbol provides a named-catalog-ready geometry preview',()=>{
 for(let symbol of CIVIL_SYMBOLS){
  let preview=civilSymbolPreviewSVG(symbol.id);
  assert.match(preview,/<svg viewBox="-1.25 -1.25 2.5 2.5"/);
  assert.match(preview,/<(?:circle|path)\b/);
  assert.match(preview,/aria-hidden="true"/);
 }
 assert.throws(()=>civilSymbolPreviewSVG('unknown'),/supported civil symbol/);
});
