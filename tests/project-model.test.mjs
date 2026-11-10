import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshProject,migrateProject,validateProjectModel} from '../ui/project-model.js';

test('fresh projects have a valid versioned project model',()=>{
 let project=freshProject();
 assert.equal(project.version,2);
 assert.deepEqual(project.entities,[]);
 assert.deepEqual(project.rasters,[]);
 assert.equal(project.sheetPages.length,1);
 assert.equal(project.sheetPages[0].id,project.activeSheetId);
 assert.deepEqual(project.sheetSet,{name:'Untitled drawing',description:'',issue:'',revision:''});
 assert.equal(project.layers[0].lineType,'continuous');
 assert.equal(project.layers[0].lineWeight,0.25);
 assert.deepEqual(Object.keys(project.labelStyles),['parcel','contour','alignment']);
 assert.equal(validateProjectModel(project),undefined);
});

test('leader styles and hatch scales validate and persist as entity properties',()=>{
 let project=freshProject();
 project.entities=[
  {id:'label',type:'text',layer:'drawing',a:{x:10,y:10},text:'Callout',size:1},
  {id:'leader',type:'leader',layer:'drawing',points:[{x:0,y:0},{x:10,y:0}],note:'',size:1,leaderArrowSize:2.5,leaderLineStyle:'squiggly',leaderArrowType:'filled',leaderLineType:'dashed',leaderTextId:'label',leaderTextOffset:{x:0,y:-1}},
  {id:'hatch',type:'polyline',layer:'drawing',closed:true,points:[{x:0,y:0},{x:10,y:0},{x:10,y:10}],hatchPattern:'ansi31',hatchScale:3}
 ];
 assert.equal(validateProjectModel(project),undefined);
 assert.throws(()=>validateProjectModel({...project,entities:project.entities.map(entity=>entity.id==='leader'?{...entity,leaderArrowType:'triangle'}:entity)}),/leader annotation/);
 assert.throws(()=>validateProjectModel({...project,entities:project.entities.map(entity=>entity.id==='leader'?{...entity,leaderTextId:'missing'}:entity)}),/leader text reference/);
 assert.throws(()=>validateProjectModel({...project,entities:project.entities.map(entity=>entity.id==='leader'?{...entity,leaderArrowSize:101}:entity)}),/leader annotation/);
 assert.throws(()=>validateProjectModel({...project,entities:project.entities.map(entity=>entity.id==='hatch'?{...entity,hatchScale:101}:entity)}),/hatch scale/);
 assert.throws(()=>validateProjectModel({...project,entities:project.entities.map(entity=>entity.id==='hatch'?{...entity,hatchScale:2,type:'alignment',hatchPattern:undefined}:entity)}),/hatch scale/);
});

test('single raster underlays migrate to an independently managed reference collection',()=>{
 let legacy=freshProject();delete legacy.rasters;legacy.underlay={data:'data:image/png;base64,dGVzdA==',x:10,y:20,width:100,ratio:2,sourceName:'survey.png',opacity:.4};
 let migrated=migrateProject(legacy,()=> 'raster-1');
 assert.equal(migrated.underlay,undefined);
 assert.deepEqual(migrated.rasters,[{id:'raster-1',sourceName:'survey.png',visible:true,locked:true,opacity:.4,data:'data:image/png;base64,dGVzdA==',x:10,y:20,width:100,ratio:2}]);
 assert.equal(validateProjectModel(migrated),undefined);
 assert.equal(migrateProject(JSON.parse(JSON.stringify(migrated)),()=>{throw Error('Current raster projects should not be remigrated.')}).rasters[0].id,'raster-1');
 for(let invalid of [{...migrated.rasters[0],id:''},{...migrated.rasters[0],visible:1},{...migrated.rasters[0],width:0},{...migrated.rasters[0],data:'https://example.test/image.png'}])assert.throws(()=>validateProjectModel({...migrated,rasters:[invalid]}),/raster reference/);
});

