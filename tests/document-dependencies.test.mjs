import {test} from 'node:test';
import assert from 'node:assert/strict';
import {invalidateDerivedData} from '../ui/document-dependencies.js';

function project(){
 return {
  units:'ft',
  entities:[
   {id:'p1',type:'point',a:{x:0,y:0,z:1},name:'1'},
   {id:'p2',type:'point',a:{x:10,y:0,z:2},name:'2'},
   {id:'p3',type:'point',a:{x:0,y:10,z:3},name:'3'},
   {id:'alignment',type:'alignment',points:[{x:0,y:0},{x:10,y:10}],station:100}
  ],
  surface:{triangles:[['p1','p2','p3']],interval:2}
 };
}

test('point metadata edits retain a valid surface, contours and profile',()=>{
 let before=project(),current=structuredClone(before);
 current.entities[0].name='Control point A';
 let result=invalidateDerivedData(before,current,'alignment');
 assert.deepEqual(result,{surfaceInvalidated:false,contoursInvalidated:false,profileInvalidated:false});
 assert.deepEqual(current.surface,before.surface);
});

test('point geometry edits invalidate the surface and its dependent results',()=>{
 let before=project(),current=structuredClone(before);
 current.entities[0].a.z=1.5;
 let result=invalidateDerivedData(before,current,'alignment');
 assert.deepEqual(result,{surfaceInvalidated:true,contoursInvalidated:true,profileInvalidated:true});
 assert.equal(current.surface,null);
});

test('constraint-linework edits invalidate a constrained surface',()=>{
 let before=project(),boundary={id:'boundary',type:'polyline',closed:true,points:[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}]};
 before.entities.push(boundary);
 before.surfaceDefinition={boundary:'boundary',holes:[],breaklines:[]};
 let current=structuredClone(before);
 current.entities.find(e=>e.id==='boundary').points[1].y=1;
 let result=invalidateDerivedData(before,current,'alignment');
 assert.deepEqual(result,{surfaceInvalidated:true,contoursInvalidated:true,profileInvalidated:true});
 assert.equal(current.surface,null);
});

test('alignment edits invalidate only its sampled profile',()=>{
 let before=project(),current=structuredClone(before);
 current.entities.find(e=>e.id==='alignment').points[1].y=12;
 let result=invalidateDerivedData(before,current,'alignment');
 assert.deepEqual(result,{surfaceInvalidated:false,contoursInvalidated:false,profileInvalidated:true});
 assert.deepEqual(current.surface,before.surface);
});

test('contour interval changes invalidate contours but not sampled profile',()=>{
 let before=project(),current=structuredClone(before);
 current.surface.interval=1;
 let result=invalidateDerivedData(before,current,'alignment');
 assert.deepEqual(result,{surfaceInvalidated:false,contoursInvalidated:true,profileInvalidated:false});
});

test('unit changes invalidate profile presentation without rebuilding terrain',()=>{
 let before=project(),current=structuredClone(before);
 current.units='m';
 let result=invalidateDerivedData(before,current,'alignment');
 assert.deepEqual(result,{surfaceInvalidated:false,contoursInvalidated:false,profileInvalidated:true});
});
