import {test} from 'node:test';
import assert from 'node:assert/strict';
import {leaderArrowGeometry,leaderArrowSizeFor,leaderPathPoints,leaderPointsForEntity} from '../ui/leader-geometry.js';

test('leader path styles preserve vertices and create a wavy path through each segment',()=>{
 let points=[{x:0,y:0},{x:12,y:0},{x:12,y:8}],straight=leaderPathPoints(points),squiggly=leaderPathPoints(points,'squiggly',1);
 assert.deepEqual(straight,points);
 assert.deepEqual(squiggly[0],points[0]);
 assert.deepEqual(squiggly.at(-1),points.at(-1));
 assert.ok(squiggly.length>points.length);
 for(let vertex of points.slice(1,-1))assert.ok(squiggly.some(point=>Math.hypot(point.x-vertex.x,point.y-vertex.y)<1e-8));
 assert.throws(()=>leaderPathPoints(points,'unknown'),/style/);
});

test('leader arrow geometry supports arrowheads, dots and no arrow',()=>{
 let points=[{x:0,y:0},{x:10,y:0}],arrow=leaderArrowGeometry(points,'arrow',2),dot=leaderArrowGeometry(points,'dot',2);
 assert.equal(arrow.lines.length,2);
 assert.ok(arrow.lines.every(line=>line[0].x===0&&line[1].x<0));
 assert.deepEqual(dot,{type:'dot',center:{x:0,y:0},radius:.36});
 assert.deepEqual(leaderArrowGeometry(points,'none',2),{type:'none'});
});

test('filled arrows size independently and attached leaders follow their text anchor',()=>{
 let points=[{x:0,y:0},{x:10,y:0}],filled=leaderArrowGeometry(points,'filled',3),leader={points,leaderTextId:'label',leaderTextOffset:{x:2,y:4},size:2};
 assert.equal(filled.type,'filled');
 assert.deepEqual(filled.points[0],{x:0,y:0});
 assert.equal(filled.points[1].x,3);
 assert.ok(Math.abs(filled.points[1].y-1.14)<1e-10);
 assert.equal(filled.points[2].x,3);
 assert.ok(Math.abs(filled.points[2].y+1.14)<1e-10);
 assert.equal(leaderArrowSizeFor(leader),1.6);
 assert.equal(leaderArrowSizeFor({...leader,leaderArrowSize:4}),4);
 assert.deepEqual(leaderPointsForEntity(leader,[{id:'label',type:'text',a:{x:20,y:30}}]),[{x:0,y:0},{x:22,y:34}]);
});
