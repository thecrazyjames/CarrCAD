import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createContourLabels} from '../ui/contour-labels.js';

test('major contour labels use one longest cleanly separated segment per selected elevation',()=>{
 let labels=createContourLabels([{z:0,a:{x:0,y:0},b:{x:2,y:0}},{z:2,a:{x:0,y:0},b:{x:10,y:0}},{z:2,a:{x:0,y:1},b:{x:3,y:1}},{z:4.0000000001,a:{x:2,y:0},b:{x:2,y:6}},{z:3,a:{x:0,y:0},b:{x:20,y:0}}],2,2);
 assert.deepEqual(labels,[{elevation:0,text:'0',at:{x:1,y:0}},{elevation:4.0000000001,text:'4',at:{x:2,y:3}}]);
});

test('contour labels reject invalid frequencies and non-finite segments',()=>{
 assert.throws(()=>createContourLabels([],2,0),/settings/);
 assert.throws(()=>createContourLabels([{z:2,a:{x:0,y:0},b:{x:Infinity,y:1}}],2),/invalid coordinates/);
});
