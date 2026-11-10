import {BLOCK_PRIMITIVE_TYPES} from './blocks.js';
import {labelFamilyForEntity} from './label-styles.js';

const CLOSED_BOUNDARY_TYPES=new Set(['parcel','polyline']);
const OPEN_ALIGNMENT_TYPES=new Set(['line','polyline','alignment']);

export function selectionPanelsForSelection(entities,activeTab='draft'){
 const panels=new Set();
 if(['parcels','survey','alignment'].includes(activeTab))panels.add(activeTab);
 const single=entities.length===1?entities[0]:null;
 if(single&&(single.type==='rect'||single.type==='parcel'||single.type==='polyline'&&single.closed))panels.add('parcels');
 if(entities.some(entity=>CLOSED_BOUNDARY_TYPES.has(entity.type)&&(entity.closed||entity.type==='parcel')||entity.type==='line'||entity.type==='polyline'&&!entity.closed))panels.add('survey');
 if(single&&OPEN_ALIGNMENT_TYPES.has(single.type)&&!single.closed)panels.add('alignment');
 if(entities.some(entity=>entity.type==='text'))panels.add('textStyles');
 if(entities.some(entity=>labelFamilyForEntity(entity)))panels.add('labelStyles');
 if(entities.length&&(entities.some(entity=>entity.type==='block')||entities.every(entity=>BLOCK_PRIMITIVE_TYPES.includes(entity.type))))panels.add('blockTools');
 return panels;
}
