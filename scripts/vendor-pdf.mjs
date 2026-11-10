import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),src=path.join(root,'node_modules/pdfjs-dist'),dest=path.join(root,'ui/pdfjs');
await fs.mkdir(dest,{recursive:true});for(let file of ['pdf.mjs','pdf.worker.mjs'])await fs.copyFile(path.join(src,'build',file),path.join(dest,file));for(let dir of ['standard_fonts','cmaps'])await fs.cp(path.join(src,dir),path.join(dest,dir),{recursive:true});await fs.copyFile(path.join(src,'LICENSE'),path.join(dest,'LICENSE'));console.log('Bundled local PDF.js renderer, worker, fonts, CMaps and license.');
