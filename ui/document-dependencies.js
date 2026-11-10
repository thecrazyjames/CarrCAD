function pointGeometry(model){
 return JSON.stringify(model.entities.filter(e=>e.type==='point').map(e=>[e.id,e.a.x,e.a.y,e.a.z??0]).sort((a,b)=>a[0].localeCompare(b[0])));
}

function constraintGeometry(model){
 let definition=model.surfaceDefinition;
 if(!definition)return null;
 return [definition.boundary,...definition.holes,...definition.breaklines].map(id=>{
  let e=model.entities.find(entity=>entity.id===id);
  return [id,e?.type,e?.closed??false,e?.type==='line'?[e.a,e.b]:e?.points??null];
 });
}

function contourInputs(model){
 return JSON.stringify({points:pointGeometry(model),triangles:model.surface?.triangles??null,vertices:model.surface?.vertices??null,interval:model.surface?Number(model.surface.interval)||2:null});
}

function profileInputs(model,alignmentId){
 let alignment=model.entities.find(e=>e.id===alignmentId&&e.type==='alignment');
 return JSON.stringify({
  points:pointGeometry(model),
  triangles:model.surface?.triangles??null,
  vertices:model.surface?.vertices??null,
  alignment:alignment?[alignment.id,alignment.station||0,alignment.points]:null,
  units:model.units
 });
}

export function invalidateDerivedData(previous,current,profileAlignmentId=null,{surfaceRebuilt=false}={}){
 let pointsChanged=pointGeometry(previous)!==pointGeometry(current);
 let constraintsChanged=JSON.stringify(constraintGeometry(previous))!==JSON.stringify(constraintGeometry(current));
 let surfaceInvalidated=(pointsChanged||constraintsChanged)&&!surfaceRebuilt;
 if(surfaceInvalidated)current.surface=null;
 let contoursChanged=contourInputs(previous)!==contourInputs(current);
 let profileChanged=profileAlignmentId!==null&&profileInputs(previous,profileAlignmentId)!==profileInputs(current,profileAlignmentId);
 return {surfaceInvalidated,contoursInvalidated:surfaceInvalidated||contoursChanged,profileInvalidated:surfaceInvalidated||profileChanged};
}
