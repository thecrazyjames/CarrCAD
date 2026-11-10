import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DocumentHistory} from '../ui/document-history.js';
import {updatePaperSelection,paperSnapGeometry,constrainPaperDelta,translatePaperItem,copyPaperItems,deletePaperItems} from '../ui/paper-space-editing.js';
import {findObjectSnap} from '../ui/snaps.js';

const line=(id,a,b)=>({id,type:'line',points:[a,b],color:'#223b49',lineWeight:.25,lineType:'continuous'});

test('Paper Space Shift/Ctrl selection toggles individual objects and supports groups',()=>{
 let selection=new Set;
 selection=updatePaperSelection(selection,'one');selection=updatePaperSelection(selection,'two',{additive:true});
 assert.deepEqual([...selection],['one','two']);
 selection=updatePaperSelection(selection,'one',{additive:true});
 assert.deepEqual([...selection],['two']);
 selection=updatePaperSelection(selection,'three');
 assert.deepEqual([...selection],['three']);
});

test('Paper Space snap geometry includes object anchors and frames and excludes moving items',()=>{
 let items=[line('line',{x:10,y:10},{x:30,y:10}),{id:'text',type:'text',at:{x:50,y:20},text:'Note'},{id:'table',type:'table',at:{x:60,y:30},columnWidths:[20,15],rows:[['A','B'],['C','D']],rowHeight:8},{id:'image',type:'image',at:{x:100,y:40},width:20,height:10}];
 let geometry=paperSnapGeometry(items);
 assert.equal(findObjectSnap(geometry,{x:10.5,y:10},{enabled:{endpoint:true},tolerance:2}).kind,'Endpoint');
 assert.equal(findObjectSnap(geometry,{x:50,y:20.5},{enabled:{endpoint:true},tolerance:2}).kind,'Endpoint');
 assert.equal(findObjectSnap(geometry,{x:95,y:30},{enabled:{endpoint:true},tolerance:2}).kind,'Endpoint');
 assert.equal(findObjectSnap(geometry,{x:120,y:50},{enabled:{endpoint:true},tolerance:2}).kind,'Endpoint');
 assert.equal(findObjectSnap(paperSnapGeometry(items,['line']),{x:10,y:10},{enabled:{endpoint:true},tolerance:2}),null);
});

test('group move clamps all selected bounds and group copy creates distinct IDs',()=>{
 let originals=[line('one',{x:10,y:20},{x:30,y:20}),{id:'two',type:'text',at:{x:40,y:25},text:'Note',size:4,color:'#223b49',lineWeight:.25,lineType:'continuous'}];
 let delta=constrainPaperDelta(originals,80,40,{w:100,h:60});
 assert.deepEqual(delta,{x:60,y:35});
 let moved=originals.map(item=>translatePaperItem(item,delta.x,delta.y));
 assert.deepEqual(moved[0].points[0],{x:70,y:55});
 assert.deepEqual(moved[1].at,{x:100,y:60});
 let copies=copyPaperItems(originals,5,6,index=>'copy-'+index);
 assert.deepEqual(copies.map(item=>item.id),['copy-0','copy-1']);
 assert.deepEqual(copies[1].at,{x:45,y:31});
});

test('group deletion is one undoable Paper Space history action',()=>{
 let model={entities:[],layers:[],sheet:{paperEntities:[line('one',{x:0,y:0},{x:1,y:0}),line('two',{x:0,y:1},{x:1,y:1}),line('keep',{x:0,y:2},{x:1,y:2})]}};
 let history=new DocumentHistory({getModel:()=>model,setModel:value=>{model=value},validate:()=>{}});
 history.mutate(()=>model.sheet.paperEntities=deletePaperItems(model.sheet.paperEntities,['one','two']));
 assert.deepEqual(model.sheet.paperEntities.map(item=>item.id),['keep']);
 assert.equal(history.undo(),true);
 assert.deepEqual(model.sheet.paperEntities.map(item=>item.id),['one','two','keep']);
 assert.equal(history.redo(),true);
 assert.deepEqual(model.sheet.paperEntities.map(item=>item.id),['keep']);
});
