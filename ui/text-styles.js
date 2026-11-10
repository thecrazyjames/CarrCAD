export const TEXT_FONT_FAMILIES=Object.freeze(['sans-serif','serif','monospace']);
const validColor=value=>value==='byLayer'||typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);

export function defaultTextStyles(){
 return [
  {id:'text-general',name:'General',textHeight:2,color:'byLayer',fontFamily:'sans-serif',bold:false,italic:false},
  {id:'text-title',name:'Drawing title',textHeight:4,color:'byLayer',fontFamily:'sans-serif',bold:true,italic:false},
  {id:'text-notes',name:'General notes',textHeight:1.6,color:'byLayer',fontFamily:'sans-serif',bold:false,italic:false},
  {id:'text-dimension',name:'Dimensions and callouts',textHeight:1.5,color:'byLayer',fontFamily:'monospace',bold:false,italic:false}
 ];
}

export function validateTextStyles(styles,activeId){
 if(!Array.isArray(styles)||!styles.length||styles.length>50||typeof activeId!=='string')throw Error('Invalid text style registry.');
 let ids=new Set,names=new Set;
 for(let style of styles){
  if(!style||typeof style.id!=='string'||!style.id||style.id.length>100||ids.has(style.id)||typeof style.name!=='string'||!style.name.trim()||style.name.length>80||names.has(style.name.trim().toLocaleLowerCase())||!Number.isFinite(style.textHeight)||style.textHeight<.1||style.textHeight>100||!validColor(style.color)||!TEXT_FONT_FAMILIES.includes(style.fontFamily)||typeof style.bold!=='boolean'||typeof style.italic!=='boolean'||Object.keys(style).some(key=>!['id','name','textHeight','color','fontFamily','bold','italic'].includes(key)))throw Error('Invalid text style.');
  ids.add(style.id);names.add(style.name.trim().toLocaleLowerCase());
 }
 if(!ids.has(activeId))throw Error('Invalid active text style.');
 return undefined;
}

export function textStyleFor(project,styleId){
 let styles=project.textStyles||defaultTextStyles();
 return styles.find(style=>style.id===styleId)||styles.find(style=>style.id===project.activeTextStyleId)||styles[0]||defaultTextStyles()[0];
}
