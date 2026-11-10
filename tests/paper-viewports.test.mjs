import {test} from 'node:test';
import assert from 'node:assert/strict';
import {panViewport,resizeViewportAtScale,SITE_SCALE_PRESETS,viewportBoundsAtScale,viewportScale} from '../ui/paper-viewports.js';

test('common site scales expose inch-to-foot labels and ratio denominators',()=>{
 assert.deepEqual(SITE_SCALE_PRESETS.map(({feet,denominator,label})=>[feet,denominator,label]),[
  [10,120,'1″ = 10′'],[20,240,'1″ = 20′'],[30,360,'1″ = 30′'],[40,480,'1″ = 40′'],
  [50,600,'1″ = 50′'],[100,1200,'1″ = 100′'],[200,2400,'1″ = 200′']
 ]);
});

test('viewport bounds preserve a requested drawing scale and physical aspect ratio',()=>{
 let bounds=viewportBoundsAtScale(150,90,{x:100,y:50},240,'ft');
 assert.ok(Math.abs((bounds.maxx-bounds.minx)-150*240/304.8)<1e-10);
 assert.ok(Math.abs((bounds.maxy-bounds.miny)-90*240/304.8)<1e-10);
 assert.equal(viewportScale({width:150,height:90,modelView:bounds,scale:240},'ft'),240);
});

test('resizing keeps the viewport scale and center while revealing additional model area',()=>{
 let viewport={width:150,height:90,modelView:{minx:0,miny:0,maxx:100,maxy:60},scale:240};
 let next=resizeViewportAtScale(viewport,180,90,'ft');
 assert.equal(next.scale,240);
 assert.equal((next.modelView.minx+next.modelView.maxx)/2,50);
 assert.equal((next.modelView.miny+next.modelView.maxy)/2,30);
 assert.ok(next.modelView.maxx-next.modelView.minx>viewport.modelView.maxx-viewport.modelView.minx);
});

test('panning moves model contents by paper-space distance without changing scale or frame',()=>{
 let viewport={at:{x:10,y:15},width:120,height:60,modelView:{minx:0,miny:0,maxx:100,maxy:50},scale:254};
 let next=panViewport(viewport,25,-12.5,'ft');
 assert.equal(next.at,viewport.at);
 assert.equal(next.scale,viewport.scale);
 assert.ok(next.modelView.minx<viewport.modelView.minx);
 assert.ok(next.modelView.miny<viewport.modelView.miny);
});

test('legacy viewports derive their scale and invalid scales fail explicitly',()=>{
 let legacy={width:100,height:50,modelView:{minx:0,miny:0,maxx:50,maxy:25}};
 assert.equal(viewportScale(legacy,'ft'),152.4);
 assert.throws(()=>viewportBoundsAtScale(100,50,{x:0,y:0},0,'ft'),/scale/i);
 assert.throws(()=>panViewport(legacy,1,1,'unknown'),/units/i);
});
