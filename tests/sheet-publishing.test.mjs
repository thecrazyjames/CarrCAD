import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshProject,validateProjectModel} from '../ui/project-model.js';
import {renderSheetSetPages,requireUniformPDFPages} from '../ui/sheet-publishing.js';
import {validatePDFRequest,createPDFHTML} from '../desktop/files.mjs';

test('sheet-set publishing renders every stored sheet with its own paper and content',()=>{
 let model=freshProject(),first=model.sheetPages[0];
 first.settings={...first.settings,paper:'archd',border:'custom',paperEntities:[{id:'one',type:'text',at:{x:10,y:15},text:'FIRST SHEET',size:4,color:'#223b49',lineWeight:.25,lineType:'continuous'}]};
 let second={id:'second',name:'C-202',settings:{...first.settings,paper:'a3',sheetNo:'C-202',paperEntities:[{id:'two',type:'text',at:{x:10,y:15},text:'SECOND SHEET',size:4,color:'#223b49',lineWeight:.25,lineType:'continuous'}]}};
 model.sheetPages.push(second);validateProjectModel(model);
 let pages=renderSheetSetPages(model);
 assert.equal(pages.length,2);
 assert.equal(pages[0].width,914.4);
 assert.equal(pages[0].height,609.6);
 assert.equal(pages[1].width,420);
 assert.equal(pages[1].height,297);
 assert.match(pages[0].svg,/FIRST SHEET/);
 assert.match(pages[1].svg,/SECOND SHEET/);
 assert.throws(()=>requireUniformPDFPages(pages),/Export sheets separately/);
});

test('uniform sheet sets produce a complete ordered multi-page PDF request shape',()=>{
 let model=freshProject(),settings=model.sheetPages[0].settings;
 settings={...settings,paper:'ansib',border:'custom',paperEntities:[]};
 model.sheetPages=[{...model.sheetPages[0],settings},{id:'second',name:'C-102',settings:{...settings,sheetNo:'C-102',paperEntities:[{id:'second-note',type:'text',at:{x:20,y:20},text:'Second page',size:4,color:'#223b49',lineWeight:.25,lineType:'continuous'}]}}];
 let pages=requireUniformPDFPages(renderSheetSetPages(model));
 assert.equal(pages.length,2);
 assert.ok(pages.every(page=>page.width===431.8&&page.height===279.4));
 assert.match(pages[0].svg,/<svg /);
 assert.match(pages[1].svg,/Second page/);
 let request={pages:pages.map(({svg,width,height})=>({svg,width,height})),name:'set.pdf'};
 assert.equal(validatePDFRequest(request),request);
 let html=createPDFHTML(request);
 assert.equal((html.match(/class="page"/g)||[]).length,2);
 assert.match(html,/<title>set\.pdf<\/title>/);
 assert.match(html,/break-after:page/);
 assert.match(createPDFHTML({...request,name:'set & <plan>.pdf'}),/<title>set &amp; &lt;plan&gt;\.pdf<\/title>/);
});
