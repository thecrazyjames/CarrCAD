export const LABEL_FAMILIES=['parcel','contour','alignment'];
const colorValue=value=>value==='byLayer'||typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);

export function defaultLabelStyles(){
 return {
  parcel:[{id:'parcel-standard',name:'Parcel Standard',family:'parcel',textHeight:1.8,color:'byLayer',areaPrecision:2,alternateAreaPrecision:3,distancePrecision:2,areaFormat:'auto'}],
  contour:[{id:'contour-standard',name:'Contour Standard',family:'contour',textHeight:1.5,color:'byLayer',elevationPrecision:0}],
  alignment:[{id:'alignment-standard',name:'Alignment Standard',family:'alignment',textHeight:1.5,color:'byLayer',stationPrecision:2,stationFormat:'station',distancePrecision:2,elevationPrecision:2}]
 };
}

export function defaultActiveLabelStyles(styles=defaultLabelStyles()){
 return Object.fromEntries(LABEL_FAMILIES.map(family=>[family,styles[family][0].id]));
}

export function validateLabelStyles(styles,active){
 if(!styles||typeof styles!=='object'||Array.isArray(styles)||!active||typeof active!=='object'||Array.isArray(active))throw Error('Invalid label style registry.');
 const expected=['parcel','contour','alignment'];
 if(Object.keys(styles).length!==expected.length||Object.keys(active).length!==expected.length||expected.some(family=>!Array.isArray(styles[family])||!styles[family].length||styles[family].length>50))throw Error('Invalid label style families.');
 let ids=new Set;
 for(let family of expected){
  if(typeof active[family]!=='string'||!styles[family].some(style=>style.id===active[family]))throw Error('Invalid active label style.');
  let names=new Set;
  for(let style of styles[family]){
   if(!style||style.family!==family||typeof style.id!=='string'||!style.id||style.id.length>100||ids.has(style.id)||typeof style.name!=='string'||!style.name.trim()||style.name.length>80||names.has(style.name.trim().toLocaleLowerCase())||!Number.isFinite(style.textHeight)||style.textHeight<=0||style.textHeight>100||!colorValue(style.color))throw Error('Invalid label style.');
   ids.add(style.id);names.add(style.name.trim().toLocaleLowerCase());
   const precision=(key)=>Number.isInteger(style[key])&&style[key]>=0&&style[key]<=6;
   if(family==='parcel'&&(!precision('areaPrecision')||!precision('alternateAreaPrecision')||!precision('distancePrecision')||!['auto','drawing-units','acres-hectares'].includes(style.areaFormat)))throw Error('Invalid parcel label style formatting.');
   if(family==='contour'&&!precision('elevationPrecision'))throw Error('Invalid contour label style formatting.');
   if(family==='alignment'&&(!precision('stationPrecision')||!precision('distancePrecision')||!precision('elevationPrecision')||!['station','decimal'].includes(style.stationFormat)))throw Error('Invalid alignment label style formatting.');
   let allowed=new Set(['id','name','family','textHeight','color',...(family==='parcel'?['areaPrecision','alternateAreaPrecision','distancePrecision','areaFormat']:family==='contour'?['elevationPrecision']:['stationPrecision','stationFormat','distancePrecision','elevationPrecision'])]);
   if(Object.keys(style).some(key=>!allowed.has(key)))throw Error('Invalid label style properties.');
  }
 }
 return undefined;
}

export function labelFamilyForEntity(entity){
 if(entity?.type==='parcel')return 'parcel';
 if(entity?.type==='alignment')return 'alignment';
 if(entity?.type==='text'&&entity.contourLabel===true)return 'contour';
 return null;
}

export function labelStyleFor(project,family,styleId){
 let styles=project.labelStyles?.[family]||[],id=styleId||project.activeLabelStyles?.[family];
 return styles.find(style=>style.id===id)||styles[0]||defaultLabelStyles()[family][0];
}

export function applyLabelStyle(entity,style){
 let family=labelFamilyForEntity(entity);
 if(!family||style?.family!==family)throw Error('Choose a matching civil label and style.');
 entity.labelStyleId=style.id;
 if(family==='contour'){
  delete entity.labelOverrides;
  entity.text=Number(entity.contourElevation).toFixed(style.elevationPrecision);
  entity.size=style.textHeight;
 }
 return entity;
}

export function formatAreaLabel(area,units,style){
 const factor={ft:1/43560,in:1/6272640,m:1/10000,mm:1/1e10}[units];
 if(!Number.isFinite(area)||!factor)throw Error('Invalid parcel area units.');
 const unitName=['ft','in'].includes(units)?'ac':'ha';
 const squareUnits=`${units}²`;
 if(style.areaFormat==='drawing-units')return `${formatLabelNumber(area,style.areaPrecision)} ${squareUnits}`;
 if(style.areaFormat==='acres-hectares')return `${formatLabelNumber(area*factor,style.alternateAreaPrecision)} ${unitName}`;
 return `${formatLabelNumber(area,style.areaPrecision)} ${squareUnits} · ${formatLabelNumber(area*factor,style.alternateAreaPrecision)} ${unitName}`;
}

export function formatStation(value,style){
 if(!Number.isFinite(value))throw Error('Station must be finite.');
 if(style.stationFormat==='decimal')return formatLabelNumber(value,style.stationPrecision);
 const sign=value<0?'-':'',absolute=Math.abs(value),major=Math.floor(absolute/100),minor=(absolute%100).toFixed(style.stationPrecision);
 return `${sign}${major}+${minor.padStart(style.stationPrecision===0?2:style.stationPrecision+3,'0')}`;
}

export function labelStyleColor(style,layerColor){
 return style.color==='byLayer'?layerColor:style.color;
}

export function formatLabelNumber(value,precision=2){
 if(!Number.isFinite(value)||!Number.isInteger(precision)||precision<0||precision>6)throw Error('Invalid label number format.');
 return value.toLocaleString('en-US',{minimumFractionDigits:precision,maximumFractionDigits:precision});
}
