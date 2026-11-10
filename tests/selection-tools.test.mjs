import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectionPanelsForSelection} from '../ui/selection-tools.js';

const panels=(...entities)=>[...selectionPanelsForSelection(entities)].sort();

test('closed boundaries retain parcel conversion and constrained TIN tools',()=>{
 assert.deepEqual(panels({type:'polyline',closed:true}),['blockTools','parcels','survey']);
 assert.deepEqual(panels({type:'parcel',closed:true}),['labelStyles','parcels','survey']);
 assert.deepEqual(panels({type:'rect'}),['blockTools','parcels']);
});

test('open linework exposes constrained TIN and alignment tools',()=>{
 assert.deepEqual(panels({type:'line'}),['alignment','blockTools','survey']);
 assert.deepEqual(panels({type:'polyline',closed:false}),['alignment','blockTools','survey']);
 assert.deepEqual(panels({type:'alignment',closed:false}),['alignment','labelStyles']);
});

test('annotation, label and block workflows match their selected object types',()=>{
 assert.deepEqual(panels({type:'text'}),['blockTools','textStyles']);
 assert.deepEqual(panels({type:'text',contourLabel:true,labelStyleId:'contour'}),['blockTools','labelStyles','textStyles']);
 assert.deepEqual(panels({type:'block'}),['blockTools']);
});

test('unrelated object types retain only the drafting panel while active workspace tools remain reachable',()=>{
 assert.deepEqual(panels({type:'circle'}),['blockTools']);
 assert.deepEqual(panels({type:'point'}),[]);
 assert.deepEqual([...selectionPanelsForSelection([], 'parcels')],['parcels']);
 assert.deepEqual([...selectionPanelsForSelection([{type:'point'}], 'survey')],['survey']);
});

test('every block-supported primitive retains reusable-block tools',()=>{
 for(let type of ['line','rect','circle','arc','text','leader','dim','polyline']){
  assert.ok(selectionPanelsForSelection([{type}]).has('blockTools'),`${type} selection lost reusable-block tools`);
 }
});

test('mixed linework keeps constrained TIN tools without offering single-object conversions',()=>{
 assert.deepEqual(panels({type:'line'},{type:'polyline',closed:true}),['blockTools','survey']);
});
