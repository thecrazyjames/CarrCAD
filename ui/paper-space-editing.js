export function updatePaperSelection(current,id,{additive=false}={}){
 let next=new Set(current);
 if(additive){if(next.has(id))next.delete(id);else next.add(id)}
 else if(!next.has(id))next=new Set([id]);
 return next;
}

export function paperItemBounds(item){
 if(item.type==='text')return [item.at];
 if(item.type==='image'||item.type==='viewport')return [item.at,{x:item.at.x+item.width,y:item.at.y+item.height}];
 if(item.type==='table')return [item.at,{x:item.at.x+item.columnWidths.reduce((sum,width)=>sum+width,0),y:item.at.y+item.rows.length*item.rowHeight}];
 return item.points;
}

export function paperSnapGeometry(items,excludedIds=[]){
 let excluded=new Set(excludedIds);
 return items.filter(item=>!excluded.has(item.id)).flatMap(item=>{
  if(item.type==='text')return [{type:'point',a:item.at}];
  if(item.type==='line'&&item.points?.length>=2)return [{type:'line',a:item.points[0],b:item.points[1]}];
  if(item.type==='rect'&&item.points?.length>=2)return [{type:'rect',a:item.points[0],b:item.points[1]}];
  if(['image','viewport','table'].includes(item.type)){
   let bounds=paperItemBounds(item);
   return [{type:'rect',a:bounds[0],b:bounds[1]}];
  }
  if(item.points?.length===1)return [{type:'point',a:item.points[0]}];
  if(item.points?.length>=2)return [{type:'polyline',points:item.points,closed:!!item.closed}];
  return [];
 });
}

export function constrainPaperDelta(items,dx,dy,{w,h}){
 let points=items.flatMap(paperItemBounds);
 if(!points.length)return {x:0,y:0};
 let minX=Math.min(...points.map(point=>point.x)),maxX=Math.max(...points.map(point=>point.x));
 let minY=Math.min(...points.map(point=>point.y)),maxY=Math.max(...points.map(point=>point.y));
 return {x:Math.max(-minX,Math.min(dx,w-maxX)),y:Math.max(-minY,Math.min(dy,h-maxY))};
}

export function translatePaperItem(item,dx,dy){
 let next=JSON.parse(JSON.stringify(item));
 if(next.points)next.points=next.points.map(point=>({x:point.x+dx,y:point.y+dy}));
 else{next.at.x+=dx;next.at.y+=dy}
 return next;
}

export function copyPaperItems(items,dx,dy,createId){
 return items.map((item,index)=>({...translatePaperItem(item,dx,dy),id:createId(index)}));
}

export function deletePaperItems(items,ids){
 let removed=new Set(ids);
 return items.filter(item=>!removed.has(item.id));
}
