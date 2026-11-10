import {distance} from './geometry.js';

export function createContourLabels(segments,interval,every=5,precision=0){
 if(!Array.isArray(segments)||!Number.isFinite(interval)||interval<=0||!Number.isInteger(every)||every<1||every>50||!Number.isInteger(precision)||precision<0||precision>6)throw Error('Contour label settings are invalid.');
 let longestByLevel=new Map;
 for(let segment of segments){
  if(!segment||![segment.z,segment.a?.x,segment.a?.y,segment.b?.x,segment.b?.y].every(Number.isFinite))throw Error('Contour segments contain invalid coordinates.');
  let length=distance(segment.a,segment.b);
  if(length>(longestByLevel.get(segment.z)?.length??0))longestByLevel.set(segment.z,{segment,length});
 }
 return [...longestByLevel.entries()].filter(([z])=>Math.abs(z/interval-Math.round(z/interval))<1e-6&&Math.round(z/interval)%every===0).sort(([a],[b])=>a-b).map(([z,{segment}])=>({elevation:z,text:z.toFixed(precision),at:{x:(segment.a.x+segment.b.x)/2,y:(segment.a.y+segment.b.y)/2}}));
}
