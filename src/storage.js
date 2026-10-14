import {KEY,fresh,validate,merge} from './progress.js';
export const RECOVERY_KEY=KEY+'-recovery';
function parse(raw){try{const value=JSON.parse(raw);return validate(value)?value:null}catch{return null}}
export function loadProgress(storage){
 try{
  const primary=parse(storage.getItem(KEY));if(primary)return {state:primary,recovered:false};
  const backup=parse(storage.getItem(RECOVERY_KEY));if(backup)return {state:backup,recovered:true};
 }catch{}
 return {state:fresh(),recovered:false};
}
export function persistProgress(storage,state){
 try{
  const other=parse(storage.getItem(KEY));
  if(other&&other.owner===state.owner){const ids=new Set(state.events.map(e=>e.id));if(other.events.some(e=>!ids.has(e.id)))state.events=merge(state.events,other.events)}
  state.savedAt=new Date().toISOString();
  const serialized=JSON.stringify(state);storage.setItem(KEY,serialized);
  // A failed recovery-copy write must not misreport a successful primary save.
  try{storage.setItem(RECOVERY_KEY,serialized)}catch{}
  return true;
 }catch{return false}
}
