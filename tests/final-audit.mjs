// Automated logic checks requested by the user. No real browser/profile data used.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {build} from 'esbuild';
import {KEY,fresh,event,derive,validActive,merge} from '../src/progress.js';
import {loadProgress,persistProgress,RECOVERY_KEY} from '../src/storage.js';
import {conciseCue,rewardXP,consecutiveDays} from '../src/learning.js';
const results=[];
check('Duplicate and near-duplicate memory cues are suppressed',()=>{assert.equal(conciseCue({explanation:'A decree conclusively determines rights.',cue:'A decree conclusively determines rights.'}),'');assert.equal(conciseCue({explanation:'A judgment gives reasons.',cue:'Judgment = why; decree = result.'}),'Judgment = why; decree = result.')});
check('Bonus doubles eligible recall, never guessing or immediate repeat',()=>{assert.equal(rewardXP({correct:true,eligible:true,bonus:true}),20);assert.equal(rewardXP({correct:true,eligible:false,bonus:true}),3);assert.equal(rewardXP({correct:true,guessed:true,eligible:true,bonus:true}),4);assert.equal(rewardXP({correct:false,bonus:true}),2)});
check('Study streak counts consecutive dates and survives today before studying',()=>{const days={'2026-10-13':{attempts:3},'2026-10-12':{attempts:4},'2026-10-10':{attempts:8}};assert.equal(consecutiveDays(days,'2026-10-14'),2);assert.equal(consecutiveDays(days,'2026-10-15'),0)});
check('Double XP persists in event-derived progress',()=>assert.equal(derive([event('answer',{qid:'bonus-test',correct:true,xp:20})]).xp,20));
function check(name,fn){fn();results.push(name)}
function store(){const data=new Map();return {data,getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))}}
const mem=store(),state=fresh();
state.events.push(event('answer',{qid:'book-CPC-1',choice:0,correct:false,xp:2}));
state.active={ids:['book-CPC-1'],title:'Test',mode:'lesson',lessonId:'unit-CPC-1',index:0,phase:'feedback',choices:{},answers:[],repair:['book-CPC-1'],repaired:[],choice:0};
check('Saved events, current question, selected option and repair queue survive reload',()=>{assert(persistProgress(mem,state));assert.deepEqual(loadProgress(mem).state.active,state.active);assert.equal(loadProgress(mem).state.events.length,1)});
check('Corrupted primary save recovers from second copy',()=>{mem.setItem(KEY,'broken');assert(loadProgress(mem).recovered);assert.equal(loadProgress(mem).state.events.length,1);assert(persistProgress(mem,state))});
check('Storage failure is reported; in-memory answers are retained',()=>{const blocked={getItem:()=>null,setItem:()=>{throw Error('Quota')}};assert.equal(persistProgress(blocked,state),false);assert.equal(state.events.length,1)});
check('Recovery-copy quota failure does not misreport primary save',()=>{const partial={getItem:()=>null,setItem:(k,v)=>{if(k===RECOVERY_KEY)throw Error('Quota')}};assert(persistProgress(partial,state))});
check('Duplicate backup import cannot duplicate events',()=>assert.equal(merge(state.events,state.events).length,1));
check('Answers from another tab are merged',()=>{const second=fresh();second.events.push(event('answer',{qid:'book-CPC-2',correct:true}));persistProgress(mem,second);assert.equal(loadProgress(mem).state.events.length,2)});
check('Saved active state accepts correct shape and rejects invalid index',()=>{assert(validActive(state.active,()=>true));assert(!validActive({...state.active,index:10},()=>true))});
check('Miss and guess both schedule repair; immediate repeat does not create spaced mastery',()=>{const t=Date.now(),events=[event('answer',{qid:'x',correct:false}),event('answer',{qid:'x',correct:true})];events[0].occurred_at=new Date(t).toISOString();events[1].occurred_at=new Date(t+1000).toISOString();const stats=derive(events).stats.x;assert(stats.weak);assert.equal(stats.level,0)});
const bankContext={window:{}};vm.runInNewContext(fs.readFileSync('dist/bank.js','utf8'),bankContext);const bank=bankContext.window.LAWLINGO_BANK;
const source=fs.readFileSync('src/app.js','utf8')+`\nglobalThis.auditAPI={begin,check,advance,save,session,submitMock,updateTimer,navigate,importProgress,subjectGuide,startBonus,petLegalu,get active(){return active},get state(){return state},get progress(){return P},get summary(){return summary},get q(){return qAt()},get html(){return main.innerHTML},setPhase(p){active.phase=p},select(c){active.choice=c},chooseMock(id,c){active.choices[id]=c}};`;
const compiled=await build({stdin:{contents:source,resolveDir:process.cwd()+'/src',sourcefile:'audit-entry.js'},bundle:true,write:false,format:'iife',platform:'browser',target:'es2020'});
function app(storage){
 const nodes=new Map(),node=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},focus(){},querySelector(){return null},querySelectorAll(){return []},append(){},setAttribute(){},scrollIntoView(){},remove(){}});
 const context={console,Date,Intl,Math,JSON,Map,Set,URL,Blob,crypto:webcrypto,localStorage:storage,location:{protocol:'file:',hash:''},history:{pushState(){throw Error('file navigation attempted')}},matchMedia:()=>({matches:true}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},body:node(),addEventListener(){},querySelector:()=>null,createElement:node},addEventListener(){},scrollTo(){},LAWLINGO_BANK:bank};
 context.window=context;vm.createContext(context);vm.runInContext(compiled.outputFiles[0].text,context);return context.auditAPI;
}
const isolated=store();let a=app(isolated);
await a.begin(bank.lessons[0].questions,'Lesson','lesson',bank.lessons[0].id);
check('All lesson notes render without runtime error',()=>assert(a.html.includes('Recall before choosing')));
a.setPhase('question');a.select(a.q.answer);a.save();a=app(isolated);
check('App restart resumes same lesson and unsubmitted selection',()=>{assert.equal(a.active.lessonId,bank.lessons[0].id);assert.equal(a.active.choice,a.q.answer)});
a.check();const count=a.state.events.length;a.check();
check('Checking an answer twice cannot award duplicate XP',()=>assert.equal(a.state.events.length,count));
a=app(isolated);check('Feedback state survives app restart',()=>assert.equal(a.active.phase,'feedback'));
a.advance();check('Continue advances and saves next question',()=>assert.equal(loadProgress(isolated).state.active.index,1));
for(const page of ['home','subjects','review','mock','sources','progress','library','guide']){a.navigate(page);check(`Render function: ${page}`,()=>assert(a.html.length>100))}
const mockStorage=store();let m=app(mockStorage);await m.begin(bank.papers[0].ids,'Audit mock','mock',null,120);const first=m.active.ids[0];m.chooseMock(first,bank.questions.find(q=>q.id===first).answer);m.save();m=app(mockStorage);
check('Mock answer and deadline survive restart',()=>{assert.equal(Object.keys(m.active.choices).length,1);assert(m.active.deadline>Date.now())});
await m.submitMock(true);await m.submitMock(true);
check('Submit is idempotent and scores answered/unanswered correctly',()=>{assert.equal(m.progress.mocks.length,1);assert.equal(m.summary.score,1);assert.equal(m.summary.total,100)});
check('All 99 unanswered mock questions enter the repair queue',()=>assert.equal(Object.values(m.progress.stats).filter(s=>s.weak).length,99));
check('Submitted mock survives app restart',()=>assert.equal(app(mockStorage).progress.mocks.length,1));
check('Mock result separates first-seen questions from previous practice',()=>assert.equal(m.summary.items.filter(i=>i.priorSeen===false).length,100));
const legacy={version:1,xp:565,seq:50,stats:{},lessons:['lesson-1','lesson-2','lesson-3','lesson-4','lesson-5'],days:{}}; // Synthetic fixture; never publish private backups.
const imported=app(store());await imported.importProgress({size:10000,text:async()=>JSON.stringify(legacy)});await imported.importProgress({size:10000,text:async()=>JSON.stringify(legacy)});
check('Legacy-format backup import retains XP and five lessons without duplication',()=>{assert.equal(imported.progress.xp,legacy.xp);assert.equal(imported.progress.legacy.lessons.length,5);assert.equal(imported.state.events.filter(e=>e.kind==='import').length,1)});
const v2=app(store());const payload=JSON.stringify(loadProgress(mockStorage).state);await v2.importProgress({size:payload.length,text:async()=>payload});await v2.importProgress({size:payload.length,text:async()=>payload});
check('Version 2 backup restores mock history and mistakes without duplication',()=>{assert.equal(v2.progress.mocks.length,1);assert.equal(v2.state.events.length,loadProgress(mockStorage).state.events.length)});
const sample=app(store());await sample.begin(['sample-1'],'Sample','mock',null,60);await sample.submitMock(true);
check('Official sample result includes original question image',()=>assert(sample.html.includes('sample-questions/01.png')));
check('Every book/source image exists',()=>{for(const q of bank.questions.filter(q=>q.sourceType==='book'))assert(fs.existsSync(`dist/book-pages/${String(q.page).padStart(2,'0')}.png`));for(let i=1;i<=50;i++)assert(fs.existsSync(`dist/sample-questions/${String(i).padStart(2,'0')}.png`))});
const bonusStore=store();let bonus=app(bonusStore);await bonus.startBonus();
check('Bonus quest contains three verified syllabus questions',()=>{assert.equal(bonus.active.ids.length,3);assert(bonus.active.bonus);assert(bonus.active.ids.every(id=>bank.questions.find(q=>q.id===id).mockEligible))});
bonus.select(bonus.q.answer);bonus.check();bonus=app(bonusStore);
check('Bonus state and 20 XP survive reload',()=>{assert(bonus.active.bonus);assert.equal(bonus.progress.xp,20)});
bonus.advance();bonus.select(bonus.q.answer);bonus.check();bonus.advance();bonus.select(bonus.q.answer);bonus.check();bonus.advance();await bonus.startBonus();
check('Completed daily bonus cannot be farmed again',()=>{assert.equal(bonus.active,null);assert.equal(bonus.progress.xp,60)});
const tapped=app(store());tapped.petLegalu();check('Mascot tap is saved and awards no free answer XP',()=>{assert.equal(tapped.state.settings.legaluTaps,1);assert.equal(tapped.progress.xp,0)});
const wrong=app(store());await wrong.begin(['book-CPC-1'],'Repair check');wrong.select((wrong.q.answer+1)%4);wrong.check();wrong.advance();
check('Wrong lesson answer is appended to repair round',()=>{assert.equal(wrong.active.ids.length,2);assert.equal(wrong.active.index,1)});
wrong.select(wrong.q.answer);wrong.check();wrong.advance();check('Repair round ends without an endless loop',()=>assert.equal(wrong.active,null));
const expiry=app(store());await expiry.begin(bank.papers[0].ids,'Expiry','mock',null,1);expiry.active.deadline=Date.now()-1000;expiry.updateTimer();
check('Expired mock auto-submits once',()=>{assert.equal(expiry.active,null);assert.equal(expiry.progress.mocks.length,1);expiry.updateTimer();assert.equal(expiry.progress.mocks.length,1)});
check('Every main lesson renders its own question notes',()=>{for(const l of bank.lessons){const saved=fresh();saved.active={ids:l.questions,title:l.title,mode:'lesson',lessonId:l.id,index:0,phase:'intro',choices:{},answers:[],repair:[],repaired:[],choice:null};const storage=store();persistProgress(storage,saved);const loaded=app(storage);loaded.session();assert(loaded.html.includes(l.title))}});
check('Question bank and all mock answers retain valid source metadata',()=>{for(const q of bank.questions.filter(q=>q.sourceType==='book')){assert(q.reference);assert(q.explanation);assert.equal(q.options.length,4);if(q.mockEligible){assert.equal(q.status,'verified');assert(Number.isInteger(q.answer));assert(q.syllabusTopic)}}});
check('No duplicate options or out-of-range answers in scored bank',()=>{for(const q of bank.questions.filter(q=>q.mockEligible||q.sourceType==='foundation')){assert.equal(new Set(q.options.map(o=>o.toLowerCase().trim())).size,q.options.length,q.id);assert(q.answer>=0&&q.answer<q.options.length,q.id)}});
check('Public build contains no embedded private progress seed',()=>{assert(!fs.readFileSync('dist/index.html','utf8').includes('LAWLINGO_SEED='));assert(!fs.readFileSync('dist/bank.js','utf8').includes('LAWLINGO_SEED='))});
const report={checkedAt:new Date().toISOString(),passed:results.length,checks:results,limitations:['Uses isolated storage and minimal DOM stubs: not a visual or real Chrome/file-origin persistence test.','Does not independently re-verify every legal answer. Existing content audits and unresolved flags remain applicable.']};
fs.writeFileSync('docs/FINAL-AUDIT.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
