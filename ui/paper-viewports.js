const UNIT_MILLIMETERS=Object.freeze({ft:304.8,in:25.4,m:1000,mm:1});
export const SITE_SCALE_PRESETS=Object.freeze([10,20,30,40,50,100,200].map(feet=>Object.freeze({feet,denominator:feet*12,label:`1″ = ${feet}′`})));

function requireViewport(viewport){
 let view=viewport?.modelView;
 if(!viewport||!view||![viewport.width,viewport.height,view.minx,view.miny,view.maxx,view.maxy].every(Number.isFinite)||viewport.width<=0||viewport.height<=0||view.maxx<=view.minx||view.maxy<=view.miny)throw Error('Invalid model viewport.');
 return view;
}

export function viewportScale(viewport,units){
 let view=requireViewport(viewport),millimeters=UNIT_MILLIMETERS[units];
 if(!millimeters)throw Error('Unsupported drawing units for model viewport.');
 if(Number.isFinite(viewport.scale)&&viewport.scale>0)return viewport.scale;
 return millimeters/Math.min(viewport.width/(view.maxx-view.minx),viewport.height/(view.maxy-view.miny));
}

export function viewportBoundsAtScale(width,height,center,scale,units){
 let millimeters=UNIT_MILLIMETERS[units];
 if(!millimeters||![width,height,center?.x,center?.y,scale].every(Number.isFinite)||width<=0||height<=0||scale<=0||scale>1e9)throw Error('Invalid model viewport scale.');
 let worldWidth=width*scale/millimeters,worldHeight=height*scale/millimeters;
 return {minx:center.x-worldWidth/2,miny:center.y-worldHeight/2,maxx:center.x+worldWidth/2,maxy:center.y+worldHeight/2};
}

export function resizeViewportAtScale(viewport,width,height,units){
 let view=requireViewport(viewport),center={x:(view.minx+view.maxx)/2,y:(view.miny+view.maxy)/2},scale=viewportScale(viewport,units);
 return {...viewport,width,height,scale,modelView:viewportBoundsAtScale(width,height,center,scale,units)};
}

export function panViewport(viewport,deltaX,deltaY,units){
 let view=requireViewport(viewport),scale=viewportScale(viewport,units),millimeters=UNIT_MILLIMETERS[units];
 if(!millimeters||![deltaX,deltaY].every(Number.isFinite))throw Error('Invalid model viewport pan.');
 let dx=-deltaX*scale/millimeters,dy=deltaY*scale/millimeters;
 return {...viewport,scale,modelView:{minx:view.minx+dx,miny:view.miny+dy,maxx:view.maxx+dx,maxy:view.maxy+dy}};
}
