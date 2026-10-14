import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {syllabusTopic,selectBlueprint} from './src/syllabus.js';
const root=path.dirname(fileURLToPath(import.meta.url));
process.chdir(root);
const subjects={CPC:{name:'Civil Procedure',glyph:'§',weight:20},QSO:{name:'Law of Evidence',glyph:'◈',weight:20},Constitution:{name:'Constitution',glyph:'▥',weight:10},Ethics:{name:'Professional Ethics',glyph:'⚖',weight:10},PPC:{name:'Pakistan Penal Code',glyph:'¶',weight:10},CrPC:{name:'Criminal Procedure',glyph:'⌁',weight:10},Cases:{name:'Constitutional History',glyph:'⌛',weight:5},International:{name:'International Law',glyph:'◎',weight:5},English:{name:'English Jurisprudence',glyph:'◇',weight:5},Islamic:{name:'Islamic Jurisprudence',glyph:'☾',weight:5}};
const files=['data/content-early.json','data/content-procedure.json','data/content-evidence.json'];
const books=files.flatMap(f=>{if(!fs.existsSync(f))throw Error(`Awaiting completed book transcription: ${f}`);return JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''))});
const seen=new Set();for(const q of books){if(seen.has(q.id))throw Error(`Duplicate ${q.id}`);seen.add(q.id);if(!subjects[q.subject]||!Array.isArray(q.options)||q.options.length<2||!q.question)throw Error(`Invalid question ${q.id}`);if(q.answer!==null&&(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length))throw Error(`Invalid answer ${q.id}`);if(q.status==='verified'&&q.answer===null)throw Error(`Verified without answer ${q.id}`)}
const old=JSON.parse(fs.readFileSync('data/foundations.json','utf8'));
for(const q of books){q.syllabusTopic=syllabusTopic(q);q.mockEligible=q.status==='verified'&&!!q.syllabusTopic&&new Set(q.options.map(o=>o.toLowerCase().trim())).size===4;}
const foundations=old.questions.map(q=>({id:q.id,subject:q.subject,question:q.q,options:[q.answer,...q.wrong],answer:0,explanation:q.why,cue:q.cue,reference:q.ref,sourceType:'foundation',status:'authored',topic:q.topic,scenario:q.scenario,source:q.source}));
const units={};for(const subject of Object.keys(subjects)){const qs=books.filter(q=>q.subject===subject);units[subject]=[];for(let i=0;i<qs.length;i+=12)units[subject].push({id:`unit-${subject}-${1+i/12}`,subject,title:`${subjects[subject].name} ${1+i/12}`,questions:qs.slice(i,i+12).map(q=>q.id),range:`${qs[i].number}–${qs[Math.min(i+11,qs.length-1)].number}`})}
const lessons=[];let more=true;while(more){more=false;for(const s of Object.keys(subjects)){const unit=units[s].shift();if(unit){lessons.push(unit);more=true}}}
const perDay=Math.ceil(lessons.length/4);lessons.forEach((l,i)=>{l.day=Math.min(4,1+Math.floor(i/perDay));l.order=i+1});
const coverage=lessons.flatMap(l=>l.questions);
if(books.length!==604||coverage.length!==604||new Set(coverage).size!==604)throw Error('The main lesson path must include all 604 numbered book questions exactly once.');
for(const [subject,meta] of Object.entries(subjects)){
 const pool=books.filter(q=>q.subject===subject&&q.mockEligible);
 if(pool.length<meta.weight)throw Error(`Too few verified ${subject} questions for a weighted mock.`);
}
const sample=JSON.parse(fs.readFileSync('data/sample-key.json','utf8'));
const sampleDetails=JSON.parse(fs.readFileSync('data/sample-details.json','utf8'));
fs.mkdirSync('dist',{recursive:true});
for(const f of ['index.html','styles.css','icon.svg'])fs.copyFileSync(`src/${f}`,`dist/${f}`);
fs.writeFileSync('dist/styles.css',fs.readFileSync('src/styles.css','utf8').replace(/^\uFEFF/,'')+'\n'+fs.readFileSync('src/polish.css','utf8'));
// Stable papers rotate through each subject pool before reusing its questions.
// Narrow pools necessarily repeat between papers, never within a paper.
const usage={};
const papers=Array.from({length:4},(_,p)=>{
 const groups=Object.entries(subjects).map(([subject,meta])=>{
  const pool=books.filter(q=>q.subject===subject&&q.mockEligible);
  return selectBlueprint(pool,meta.weight,p,usage);
 });
 const ids=[];while(groups.some(g=>g.length))for(const g of groups)if(g.length)ids.push(g.shift());
 if(ids.length!==100||new Set(ids).size!==100)throw Error('Invalid mock paper');
 for(const [subject,meta] of Object.entries(subjects)){
  const selected=ids.map(id=>books.find(q=>q.id===id)).filter(q=>q.subject===subject);
  if(selected.length!==meta.weight||selected.some(q=>!q.mockEligible))throw Error(`Invalid ${subject} syllabus selection`);
  const topicCount=new Set(books.filter(q=>q.subject===subject&&q.mockEligible).map(q=>q.syllabusTopic)).size;
  if(new Set(selected.map(q=>q.syllabusTopic)).size!==Math.min(topicCount,meta.weight))throw Error(`Missing topic spread in ${subject}`);
 }
 return {id:`syllabus-v3-paper-${p+1}`,title:`Syllabus Mock ${p+1}`,ids};
});
const audit=Object.fromEntries(Object.keys(subjects).map(subject=>[subject,{eligible:books.filter(q=>q.subject===subject&&q.mockEligible).length,topics:[...new Set(books.filter(q=>q.subject===subject&&q.mockEligible).map(q=>q.syllabusTopic))],papers:papers.map(p=>({id:p.id,questions:p.ids.filter(id=>books.find(q=>q.id===id).subject===subject),topics:[...new Set(p.ids.map(id=>books.find(q=>q.id===id)).filter(q=>q.subject===subject).map(q=>q.syllabusTopic))]}))}]));
fs.writeFileSync('docs/MOCK-SYLLABUS-AUDIT.json',JSON.stringify(audit,null,2));
console.log(`Syllabus audit: ${books.filter(q=>q.mockEligible).length} eligible book questions; four 100-question papers passed scope, topic spread, uniqueness and subject-weight checks.`);
const bank={version:2,updated:'2026-10-14',subjects,questions:[...books,...foundations],lessons,papers,sample,sampleDetails,sources:old.sources};
fs.writeFileSync('dist/bank.js','window.LAWLINGO_BANK='+JSON.stringify(bank).replace(/</g,'\\u003c')+';');
await build({entryPoints:['src/app.js'],bundle:true,outfile:'dist/app.js',minify:true,target:['es2020']});
fs.mkdirSync('dist/book-pages',{recursive:true});for(const page of new Set(books.map(q=>q.page))){const f=String(page).padStart(2,'0')+'.png';fs.copyFileSync(`assets/book-pages/${f}`,`dist/book-pages/${f}`)}
fs.cpSync('assets/sample-questions','dist/sample-questions',{recursive:true});
fs.writeFileSync('dist/manifest.webmanifest',JSON.stringify({name:'Lawlingo — Law-GAT with Legalu',short_name:'Lawlingo',start_url:'./',display:'standalone',background_color:'#faf9f4',theme_color:'#185447',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]}));
fs.writeFileSync('docs/CONTENT-SUMMARY.json',JSON.stringify({book:books.length,foundations:foundations.length,lessons:lessons.length,bySubject:Object.fromEntries(Object.keys(subjects).map(s=>[s,{total:books.filter(q=>q.subject===s).length,verified:books.filter(q=>q.subject===s&&q.status==='verified').length}])),byStatus:Object.fromEntries([...new Set(books.map(q=>q.status))].map(s=>[s,books.filter(q=>q.status===s).length]))},null,2));
console.log(`Built local-only Lawlingo: all ${books.length} book MCQs in ${lessons.length} lessons. Optional foundations: ${foundations.length}. No cloud service required.`);
