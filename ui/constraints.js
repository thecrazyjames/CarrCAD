import {distance,EPS} from './geometry.js';

export const LINE_CONSTRAINT_TYPES=['horizontal','vertical'];

export function constrainLine(line,type){
 if(line?.type!=='line')throw Error('Horizontal and vertical constraints apply to LINE entities only.');
 if(!LINE_CONSTRAINT_TYPES.includes(type))throw Error('Unsupported LINE constraint.');
 let constrained={...line,a:{...line.a},b:{...line.b}};
 if(type==='horizontal')constrained.b.y=constrained.a.y;
 else constrained.b.x=constrained.a.x;
 if(distance(constrained.a,constrained.b)<EPS)throw Error('This constraint would create a zero-length line.');
 return constrained;
}

export function validateConstraints(constraints,entities){
 if(!Array.isArray(constraints)||constraints.length>20000)throw Error('Invalid LINE constraints.');
 let byId=new Map(entities.map(entity=>[entity.id,entity])),seen=new Set;
 for(let constraint of constraints){
  if(!constraint||typeof constraint!=='object'||Array.isArray(constraint)||Object.keys(constraint).length!==2||typeof constraint.entityId!=='string'||!LINE_CONSTRAINT_TYPES.includes(constraint.type)||seen.has(constraint.entityId))throw Error('Invalid LINE constraint record.');
  seen.add(constraint.entityId);
  let line=byId.get(constraint.entityId);
  if(line?.type!=='line')throw Error('A LINE constraint must reference an existing LINE entity; remove the constraint before deleting or changing the line.');
  let aligned=constraint.type==='horizontal'?line.a.y===line.b.y:line.a.x===line.b.x;
  if(!aligned||distance(line.a,line.b)<EPS)throw Error(`The ${constraint.type} LINE constraint is not satisfied.`);
 }
}
