import {test} from 'node:test';
import assert from 'node:assert/strict';
import {constrainLine,validateConstraints} from '../ui/constraints.js';
import {moveGrip,transform} from '../ui/drafting.js';

const line=()=>({id:'line-1',type:'line',layer:'drawing',a:{x:1,y:2},b:{x:5,y:7}});

test('horizontal and vertical constraints align endpoint B and reject zero-length results',()=>{
 let horizontal=constrainLine(line(),'horizontal');
 assert.deepEqual(horizontal.b,{x:5,y:2});
 validateConstraints([{entityId:horizontal.id,type:'horizontal'}],[horizontal]);
 let vertical=constrainLine(line(),'vertical');
 assert.deepEqual(vertical.b,{x:1,y:7});
 validateConstraints([{entityId:vertical.id,type:'vertical'}],[vertical]);
 assert.throws(()=>constrainLine({...line(),b:{x:1,y:7}},'horizontal'),/zero-length/);
 assert.throws(()=>constrainLine(line(),'coincident'),/Unsupported/);
 assert.throws(()=>constrainLine({...line(),type:'polyline'},'horizontal'),/LINE entities only/);
});

test('constraint validation rejects malformed, dangling, unsupported and unsatisfied records',()=>{
 let horizontal={...line(),b:{x:5,y:2}},valid=[{entityId:horizontal.id,type:'horizontal'}];
 assert.doesNotThrow(()=>validateConstraints(valid,[horizontal]));
 for(let constraints of [
  null,
  [{entityId:'missing',type:'horizontal'}],
  [{entityId:horizontal.id,type:'parallel'}],
  [{entityId:horizontal.id,type:'horizontal',extra:true}],
  [valid[0],valid[0]]
 ])assert.throws(()=>validateConstraints(constraints,[horizontal]));
 assert.throws(()=>validateConstraints(valid,[{...horizontal,type:'block'}]),/existing LINE/);
 assert.throws(()=>validateConstraints(valid,[{...horizontal,b:{x:5,y:3}}]),/not satisfied/);
});

test('grip and geometry transforms must retain a LINE constraint',()=>{
 let horizontal={...line(),b:{x:5,y:2}},constraint=[{entityId:horizontal.id,type:'horizontal'}];
 let alongLine=moveGrip(horizontal,1,{x:8,y:2});
 assert.doesNotThrow(()=>validateConstraints(constraint,[alongLine]));
 let offLine=moveGrip(horizontal,1,{x:8,y:3});
 assert.throws(()=>validateConstraints(constraint,[offLine]),/not satisfied/);
 let translated=transform(horizontal,{dx:10,dy:-4});
 assert.doesNotThrow(()=>validateConstraints(constraint,[translated]));
 let rotated=transform(horizontal,{base:{x:0,y:0},angle:Math.PI/2});
 assert.throws(()=>validateConstraints(constraint,[rotated]),/not satisfied/);
 let scaled=transform(horizontal,{base:{x:0,y:0},factor:2});
 assert.doesNotThrow(()=>validateConstraints(constraint,[scaled]));
});
