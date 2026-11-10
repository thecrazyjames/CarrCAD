import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PAPER_SIZES,BORDER_STYLES,PLAN_TEMPLATES,defaultSheet,validateSheet,sheetTransform,boundsOf,renderSheet,createPlanTemplate} from '../ui/sheets.js';
const layers=[{id:'drawing',visible:true},{id:'boundary',visible:true},{id:'design',visible:true},{id:'survey',visible:true}];
const model=id=>({...createPlanTemplate(id),layers});
test('every preloaded plan renders with every paper size and border',()=>{for(let template of PLAN_TEMPLATES)for(let paper of Object.keys(PAPER_SIZES))for(let border of BORDER_STYLES){let m=model(template.id),s={...m.sheet,paper,border:border.id};let result=renderSheet(m,s);assert.match(result.svg,/<svg /);assert.ok(!result.svg.includes('NaN'));assert.ok(!result.svg.includes('Infinity'));assert.ok(result.scale>0);assert.match(result.svg,/PRINT AT ACTUAL SIZE/);assert.ok(result.layout.drawing.w>0&&result.layout.drawing.h>0)}});
test('imperial paper dimensions and 1 inch = 20 feet produce exact geometry scale',()=>{assert.equal(PAPER_SIZES.archd.w,36*25.4);assert.equal(PAPER_SIZES.ansib.h,11*25.4);let m=model('addition'),t=sheetTransform(m,{...defaultSheet(),autoFit:false,scale:240,paper:'archd'});assert.ok(Math.abs((t.X(150)-t.X(125))-31.75)<1e-9);assert.equal(t.scale,240)});
test('fixed scales reject overflow while auto fit contains all drawing bounds',()=>{let m=model('residential');assert.throws(()=>renderSheet(m,{...defaultSheet(),paper:'ansib',autoFit:false,scale:10}),/does not fit/);let t=sheetTransform(m,{...defaultSheet(),paper:'ansib',autoFit:true}),b=t.bounds;assert.ok(t.X(b.minx)>=t.drawing.x);assert.ok(t.X(b.maxx)<=t.drawing.x+t.drawing.w+1e-7);assert.ok(t.Y(b.maxy)>=t.drawing.y);assert.ok(t.Y(b.miny)<=t.drawing.y+t.drawing.h+1e-7)});
test('blank border contains no model geometry; templates are independent fresh values',()=>{let a=createPlanTemplate('addition'),b=createPlanTemplate('addition');a.entities[0].points[0].x=999;assert.equal(b.entities[0].points[0].x,0);assert.equal(createPlanTemplate('blank').entities.length,0);assert.match(renderSheet({...model('blank'),name:'Blank plan'},defaultSheet()).svg,/SITE PLAN/)});
test('project text is escaped and invalid settings rejected',()=>{let m={...model('blank'),name:'<script>alert(1)</script>'};let svg=renderSheet(m,{...defaultSheet(),title:'A & B <plan>'}).svg;assert.ok(!svg.includes('<script>'));assert.match(svg,/&lt;script&gt;/);assert.match(svg,/A &amp; B &lt;plan&gt;/);assert.throws(()=>validateSheet({...defaultSheet(),scale:0}));assert.throws(()=>validateSheet({...defaultSheet(),paper:'unknown'}));assert.throws(()=>validateSheet({...defaultSheet(),northAngle:Infinity}))});
test('custom Paper Space renders editable paper objects without a generated border or title block',()=>{
 let sheet={...defaultSheet(),border:'custom',paperEntities:[{id:'frame',type:'rect',points:[{x:10,y:10},{x:800,y:550}],color:'#223b49',lineWeight:.35,lineType:'continuous'},{id:'heading',type:'text',at:{x:30,y:35},text:'<Custom & title>',size:5,color:'#223b49',lineWeight:.25,lineType:'continuous'}]};
 let svg=renderSheet(model('blank'),sheet).svg;
 assert.match(svg,/data-paper-id="frame"/);
 assert.match(svg,/data-paper-type="rect"/);
 assert.match(svg,/&lt;Custom &amp; title&gt;/);
 assert.match(svg,/data-paper-hit-target="true"/);
 assert.doesNotMatch(svg,/PROJECT INFORMATION/);
 assert.throws(()=>validateSheet({...sheet,paperEntities:[...sheet.paperEntities,{...sheet.paperEntities[0]}]}),/paper-space object/);
 assert.throws(()=>validateSheet({...sheet,paperEntities:[{...sheet.paperEntities[0],points:[{x:-1,y:0},{x:10,y:10}]}]}),/paper-space geometry/);
});
test('leader styles and hatch scale apply in model-space sheets and viewports',()=>{
 let drawing=model('blank');
 drawing.entities=[
  {id:'hatch',type:'polyline',layer:'drawing',closed:true,points:[{x:0,y:0},{x:20,y:0},{x:20,y:10},{x:0,y:10}],hatchPattern:'ansi31',hatchScale:3},
  {id:'leader',type:'leader',layer:'drawing',points:[{x:0,y:20},{x:12,y:20},{x:12,y:30}],note:'Flow',size:1,leaderLineStyle:'squiggly',leaderArrowType:'dot',leaderLineType:'dotted'}
 ];
 let viewport={id:'detail',type:'viewport',at:{x:25,y:35},width:150,height:90,modelView:{minx:-5,miny:-5,maxx:30,maxy:40},color:'#223b49',lineWeight:.35,lineType:'continuous'},svg=renderSheet(drawing,{...defaultSheet(),paperEntities:[viewport]}).svg;
 assert.match(svg,/width="33\.9411" height="33\.9411"/);
 assert.match(svg,/stroke-dasharray="1,4"/);
 assert.match(svg,/<circle cx="[^"]+" cy="[^"]+" r="[^"]+" fill="#[0-9a-f]{6}"\/>/i);
 assert.ok((svg.match(/width="33\.9411" height="33\.9411"/g)||[]).length>=2);
});
test('leaders attach to existing text without duplicating its label in Paper Space',()=>{
 let drawing=model('blank');
 drawing.entities=[
  {id:'label',type:'text',layer:'drawing',a:{x:12,y:30},text:'GRASS AREA',size:2},
  {id:'leader',type:'leader',layer:'drawing',points:[{x:0,y:20},{x:8,y:20},{x:8,y:29}],note:'',size:2,leaderArrowSize:2.4,leaderArrowType:'filled',leaderTextId:'label',leaderTextOffset:{x:-1,y:-1}}
 ];
 let svg=renderSheet(drawing,defaultSheet()).svg;
 assert.equal((svg.match(/GRASS AREA/g)||[]).length,1);
 assert.match(svg,/<path d="M[^"]+L[^"]+L[^"]+Z" fill="#[0-9a-f]{6}"\/>/i);
});
test('Paper Space brick and crosshatch use continuous patterns matching model-space geometry',()=>{
 let drawing=model('blank');
 drawing.entities=[
  {id:'brick',type:'rect',layer:'drawing',a:{x:0,y:0},b:{x:30,y:20},hatchPattern:'brick'},
  {id:'driveway',type:'rect',layer:'drawing',a:{x:40,y:0},b:{x:70,y:20},hatchPattern:'crosshatch'}
 ];
 let svg=renderSheet(drawing,defaultSheet()).svg;
 assert.match(svg,/M0 0H[\d.]+M0 [\d.]+H[\d.]+M0 [\d.]+H[\d.]+/);
 assert.match(svg,/M0 [\d.]+L[\d.]+ 0M0 0L[\d.]+ [\d.]+/);
 assert.doesNotMatch(svg,/M-1 1L1 -1/);
});
test('notes that exceed the selected sheet fail explicitly instead of overflowing',()=>{assert.throws(()=>renderSheet(model('blank'),{...defaultSheet(),paper:'ansib',notes:Array(30).fill('This is a lengthy note that cannot fit into the allotted notes column.').join('\n')}),/exceed/)});
test('image placement and rotated north arrow are included in the exported sheet',()=>{let m={...model('blank'),underlay:{x:0,y:0,width:100,ratio:2,data:'data:image/png;base64,dGVzdA=='}};let r=renderSheet(m,{...defaultSheet(),northAngle:30});assert.match(r.svg,/<image href="data:image\/png/);assert.match(r.svg,/rotate\(-30\)/)});
test('multiple visible raster references render in model space and viewports while hidden references stay out',()=>{let drawing=model('blank'),data='data:image/png;base64,dGVzdA==';drawing.rasters=[{id:'one',sourceName:'Survey',data,x:10,y:20,width:100,ratio:2,opacity:.6,visible:true,locked:false},{id:'two',sourceName:'Hidden',data,x:-500,y:-500,width:50,ratio:1,opacity:1,visible:false,locked:true}];let bounds=boundsOf(drawing);assert.deepEqual([bounds.minx,bounds.miny,bounds.maxx,bounds.maxy],[10,20,110,70]);let viewport={id:'detail',type:'viewport',at:{x:25,y:35},width:150,height:90,modelView:{minx:0,miny:0,maxx:200,maxy:100},scale:240,color:'#223b49',lineWeight:.35,lineType:'continuous'};drawing.sheet.paperEntities=[viewport];let svg=renderSheet(drawing,{...defaultSheet(),paperEntities:[viewport]}).svg;assert.equal((svg.match(/href="data:image\/png;base64,dGVzdA=="/g)||[]).length,2);assert.doesNotMatch(svg,/x="-500"/)});
test('paper-space images validate, render with opacity and reject unsafe or out-of-bounds data',()=>{let image={id:'map',type:'image',data:'data:image/png;base64,dGVzdA==',at:{x:20,y:30},width:100,height:60,opacity:.5},sheet={...defaultSheet(),border:'custom',paperEntities:[image]},svg=renderSheet(model('blank'),sheet).svg;assert.match(svg,/<image data-paper-id="map"[^>]+opacity="0.5"/);assert.match(svg,/data:image\/png;base64,dGVzdA==/);assert.throws(()=>validateSheet({...sheet,paperEntities:[{...image,data:'https:\/\/example.test/map.png'}]}),/paper-space image/);assert.throws(()=>validateSheet({...sheet,paperEntities:[{...image,at:{x:900,y:30}}]}),/paper-space image/);assert.throws(()=>validateSheet({...sheet,paperEntities:[{...image,width:0}]}),/paper-space image/)});
test('paper-space tables render escaped cells and reject inconsistent or overflowing grids',()=>{let table={id:'soils',type:'table',at:{x:20,y:30},rows:[['Name','Area'],['A & B','< 1 acre']],columnWidths:[40,30],rowHeight:8,textSize:2.5,color:'#223b49',lineWeight:.25,lineType:'continuous'},sheet={...defaultSheet(),border:'custom',paperEntities:[table]},svg=renderSheet(model('blank'),sheet).svg;assert.match(svg,/data-paper-id="soils" data-paper-type="table"/);assert.match(svg,/A &amp; B/);assert.match(svg,/&lt; 1 acre/);assert.throws(()=>validateSheet({...sheet,paperEntities:[{...table,rows:[['one'],['two','three']]}]}),/paper-space table/);assert.throws(()=>validateSheet({...sheet,paperEntities:[{...table,at:{x:900,y:30}}]}),/paper-space table/);assert.throws(()=>validateSheet({...sheet,paperEntities:[{...table,columnWidths:[5,30]}]}),/paper-space table/)});
test('model viewports clip visible model geometry and validate independent view bounds',()=>{let viewport={id:'detail',type:'viewport',at:{x:25,y:35},width:150,height:90,modelView:{minx:40,miny:50,maxx:160,maxy:130},color:'#223b49',lineWeight:.35,lineType:'dashed'},drawing=model('residential'),sheet={...defaultSheet(),border:'custom',paperEntities:[viewport]},svg=renderSheet(drawing,sheet).svg;assert.match(svg,/data-paper-id="detail" data-paper-type="viewport"/);assert.match(svg,/data-viewport-content="true"/);assert.match(svg,/clipPath id="model-viewport-0"/);assert.match(svg,/clip-path="url\(#model-viewport-0\)"/);assert.match(svg,/stroke-dasharray="3 1.5"/);assert.throws(()=>validateSheet({...sheet,paperEntities:[{...viewport,modelView:{...viewport.modelView,maxx:viewport.modelView.minx}}]}),/model viewport/);assert.throws(()=>validateSheet({...sheet,paperEntities:[{...viewport,at:{x:900,y:35}}]}),/model viewport/);assert.throws(()=>validateSheet({...sheet,paperEntities:[{...viewport,scale:0}]}),/model viewport/)});
test('layer hatch defaults and semantic linetypes render in the sheet and viewport',()=>{let drawing=model('blank'),viewport={id:'detail',type:'viewport',at:{x:25,y:35},width:150,height:90,modelView:{minx:0,miny:0,maxx:100,maxy:100},color:'#223b49',lineWeight:.35,lineType:'storm-sewer'};drawing.layers[0].lineType='storm-sewer';drawing.layers[0].hatchPattern='brick';drawing.entities=[{id:'paved',type:'rect',a:{x:10,y:10},b:{x:40,y:40},layer:'drawing'}];let svg=renderSheet(drawing,{...defaultSheet(),border:'custom',paperEntities:[viewport]}).svg;assert.match(svg,/pattern id="main-hatch-0"/);assert.match(svg,/pattern id="viewport-0-hatch-0"/);assert.match(svg,/stroke-dasharray="12,3,1,3"/)});
test('hiding the fitted model leaves viewport geometry visible and avoids its scale-fit constraint',()=>{let drawing=model('blank');drawing.entities=[{type:'text',a:{x:10,y:10},text:'VIEWPORT ONLY',size:3,layer:'drawing'}];let viewport={id:'detail',type:'viewport',at:{x:25,y:35},width:150,height:90,modelView:{minx:0,miny:0,maxx:20,maxy:20},color:'#223b49',lineWeight:.35,lineType:'continuous'},sheet={...defaultSheet(),border:'technical',showModel:false,autoFit:false,scale:1,paperEntities:[viewport]},svg=renderSheet(drawing,sheet).svg;assert.equal([...svg.matchAll(/VIEWPORT ONLY/g)].length,1);assert.doesNotMatch(svg,/clipPath id="model-clip"/);assert.match(svg,/data-paper-id="detail" data-paper-type="viewport"/);assert.match(svg,/SEE VIEWPORT/)});
test('leader annotations render note text and arrow geometry in sheet output',()=>{let drawing=model('blank');drawing.entities=[{type:'leader',points:[{x:0,y:0},{x:8,y:4},{x:12,y:4}],note:'Existing utility',size:2,layer:'drawing'}];let svg=renderSheet(drawing,defaultSheet()).svg;assert.match(svg,/Existing utility/);assert.match(svg,/L[\d.-]+ [\d.-]+/);assert.ok(!svg.includes('NaN'))});
