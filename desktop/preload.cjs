'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const commands=new Set(['new','open','import','select-all','save','save-as','templates','sheet','export','undo','redo','fit','guide','save-before-close']);
contextBridge.exposeInMainWorld('draftDesktop',Object.freeze({
 version:'0.5.0',
 restore:()=>ipcRenderer.invoke('desktop:restore'),
 autosave:(data,dirty=true)=>ipcRenderer.invoke('desktop:autosave',{data,dirty}),
 confirmReplace:()=>ipcRenderer.invoke('desktop:confirm-replace'),
 openProject:()=>ipcRenderer.invoke('desktop:open-project'),
 acknowledgeOpen:token=>ipcRenderer.invoke('desktop:ack-open',{token}),
 newDocument:()=>ipcRenderer.invoke('desktop:new-document'),
 saveProject:(data,saveAs=false)=>ipcRenderer.invoke('desktop:save-project',{data,saveAs}),
 exportFile:(data,name)=>ipcRenderer.invoke('desktop:export',{data,name}),
 geometry:(operation,payload)=>ipcRenderer.invoke('desktop:geometry',{operation,payload}),
 exportPDF:payload=>ipcRenderer.invoke('desktop:export-pdf',payload),
 finishClose:()=>ipcRenderer.invoke('desktop:finish-close'),
 onCommand:callback=>{if(typeof callback!=='function')return;let listener=(_event,command)=>{if(commands.has(command))callback(command)};ipcRenderer.on('desktop:command',listener);return ()=>ipcRenderer.removeListener('desktop:command',listener)},
 onNotice:callback=>{if(typeof callback!=='function')return;let listener=(_event,text)=>{if(typeof text==='string')callback(text)};ipcRenderer.on('desktop:notice',listener);return ()=>ipcRenderer.removeListener('desktop:notice',listener)}
}));
