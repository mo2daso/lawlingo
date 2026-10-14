export const KEY = 'lawlingo-progress-v2';
export const fresh = () => ({version:2,events:[],active:null,owner:null,settings:{sound:false,largeText:false,reduceMotion:false,dailyGoal:150}});
export function validEvent(e){return e&&typeof e.id==='string'&&/^[\da-f]{8}-[\da-f-]{27}$/i.test(e.id)&&['answer','lesson','import','mock','bookmark'].includes(e.kind)&&Number.isFinite(Date.parse(e.occurred_at))&&e.payload&&typeof e.payload==='object'}
export function validate(s){return s?.version===2&&Array.isArray(s.events)&&s.events.length<200000&&s.events.every(validEvent)}
export function validActive(a,hasQuestion){return a&&Array.isArray(a.ids)&&a.ids.length>0&&a.ids.length<2000&&a.ids.every(hasQuestion)&&Number.isInteger(a.index)&&a.index>=0&&a.index<a.ids.length&&['practice','lesson','mock','sample'].includes(a.mode)&&['intro','question','feedback'].includes(a.phase)&&Array.isArray(a.answers)&&Array.isArray(a.repair)&&Array.isArray(a.repaired)&&a.choices&&typeof a.choices==='object'}
export function merge(a,b){const all=new Map(a.map(e=>[e.id,e]));for(const e of b)if(validEvent(e)&&!all.has(e.id))all.set(e.id,e);return [...all.values()].sort((x,y)=>x.occurred_at.localeCompare(y.occurred_at)||x.id.localeCompare(y.id))}
export function uuid(){if(globalThis.crypto?.randomUUID)return crypto.randomUUID();return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(+c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>+c/4).toString(16))}
export function event(kind,payload){return {id:uuid(),kind,payload,occurred_at:new Date().toISOString()}}
const dayFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi',year:'numeric',month:'2-digit',day:'2-digit'});
export const dayKey=(date=Date.now())=>dayFormatter.format(new Date(date));
export function derive(events){
 const r={xp:0,stats:{},lessons:new Set(),mocks:[],bookmarks:new Set(),days:{},legacy:null,answers:0};
 const imports=events.filter(e=>e.kind==='import');
 // A v1 import is a baseline, never added twice when backups are re-imported.
 if(imports.length){const e=imports.reduce((a,b)=>(a.payload.seq||0)>(b.payload.seq||0)?a:b),p=e.payload;r.legacy=p;r.xp=Number(p.xp)||0;r.answers=Number(p.seq)||0;for(const [day,d]of Object.entries(p.days||{}))r.days[day]={attempts:Number(d.attempts)||0,correct:Number(d.correct)||0,xp:Number(d.xp)||0};
  for(const [id,v]of Object.entries(p.stats||{}))r.stats[id]={seen:v.attempts||Number(v.seen)||0,correct:v.correct||0,wrong:v.wrong||Math.max(0,(v.attempts||0)-(v.correct||0)),level:v.level||0,due:v.due||0,last:v.last||0,weak:!!v.lastWrong};
 }
 for(const e of [...events].sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at)||a.id.localeCompare(b.id))){const p=e.payload,t=Date.parse(e.occurred_at),day=dayKey(t);if(e.kind==='answer'){
  if(typeof p.qid!=='string'||typeof p.correct!=='boolean')continue;
  const s=r.stats[p.qid]||(r.stats[p.qid]={seen:0,correct:0,wrong:0,level:0,due:0,last:0});
  s.seen++;if(p.ungraded)continue;r.answers++;s.correct+=p.correct?1:0;s.wrong+=p.correct?0:1;
  const eligible=!s.last||t>=s.due;
  if(!p.correct||p.guessed){s.level=0;s.due=t+120000;s.weak=true}
  else if(!s.last||t>=s.due){s.level=Math.min(4,s.level+1);s.due=t+[0,900000,28800000,86400000,172800000][s.level];if(s.level>=2)s.weak=false}
  s.last=t;s.lastCorrect=p.correct;s.lastChoice=p.choice;s.guessed=!!p.guessed;
  const xp=Number.isInteger(p.xp)&&p.xp>=0&&p.xp<=20?p.xp:(p.correct?(p.guessed?4:10):2);r.xp+=xp;
  const d=r.days[day]||(r.days[day]={attempts:0,correct:0,xp:0});d.attempts++;d.correct+=p.correct?1:0;d.xp+=xp;
 }else if(e.kind==='lesson'&&typeof p.id==='string'){if(!r.lessons.has(p.id)){r.lessons.add(p.id);r.xp+=25}}
 else if(e.kind==='mock')r.mocks.push({...p,id:e.id,at:e.occurred_at});
 else if(e.kind==='bookmark'){if(p.on)r.bookmarks.add(p.qid);else r.bookmarks.delete(p.qid)} }
 return r;
}
export function legacyValid(p){return p?.version===1&&Number.isFinite(p.xp)&&p.xp>=0&&p.xp<1e9&&p.stats&&typeof p.stats==='object'&&Array.isArray(p.lessons)}
