import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DocumentHistory} from '../ui/document-history.js';

function setup(options={}){
 let model={layers:[{id:'layer',name:'Layer'}],entities:[{id:'entity',layer:'layer',value:1}]};
 let calls={committed:0,rolledBack:0,restored:0};
 let history=new DocumentHistory({
  getModel:()=>model,
  setModel:value=>{model=value},
  validate:value=>{if(value.invalid)throw Error('Invalid document')},
  afterMutation:()=>calls.committed++,
  afterRollback:()=>calls.rolledBack++,
  afterRestore:()=>calls.restored++,
  ...options
 });
 return {get model(){return model},setModel:value=>{model=value},history,calls};
}

test('undo and redo restore edits while preserving entity and layer references',()=>{
 let store=setup(),entity=store.model.entities[0],layer=store.model.layers[0];
 store.history.mutate(()=>{entity.value=2;layer.name='Changed'});
 assert.strictEqual(store.model.entities[0],entity);
 assert.equal(store.model.entities[0].value,2);
 assert.equal(store.history.undo(),true);
 assert.strictEqual(store.model.entities[0],entity);
 assert.strictEqual(store.model.layers[0],layer);
 assert.equal(entity.value,1);
 assert.equal(layer.name,'Layer');
 assert.equal(store.history.redo(),true);
 assert.strictEqual(store.model.entities[0],entity);
 assert.equal(entity.value,2);
 assert.equal(store.calls.restored,2);
});

test('failed mutations roll back in place and do not enter history',()=>{
 let store=setup(),entity=store.model.entities[0];
 assert.throws(()=>store.history.mutate(()=>{entity.value=9;store.model.invalid=true}),/Invalid document/);
 assert.strictEqual(store.model.entities[0],entity);
 assert.equal(entity.value,1);
 assert.equal('invalid' in store.model,false);
 assert.equal(store.history.undo(),false);
 assert.equal(store.calls.rolledBack,1);
 assert.equal(store.calls.committed,0);
});

test('recording an opened document clears redo history and obeys the history limit',()=>{
 let store=setup({limit:2});
 store.history.mutate(()=>{store.model.entities[0].value=2});
 store.history.mutate(()=>{store.model.entities[0].value=3});
 store.history.mutate(()=>{store.model.entities[0].value=4});
 assert.equal(store.history.past.length,2);
 store.history.undo();
 let before=store.history.snapshot();
 store.setModel({layers:[{id:'new-layer',name:'New'}],entities:[]});
 store.history.record(before);
 assert.equal(store.history.future.length,0);
});

test('undo and redo restore persistent constraint metadata with the line geometry',()=>{
 let model={layers:[{id:'layer',name:'Layer'}],entities:[{id:'line',layer:'layer',type:'line',a:{x:0,y:0},b:{x:4,y:0}}],constraints:[]};
 let history=new DocumentHistory({getModel:()=>model,setModel:value=>{model=value},validate:value=>{if(value.constraints.some(c=>{let e=value.entities.find(item=>item.id===c.entityId);return !e||e.b.y!==e.a.y}))throw Error('Broken constraint')}});
 history.mutate(()=>model.constraints.push({entityId:'line',type:'horizontal'}));
 history.mutate(()=>{model.entities[0].b.x=6});
 assert.equal(history.undo(),true);
 assert.equal(model.entities[0].b.x,4);
 assert.equal(model.constraints[0].type,'horizontal');
 assert.equal(history.redo(),true);
 assert.equal(model.entities[0].b.x,6);
 assert.equal(model.constraints[0].type,'horizontal');
 assert.equal(history.undo(),true);
 assert.equal(history.undo(),true);
 assert.deepEqual(model.constraints,[]);
 assert.equal(history.redo(),true);
 assert.deepEqual(model.constraints,[{entityId:'line',type:'horizontal'}]);
});
