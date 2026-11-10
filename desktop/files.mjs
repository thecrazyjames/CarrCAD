import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createPDFHTML,validatePDFRequest} from '../ui/pdf-publishing.js';
export {createPDFHTML,validatePDFRequest};
export const MAX_PROJECT_BYTES=24*1024*1024;
export function validateProjectText(data){if(typeof data!=='string'||Buffer.byteLength(data)>MAX_PROJECT_BYTES)throw Error('Project exceeds the 24 MB limit.');let project;try{project=JSON.parse(data)}catch{throw Error('Project is not valid JSON.')}if(!project||![1,2].includes(project.version)||!Array.isArray(project.entities)||project.entities.length>20000)throw Error('This is not a supported Draft project.');return project}
export function safeName(value,fallback='drawing.draft'){if(typeof value!=='string')return fallback;let name=path.basename(value.replace(/\\/g,'/')).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,140).replace(/[. ]+$/,'');if(!name||/^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(name))return fallback;return name}
export function validExportName(name){let n=safeName(name);if(!/\.(draft|json|csv|dxf|svg|pdf)$/i.test(n))throw Error('Unsupported export extension.');return n}
export async function readLimited(file,limit=MAX_PROJECT_BYTES){let handle=await fs.open(file,'r');try{let stat=await handle.stat();if(!stat.isFile()||stat.size>limit)throw Error('File exceeds the supported size limit.');return await handle.readFile('utf8')}finally{await handle.close()}}
// Write next to the destination so rename stays on the same files.
export async function atomicWrite(file,data){await fs.mkdir(path.dirname(file),{recursive:true});let tmp=file+'.'+randomUUID()+'.tmp';try{await fs.writeFile(tmp,data,{mode:0o600,flag:'wx'});await fs.rename(tmp,file)}catch(e){await fs.rm(tmp,{force:true});throw e}}
export class RecoveryStore{constructor(file){this.file=file;this.queue=Promise.resolve();this.lastError=null}save(record){let body=JSON.stringify(record);if(Buffer.byteLength(body)>MAX_PROJECT_BYTES+20000)return Promise.reject(Error('Recovery file too large.'));let task=this.queue.catch(()=>{}).then(()=>atomicWrite(this.file,body));this.queue=task;return task}async read(){try{let data=JSON.parse(await readLimited(this.file,MAX_PROJECT_BYTES+20000));if(data.version!==1||typeof data.data!=='string')return null;validateProjectText(data.data);return data}catch(e){if(e.code==='ENOENT')return null;throw e}}async flush(){await this.queue}}
// Custom scheme origins vary by runtime; require exact scheme/host/path rather than URL.origin.
export function allowedSenderURL(raw){try{let u=new URL(raw);return u.protocol==='draft:'&&u.hostname==='app'&&u.pathname==='/index.html'&&!u.username&&!u.password&&!u.search}catch{return false}}
export async function assertPDFPageCount(buffer,expected){
 const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
 let task=getDocument({data:new Uint8Array(buffer),isEvalSupported:false,useWorkerFetch:false}),document;
 try{document=await task.promise;if(document.numPages!==expected)throw Error(`PDF output contains ${document.numPages} pages; expected ${expected}.`)}
 finally{await task.destroy()}
}
