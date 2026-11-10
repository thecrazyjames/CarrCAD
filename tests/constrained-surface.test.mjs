import {test} from 'node:test';
import assert from 'node:assert/strict';
import {area} from '../ui/geometry.js';
import {buildConstrainedSurface} from '../ui/constrained-surface.js';

const point=(id,x,y,z=x+y)=>({id,x,y,z});
const boundary=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
const corners=[point('a',0,0),point('b',10,0),point('c',10,10),point('d',0,10),point('center',5,5)];

function triangleArea(result,source){
 let points=new Map([...source,...result.vertices].map(p=>[p.id,p]));
 return result.triangles.reduce((sum,t)=>sum+area(t.map(id=>points.get(id))),0);
}

test('constrained TIN clips a hole and interpolates its boundary elevations',()=>{
 let hole=[{x:4,y:4},{x:6,y:4},{x:6,y:6},{x:4,y:6}];
 let result=buildConstrainedSurface({points:corners,boundary,holes:[hole]});
 assert.equal(result.vertices.length,4);
 assert.ok(result.vertices.every(p=>Math.abs(p.z-p.x-p.y)<1e-8));
 assert.ok(Math.abs(triangleArea(result,corners)-96)<1e-7);
});

test('constrained TIN preserves a concave boundary and multiple separate holes',()=>{
 let concave=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:6,y:10},{x:6,y:4},{x:4,y:4},{x:4,y:10},{x:0,y:10}];
 let holes=[
  [{x:1,y:1},{x:2,y:1},{x:2,y:2},{x:1,y:2}],
  [{x:8,y:1},{x:9,y:1},{x:9,y:2},{x:8,y:2}]
 ];
 let result=buildConstrainedSurface({points:corners,boundary:concave,holes});
 assert.ok(result.vertices.every(p=>Math.abs(p.z-p.x-p.y)<1e-8));
 assert.ok(Math.abs(triangleArea(result,corners)-86)<1e-7);
});

test('constrained TIN recovers a breakline through matching survey points',()=>{
 let points=[...corners.filter(p=>p.id!=='center'),point('left',0,5,0),point('mid',5,5,5),point('right',10,5,10)];
 let result=buildConstrainedSurface({points,boundary,breaklines:[[{x:0,y:5},{x:10,y:5}]]});
 let edges=new Set(result.triangles.flatMap(t=>t.map((id,i)=>{let next=t[(i+1)%3];return id<next?`${id}|${next}`:`${next}|${id}`})));
 assert.ok(edges.has('left|mid'));
 assert.ok(edges.has('mid|right'));
});

test('breaklines reject unmatched vertices and conflicting elevations',()=>{
 assert.throws(()=>buildConstrainedSurface({points:corners,boundary,breaklines:[[{x:1,y:5},{x:9,y:5}]]}),/match a surveyed point/);
 let points=[...corners.filter(p=>p.id!=='center'),point('left',0,5,0),point('mid',5,5,6),point('right',10,5,10)];
 assert.throws(()=>buildConstrainedSurface({points,boundary,breaklines:[[{x:0,y:5},{x:10,y:5}]]}),/conflicts with its interpolated elevation/);
});

test('constraints reject crossing breaklines without a shared vertex',()=>{
 let points=[...corners.filter(p=>p.id!=='center'),point('left',0,5),point('right',10,5),point('bottom',5,0),point('top',5,10)];
 assert.throws(()=>buildConstrainedSurface({points,boundary,breaklines:[
  [{x:0,y:5},{x:10,y:5}],
  [{x:5,y:0},{x:5,y:10}]
 ]}),/cross without a shared vertex/);
});

test('constraints accept crossing breaklines split at a shared surveyed vertex',()=>{
 let points=[...corners.filter(p=>p.id!=='center'),point('center',5,5),point('left',0,5),point('right',10,5),point('bottom',5,0),point('top',5,10)];
 let result=buildConstrainedSurface({points,boundary,breaklines:[
  [{x:0,y:5},{x:10,y:5}],
  [{x:5,y:0},{x:5,y:10}]
 ]});
 let edges=new Set(result.triangles.flatMap(t=>t.map((id,i)=>{let next=t[(i+1)%3];return id<next?`${id}|${next}`:`${next}|${id}`})));
 assert.ok(edges.has('center|left'));
 assert.ok(edges.has('center|right'));
 assert.ok(edges.has('bottom|center'));
 assert.ok(edges.has('center|top'));
});

test('constrained TIN remains stable at state-plane coordinate magnitudes',()=>{
 let shifted=points=>points.map(p=>({...p,x:p.x+5000000,y:p.y+10000000}));
 let result=buildConstrainedSurface({points:shifted(corners),boundary:shifted(boundary)});
 assert.ok(Math.abs(triangleArea(result,shifted(corners))-100)<1e-6);
});

test('boundary vertices outside the survey hull are rejected',()=>{
 assert.throws(()=>buildConstrainedSurface({points:corners,boundary:[{x:-1,y:0},{x:10,y:0},{x:10,y:10},{x:-1,y:10}]}),/inside the survey-point hull/);
});