test('raster reference counts and embedded data stay within project budgets',()=>{
 let makeRaster=(id,data='data:image/png;base64,AA==')=>({id,sourceName:'Reference',data,x:0,y:0,width:1,ratio:1,visible:true,locked:false,opacity:1}),project=freshProject();
 project.rasters=Array.from({length:64},(_,index)=>makeRaster('raster-'+index));assert.equal(validateProjectModel(project),undefined);
 project.rasters.push(makeRaster('raster-over-limit'));assert.throws(()=>validateProjectModel(project),/Invalid raster references/);
 project=freshProject();project.rasters=Array.from({length:6},(_,index)=>makeRaster('large-'+index,'data:image/png;base64,'+'a'.repeat(2100000)));assert.throws(()=>validateProjectModel(project),/project size budget/);
 project=freshProject();project.rasters=[makeRaster('too-large','data:image/png;base64,'+'a'.repeat(2200000))];assert.throws(()=>validateProjectModel(project),/Invalid raster reference/);
});

test('native sheet-set metadata migrates, persists independently of page revision, and is bounded',()=>{
 let legacy=freshProject();delete legacy.sheetSet;legacy.sheet.revision='A';legacy.sheetPages[0].settings.revision='A';
 let migrated=migrateProject(legacy);
 assert.deepEqual(migrated.sheetSet,{name:'Untitled drawing',description:'',issue:'',revision:''});
 migrated.sheetSet={name:'North Parcel',description:'Permit plan set',issue:'Issued for review',revision:'2'};
 assert.equal(validateProjectModel(migrated),undefined);
 let reopened=migrateProject(JSON.parse(JSON.stringify(migrated)));
 assert.equal(reopened.sheetSet.revision,'2');
 assert.equal(reopened.sheet.revision,'A');
 for(let invalid of [{...migrated.sheetSet,name:''},{...migrated.sheetSet,name:'n'.repeat(151)},{...migrated.sheetSet,description:'d'.repeat(1001)},{...migrated.sheetSet,issue:'\u0000'},{...migrated.sheetSet,unexpected:'value'}]){
  assert.throws(()=>validateProjectModel({...migrated,sheetSet:invalid}),/sheet-set metadata/);
 }
});

test('legacy migration assigns stable IDs that survive saving and reopening',()=>{
 let migrated=migrateProject({name:'Legacy',units:'m',grid:2,entities:[{type:'line',a:{x:0,y:0},b:{x:10,y:0}}]});
 assert.equal(migrated.name,'Legacy');
 assert.equal(migrated.units,'m');
 assert.match(migrated.entities[0].id,/^[a-f0-9-]+$/i);
 validateProjectModel(migrated);
 let id=migrated.entities[0].id;
 let reopened=migrateProject(JSON.parse(JSON.stringify(migrated)),()=>{throw Error('Current projects should not be remigrated.')});
 assert.equal(reopened.entities[0].id,id);
});

test('older version-2 projects migrate their single sheet into the new collection',()=>{
 let legacy={...freshProject(),sheet:{...freshProject().sheet,sheetNo:'C-204'},sheetPages:undefined,activeSheetId:undefined};
 let migrated=migrateProject(legacy,()=> 'sheet-id');
 assert.equal(migrated.activeSheetId,'sheet-id');
 assert.equal(migrated.sheetPages.length,1);
 assert.equal(migrated.sheetPages[0].settings.sheetNo,'C-204');
 assert.equal(migrated.sheet.sheetNo,'C-204');
 validateProjectModel(migrated);
});

test('version-2 migration defaults missing constraints and persists valid LINE constraints',()=>{
 let legacy=freshProject(),line={id:'constrained',type:'line',layer:'drawing',a:{x:0,y:2},b:{x:5,y:2}};
 delete legacy.constraints;legacy.entities=[line];
 let migrated=migrateProject(legacy);
 assert.deepEqual(migrated.constraints,[]);
 migrated.constraints=[{entityId:line.id,type:'horizontal'}];
 assert.equal(validateProjectModel(migrated),undefined);
 let reopened=migrateProject(JSON.parse(JSON.stringify(migrated)));
 assert.deepEqual(reopened.constraints,migrated.constraints);
 assert.equal(validateProjectModel(reopened),undefined);
});

