const byteLength=value=>new TextEncoder().encode(value).byteLength;
function validatePDFPage(page){
 if(!page||typeof page.svg!=='string'||byteLength(page.svg)>8*1024*1024||!Number.isFinite(page.width)||!Number.isFinite(page.height)||page.width<100||page.width>1500||page.height<100||page.height>1500)throw Error('Invalid sheet for PDF export.');
 if(!/^<svg\s/i.test(page.svg)||/<\s*(script|foreignObject|iframe|object|embed|link)\b/i.test(page.svg)||/\bon\w+\s*=/i.test(page.svg)||/\b(?:href|src)\s*=\s*["']\s*(?!data:image\/(?:png|jpeg|webp);base64,)[^"']/i.test(page.svg))throw Error('Sheet contains unsupported active or external content.');
}
export function validatePDFRequest(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Invalid sheet for PDF export.');
 if(Array.isArray(payload.pages)){
  if(payload.svg!==undefined||!payload.pages.length||payload.pages.length>50)throw Error('A multi-page PDF must contain 1 to 50 sheets.');
  let total=0,{width,height}=payload.pages[0];
  for(let page of payload.pages){validatePDFPage(page);total+=byteLength(page.svg);if(page.width!==width||page.height!==height)throw Error('A multi-page PDF must use one paper size. Export mixed-size sheets separately.')}
  if(total>24*1024*1024)throw Error('Multi-page PDF source exceeds the 24 MB limit.');
 }else validatePDFPage(payload);
 return payload;
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
export function createPDFHTML(payload){
 validatePDFRequest(payload);
 let pages=payload.pages||[payload],{width,height}=pages[0],title=escapeHTML(payload.name||'site-plan.pdf');
 return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:${width}mm ${height}mm;margin:0}html,body{margin:0;padding:0;width:${width}mm}.page{box-sizing:border-box;width:${width}mm;height:${height}mm;margin:0;padding:0;overflow:hidden;break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}.page svg{display:block;width:${width}mm;height:${height}mm}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${pages.map((page,index)=>`<section class="page" data-page="${index+1}">${page.svg}</section>`).join('')}</body></html>`;
}
