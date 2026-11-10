import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findObjectSnap,objectSnapCandidates} from '../ui/snaps.js';

const line=(a,b)=>({type:'line',a,b});

test('legacy endpoint, midpoint, center and quadrant snaps can be independently selected',()=>{
 let entities=[line({x:0,y:0},{x:10,y:0}),{type:'circle',a:{x:20,y:20},r:4}];
 assert.equal(findObjectSnap(entities,{x:.1,y:0},{enabled:{endpoint:true},tolerance:1}).kind,'Endpoint');
 assert.equal(findObjectSnap(entities,{x:5,y:.1},{enabled:{midpoint:true},tolerance:1}).kind,'Midpoint');
 assert.equal(findObjectSnap(entities,{x:20.1,y:20},{enabled:{center:true},tolerance:1}).kind,'Center');
 assert.equal(findObjectSnap(entities,{x:24,y:20.1},{enabled:{quadrant:true},tolerance:1}).kind,'Quadrant');
 assert.equal(findObjectSnap(entities,{x:20.1,y:20},{enabled:{endpoint:true},tolerance:1}),null);
 assert.equal(findObjectSnap(entities,{x:0,y:0},{enabled:{},tolerance:1}),null);
});

test('intersection snaps are limited to actual crossings of distinct finite segments',()=>{
 let crossing=[line({x:0,y:0},{x:10,y:0}),line({x:5,y:-5},{x:5,y:5})];
 assert.equal(findObjectSnap(crossing,{x:5.1,y:0},{enabled:{intersection:true},tolerance:1}).kind,'Intersection');
 let extendedOnly=[line({x:0,y:0},{x:2,y:0}),line({x:3,y:-1},{x:3,y:1})];
 assert.equal(findObjectSnap(extendedOnly,{x:3,y:0},{enabled:{intersection:true},tolerance:1}),null);
});

test('nearest and perpendicular snaps stay on finite geometry and honor disabled modes',()=>{
 let segment=line({x:0,y:0},{x:10,y:0});
 assert.deepEqual(findObjectSnap([segment],{x:4,y:2},{enabled:{perpendicular:true},tolerance:3}),{x:4,y:0,kind:'Perpendicular',distance:2});
 assert.equal(findObjectSnap([segment],{x:12,y:2},{enabled:{perpendicular:true},tolerance:3}),null);
 assert.deepEqual(findObjectSnap([segment],{x:12,y:2},{enabled:{nearest:true},tolerance:3}).kind,'Nearest');
 assert.equal(objectSnapCandidates([segment],{x:4,y:2},{nearest:false,perpendicular:false}).length,0);
});

test('nearest follows circles and arcs while arc endpoints remain finite',()=>{
 let circle={type:'circle',a:{x:0,y:0},r:5},arc={type:'arc',a:{x:20,y:0},r:5,start:0,end:Math.PI/2};
 assert.equal(findObjectSnap([circle],{x:0,y:6},{enabled:{nearest:true},tolerance:2}).kind,'Nearest');
 assert.deepEqual(findObjectSnap([arc],{x:20,y:-5},{enabled:{nearest:true},tolerance:1}),null);
 assert.equal(findObjectSnap([arc],{x:25,y:0},{enabled:{nearest:true},tolerance:1}).kind,'Nearest');
});

test('bottom information bar exposes grid, object and per-mode snap controls',async()=>{
 let html=await readFile(new URL('../ui/index.html',import.meta.url),'utf8'),app=await readFile(new URL('../ui/app.js',import.meta.url),'utf8');
 for(let mode of ['Endpoint','Center','Quadrant','Midpoint']){
  assert.ok(html.includes(`id="snap${mode}" checked`),`Missing enabled ${mode} toggle`);
 }
 for(let mode of ['Intersection','Nearest','Perpendicular'])assert.ok(html.includes(`id="snap${mode}">`),`${mode} must be off by default`);
 assert.ok(app.includes("['Endpoint','Center','Quadrant','Midpoint','Intersection','Nearest','Perpendicular']"),'App does not bind every mode toggle');
 assert.ok(html.includes('id="snap" checked'),'Missing master snap toggle');
 assert.ok(app.includes("gridSnapInput.id='gridSnap'"),'Missing independent grid-snap toggle');
 assert.ok(app.includes("$('gridSnap').checked"),'Grid snap is not independently applied');
 assert.ok(app.includes('gridVisibilityToggle'),'Missing grid visibility toggle');
 assert.ok(app.includes('footer-snap-options'),'Missing bottom-bar snap options');
 assert.ok(app.includes('GRID SNAP ')&&app.includes('OBJECT SNAP '),'Missing independent snap status');
 assert.ok(app.includes('paperSnapGeometry'),'Paper Space object snaps are not wired');
});