test('existing version-2 projects migrate to named label style defaults and keep them on reopen',()=>{
 let legacy=freshProject(),parcel={id:'parcel',type:'parcel',layer:'boundary',points:[{x:0,y:0},{x:8,y:0},{x:8,y:5},{x:0,y:5}]};
 legacy.entities=[parcel];delete legacy.labelStyles;delete legacy.activeLabelStyles;
 let migrated=migrateProject(legacy);
 assert.equal(migrated.activeLabelStyles.parcel,'parcel-standard');
 assert.equal(migrated.entities[0].labelStyleId,undefined);
 assert.equal(validateProjectModel(migrated),undefined);
 let reopened=migrateProject(JSON.parse(JSON.stringify(migrated)));
 assert.deepEqual(reopened.labelStyles,migrated.labelStyles);
 assert.deepEqual(reopened.activeLabelStyles,migrated.activeLabelStyles);
});

test('existing version-2 projects migrate to named text styles and preserve valid references',()=>{
 let legacy=freshProject(),style=legacy.textStyles[1];
 delete legacy.textStyles;delete legacy.activeTextStyleId;
 legacy.entities=[{id:'note',type:'text',layer:'drawing',a:{x:1,y:2},text:'GENERAL NOTES'}];
 let migrated=migrateProject(legacy);
 assert.equal(migrated.activeTextStyleId,'text-general');
 assert.equal(validateProjectModel(migrated),undefined);
 migrated.entities[0].textStyleId=style.id;
 migrated.entities[0].size=undefined;
 assert.equal(validateProjectModel(migrated),undefined);
 let reopened=migrateProject(JSON.parse(JSON.stringify(migrated)));
 assert.equal(reopened.entities[0].textStyleId,style.id);
 assert.throws(()=>validateProjectModel({...migrated,entities:[{...migrated.entities[0],textStyleId:'missing'}]}),/text style reference/);
});

test('project validation rejects invalid styles and label-family mismatches',()=>{
 let project=freshProject(),parcel={id:'parcel',type:'parcel',layer:'boundary',points:[{x:0,y:0},{x:8,y:0},{x:8,y:5},{x:0,y:5}]};
 project.entities=[parcel];
 assert.throws(()=>validateProjectModel({...project,labelStyles:{...project.labelStyles,parcel:[{...project.labelStyles.parcel[0],textHeight:0}]}}),/label style/);
 assert.throws(()=>validateProjectModel({...project,entities:[{...parcel,labelStyleId:project.labelStyles.contour[0].id}]}),/label style reference/);
 assert.throws(()=>validateProjectModel({...project,entities:[{...parcel,labelStyleId:'missing'}]}),/label style reference/);
});

test('contour labels preserve editable text and height overrides in saved projects',()=>{
 let project=freshProject(),style=project.labelStyles.contour[0],label={id:'contour',type:'text',layer:'survey',a:{x:1,y:2},text:'101.25',size:2,contourLabel:true,contourElevation:101.25,labelStyleId:style.id,labelOverrides:{text:true,textHeight:2}};
 project.entities=[label];
 assert.equal(validateProjectModel(project),undefined);
 assert.throws(()=>validateProjectModel({...project,entities:[{...label,labelOverrides:{textHeight:0}}]}),/label overrides/);
 let reopened=migrateProject(JSON.parse(JSON.stringify(project)));
 assert.deepEqual(reopened.entities[0].labelOverrides,label.labelOverrides);
});

