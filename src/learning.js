const clean=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function conciseCue(q){
 const custom={'book-CPC-2':'Judgment = reasons; decree = rights decided.','book-CPC-3':'Decree = decision on rights.','book-CPC-4':'Judgment explains; decree determines rights.','book-CPC-9':'Judgment = the judge’s reasons.'};
 const cue=custom[q.id]||q.cue||'',c=clean(cue),e=clean(q.explanation);
 if(!c||c===e||e.includes(c))return '';
 const cw=new Set(c.split(' ')),ew=new Set(e.split(' '));
 const overlap=[...cw].filter(w=>ew.has(w)).length/Math.max(cw.size,ew.size);
 return overlap>.8?'':cue;
}
export function rewardXP({correct,guessed,eligible,bonus}){
 const base=correct?(guessed?4:eligible?10:3):2;
 return correct&&!guessed&&eligible&&bonus?base*2:base;
}
export function consecutiveDays(days,today){
 const dates=Object.keys(days).filter(k=>days[k].attempts>0).sort().reverse();
 const shift=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
 let cursor=dates.includes(today)?today:shift(today,-1),count=0;
 while(dates.includes(cursor)){count++;cursor=shift(cursor,-1)}return count;
}
