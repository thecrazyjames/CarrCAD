import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exportDXF} from '../ui/exchange.js';
import {freshProject} from '../ui/project-model.js';
import {defaultSheet,renderSheet} from '../ui/sheets.js';

function fenceProject(){
 let project=freshProject(),layer=project.layers[0];
 layer.lineType='fence-line';
 layer.color='#123456';
 project.entities=[{id:'fence',type:'polyline',layer:layer.id,closed:false,points:[{x:0,y:0},{x:40,y:15}]}];
 return project;
}

test('fence X marks render in fitted sheet geometry and clipped model viewports',()=>{
 let project=fenceProject(),sheet={...defaultSheet(),border:'custom',paper:'archd',paperEntities:[]},fitted=renderSheet(project,sheet).svg;
 assert.match(fitted,/stroke-dasharray="8,4"/);
 assert.match(fitted,/<path d="M[\d.-]+ [\d.-]+L[\d.-]+ [\d.-]+" fill="none" stroke="#123456" stroke-width="0.25"\/>/);
 let viewport={id:'detail',type:'viewport',at:{x:50,y:50},width:200,height:100,modelView:{minx:0,miny:0,maxx:40,maxy:15},color:'#223b49',lineWeight:.35,lineType:'continuous'};
 let view=renderSheet(project,{...sheet,showModel:false,paperEntities:[viewport]}).svg;
 assert.match(view,/data-viewport-content="true"/);
 assert.match(view,/<path d="M[\d.-]+ [\d.-]+L[\d.-]+ [\d.-]+" fill="none" stroke="#123456" stroke-width="0.25"\/>/);
});

test('fence X marks export as continuous DXF geometry on the fence layer',()=>{
 let project=fenceProject();
 project.entities[0].points=[{x:0,y:0},{x:2,y:0}];
 let dxf=exportDXF(project),markers=dxf.split('\n0\nLINE\n').slice(1);
 assert.equal(markers.length,4);
 assert.ok(markers.every(segment=>/^8\nDrawing\n6\nCONTINUOUS\n/.test(segment)));
});