test('project validation rejects invalid constraint records and broken coordinate invariants',()=>{
 let project=freshProject();
 project.entities=[{id:'line',type:'line',layer:'drawing',a:{x:0,y:0},b:{x:4,y:0}}];
 project.constraints=[{entityId:'line',type:'horizontal'}];
 assert.equal(validateProjectModel(project),undefined);
 for(let constraints of [
  [{entityId:'line',type:'parallel'}],
  [{entityId:'missing',type:'horizontal'}],
  [{entityId:'line',type:'horizontal',extra:'bad'}]
 ])assert.throws(()=>validateProjectModel({...project,constraints}));
 assert.throws(()=>validateProjectModel({...project,entities:[{...project.entities[0],b:{x:4,y:1}}]}),/not satisfied/);
 assert.throws(()=>validateProjectModel({...project,entities:[{id:'line',type:'point',layer:'drawing',a:{x:0,y:0}}]}),/existing LINE/);
});

test('sheet collection validation requires unique valid page records and a valid active ID',()=>{
 let project=freshProject(),first=project.sheetPages[0];
 project.sheetPages.push({...first,id:'second'});
 assert.equal(validateProjectModel(project),undefined);
 project.sheetPages[1].id=first.id;
 assert.throws(()=>validateProjectModel(project),/sheet page/);
 project.sheetPages=[first];
 assert.throws(()=>validateProjectModel({...project,activeSheetId:'missing'}),/active sheet/);
 assert.throws(()=>validateProjectModel({...project,sheetPages:Array(51).fill(first)}),/sheet collection/);
});

test('project validation rejects invalid units, duplicate IDs and invalid parcels',()=>{
 let project=freshProject();
 assert.throws(()=>validateProjectModel({...project,units:'yards'}),/units or grid/);
 let duplicate={...project,entities:[
  {id:'same',type:'line',layer:'drawing',a:{x:0,y:0},b:{x:1,y:0}},
  {id:'same',type:'line',layer:'drawing',a:{x:0,y:1},b:{x:1,y:1}}
 ]};
 assert.throws(()=>validateProjectModel(duplicate),/object identity/);
 let parcel={...project,entities:[{id:'p',type:'parcel',layer:'boundary',points:[{x:0,y:0},{x:1,y:1},{x:0,y:1},{x:1,y:0}]}]};
 assert.throws(()=>validateProjectModel(parcel),/simple, non-intersecting polygon/);
});

test('project validation accepts generated constrained-surface vertices and rejects dangling faces',()=>{
 let project=freshProject();
 project.entities=[
  {id:'p1',type:'point',layer:'survey',a:{x:0,y:0,z:1}},
  {id:'p2',type:'point',layer:'survey',a:{x:1,y:0,z:2}},
  {id:'boundary',type:'parcel',layer:'boundary',points:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]},
  {id:'hole',type:'parcel',layer:'boundary',points:[{x:.2,y:.2},{x:.3,y:.2},{x:.3,y:.3},{x:.2,y:.3}]},
  {id:'breakline',type:'line',layer:'drawing',a:{x:0,y:0},b:{x:1,y:0}}
 ];
 project.surfaceDefinition={boundary:'boundary',holes:['hole'],breaklines:['breakline']};
 project.surface={vertices:[{id:'generated',x:0,y:1,z:3}],triangles:[['p1','p2','generated']]};
 assert.equal(validateProjectModel(project),undefined);
 assert.throws(()=>validateProjectModel({...project,surface:{...project.surface,triangles:[['p1','p2','missing']]}}),/surface triangles/);
 assert.throws(()=>validateProjectModel({...project,surfaceDefinition:{...project.surfaceDefinition,holes:['boundary']}}),/constraint references/);
});

test('project validation accepts layer styles and object hatches but rejects invalid appearance data',()=>{
 let project=freshProject();
 project.layers[0].lineType='storm-sewer';
 project.layers[0].lineWeight=.7;
 project.layers[0].hatchPattern='brick';
 project.entities=[{id:'hatch',type:'polyline',layer:'drawing',closed:true,hatchPattern:'ansi31',points:[{x:0,y:0},{x:4,y:0},{x:4,y:4},{x:0,y:4}]}];
 assert.equal(validateProjectModel(project),undefined);
 assert.throws(()=>validateProjectModel({...project,layers:project.layers.map((l,i)=>i?l:{...l,lineWeight:9})}),/Invalid layer/);
 assert.throws(()=>validateProjectModel({...project,layers:project.layers.map((l,i)=>i?l:{...l,hatchPattern:'unknown'})}),/Invalid layer/);
 assert.throws(()=>validateProjectModel({...project,entities:[{...project.entities[0],hatchPattern:'unknown'}]}),/hatch pattern/);
 assert.throws(()=>validateProjectModel({...project,entities:[{id:'open',type:'line',layer:'drawing',hatchPattern:'solid',a:{x:0,y:0},b:{x:1,y:0}}]}),/hatch pattern/);
});

