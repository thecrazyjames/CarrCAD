import {renderSheet} from './sheets.js';

export function renderSheetSetPages(model,options={}){
 let pages=model.sheetPages?.length?model.sheetPages:[{id:model.activeSheetId||'sheet-1',settings:model.sheet}];
 if(!pages.length||pages.length>50)throw Error('A sheet set must contain 1 to 50 sheets.');
 return pages.map((page,index)=>{
  if(!page?.settings)throw Error(`Sheet ${index+1} has no saved settings.`);
  let rendered=renderSheet(model,page.settings,options);
  return {id:page.id||`sheet-${index+1}`,name:page.settings.sheetNo||page.name||`Sheet ${index+1}`,svg:rendered.svg,width:rendered.paper.w,height:rendered.paper.h};
 });
}

export function requireUniformPDFPages(pages){
 if(!Array.isArray(pages)||!pages.length||pages.length>50)throw Error('A PDF publish requires 1 to 50 rendered sheets.');
 let {width,height}=pages[0];
 if(pages.some(page=>page.width!==width||page.height!==height))throw Error('Mixed paper sizes cannot be combined safely in one PDF yet. Export sheets separately to preserve each sheet size.');
 return pages;
}
