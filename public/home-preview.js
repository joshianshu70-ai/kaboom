import {saved,render} from './layers.js?v=e2860a3ff05a407d';
const canvas=document.getElementById('homeAgentPreview'),status=document.getElementById('homePreviewStatus');
async function draw(){try{await render(canvas,saved());status.textContent='Saved preview · explore or edit it in the agent studio.';}catch(e){status.textContent='Artwork preview unavailable: '+e.message;}}
draw();window.addEventListener('pageshow',draw);window.addEventListener('storage',e=>{if(e.key==='x84-preview')draw();});