test('project validation persists editable paper-space objects on individual sheets',()=>{
 let project=freshProject();
 project.sheet.border='custom';
 project.sheet.paperEntities=[{id:'frame',type:'rect',points:[{x:10,y:10},{x:500,y:300}],color:'#223b49',lineWeight:.35,lineType:'continuous'},{id:'heading',type:'text',at:{x:20,y:25},text:'SITE PLAN',size:5,color:'#223b49',lineWeight:.25,lineType:'continuous'},{id:'location',type:'image',data:'data:image/png;base64,dGVzdA==',at:{x:20,y:40},width:60,height:40,opacity:.8},{id:'schedule',type:'table',at:{x:20,y:90},rows:[['Material','Area'],['Lawn','1.2 ac']],columnWidths:[40,30],rowHeight:8,textSize:2.5,color:'#223b49',lineWeight:.25,lineType:'continuous'},{id:'viewport',type:'viewport',at:{x:100,y:100},width:150,height:90,modelView:{minx:0,miny:0,maxx:100,maxy:60},color:'#223b49',lineWeight:.35,lineType:'continuous'}];
 project.sheetPages[0].settings=JSON.parse(JSON.stringify(project.sheet));
 assert.equal(validateProjectModel(project),undefined);
 assert.throws(()=>validateProjectModel({...project,sheet:{...project.sheet,paperEntities:[{...project.sheet.paperEntities[0],points:[{x:-1,y:0},{x:100,y:100}]}]}}),/paper-space geometry/);
});
test('leaders and generated contour labels validate and persist as model entities',()=>{
 let project=freshProject();
 project.entities=[{id:'leader',type:'leader',layer:'drawing',points:[{x:0,y:0},{x:5,y:5}],note:'Existing utility',size:1},{id:'contour',type:'text',layer:'survey',a:{x:10,y:10},text:'102',size:1,contourLabel:true,contourElevation:102}];
 assert.equal(validateProjectModel(project),undefined);
 assert.throws(()=>validateProjectModel({...project,entities:[{...project.entities[0],points:[{x:0,y:0}]}]}),/leader annotation/);
 assert.throws(()=>validateProjectModel({...project,entities:[{...project.entities[1],contourElevation:Infinity}]}),/contour label/);
});

test('project validation caps paper-space object totals across all sheets',()=>{
 let project=freshProject();
 const makeItems=prefix=>Array.from({length:2000},(_,i)=>({id:`${prefix}-${i}`,type:'text',at:{x:20,y:20},text:'x',size:1,color:'#223b49',lineWeight:.25}));
 project.sheet.paperEntities=makeItems('a');
 project.sheetPages[0].settings=JSON.parse(JSON.stringify(project.sheet));
 for(let index=1;index<3;index++){let settings={...project.sheet,paperEntities:makeItems(`p${index}`)};project.sheetPages.push({id:`sheet-${index}`,name:`C-${100+index}`,settings})}
 assert.throws(()=>validateProjectModel(project),/Too many paper-space objects/);
});

test('project validation bounds aggregate embedded paper-space image data',()=>{
 let project=freshProject(),data=`data:image/png;base64,${'A'.repeat(1000000)}`,images=Array.from({length:13},(_,index)=>({id:`image-${index}`,type:'image',data,at:{x:10,y:10},width:2,height:2}));
 project.sheet.paperEntities=images;
 project.sheetPages[0].settings=JSON.parse(JSON.stringify(project.sheet));
 assert.throws(()=>validateProjectModel(project),/Paper-space images exceed the project size budget/);
});
