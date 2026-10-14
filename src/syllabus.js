// Topic boundaries follow the saved official HEC LAW-GAT syllabus.
// Topic allocations within a subject are Lawlingo teaching choices, not HEC quotas.
export function syllabusTopic(q){
 const r=q.reference||'', n=q.number, section=Number(r.match(/sections?\s+(\d+)/i)?.[1]);
 switch(q.subject){
 case 'CPC': {
  const order=r.match(/Order\s+([IVXL]+)\b/i)?.[1]?.toUpperCase();
  if(order)return ({I:'Parties · Order I',VI:'Pleadings · Order VI',VII:'Plaint · Order VII',VIII:'Defence · Order VIII',IX:'Appearance · Order IX',XXXIX:'Injunctions · Order XXXIX',XLI:'Appeals · Order XLI',XLIII:'Appealable orders · Order XLIII'})[order]||null;
  if(section<=12)return 'Definitions, jurisdiction and prior suits';
  if(section>=15&&section<=20)return 'Place of suing';
  return ({47:'Execution disputes',75:'Commissions',96:'Appeals from decrees',104:'Appeals from orders',115:'Revision',151:'Inherent powers'})[section]||null;
 }
 case 'CrPC':
  if(!/^CrPC section/i.test(r))return null;
  return [[1,5,'Preliminary definitions'],[46,67,'Arrest'],[94,105,'Production and search'],[106,126,'Security for peace'],[133,143,'Public nuisance'],[144,144,'Urgent orders'],[154,176,'FIR and investigation'],[200,203,'Complaints'],[204,205,'Commencement of proceedings'],[404,431,'Appeals'],[496,502,'Bail']].find(([lo,hi])=>section>=lo&&section<=hi)?.[2]||null;
 case 'PPC':
  if(!/^PPC section/i.test(r))return null;
  return [[6,52,'General explanations'],[76,106,'General exceptions'],[299,338,'Human body · homicide and hurt'],[339,348,'Restraint and confinement'],[349,377,'Human body · force and abduction'],[378,462,'Property offences']].find(([lo,hi])=>section>=lo&&section<=hi)?.[2]||null;
 case 'Constitution': {
  if(/Article Preamble/.test(r))return 'Preamble and Articles 1–40';
  const a=Number(r.match(/Article\s+(\d+)/)?.[1]);
  return a<=40?'Preamble and Articles 1–40':a>=50&&a<=89?'Parliament · Articles 50–89':a>=175&&a<=212?'Judicature · Articles 175–212':null;
 }
 case 'International':return /^ICJ Statute/.test(r)?'ICJ Statute':/^UN Charter/.test(r)?'UN Charter':null;
 case 'Cases':return n<=4?'Tamiz-ud-Din':n<=11?'Dosso':n<=17?'Asma Jilani':n<=21?'Nusrat Bhutto':n<=27?'Nawaz Sharif':n<=30?'Al-Jehad Trust':n<=34?'Zafar Ali Shah':'Asfandyar Wali';
 case 'QSO':{
  const a=Number(r.match(/Articles?\s+(\d+)/i)?.[1]);
  return !a||a<=17?'Definitions and witnesses':a<=69?'Relevancy of facts':a<=110?'Proof and documents':a<=129?'Burden and presumptions':a<=131?'Estoppel':'Examination and other provisions';
 }
 case 'Ethics':return n<=10?'Professional conduct · first group':n<=22?'Professional conduct · middle group':'Professional conduct · final group';
 case 'English':return /ownership|possession|encumbrance/i.test(r)?'Ownership and possession':/custom|precedent|legislation/i.test(r)?'Sources of law':/rights|obligations|persons/i.test(r)?'Rights, persons and obligations':'Nature of law and jurisprudence';
 case 'Islamic':return /Qiyas/i.test(r)?'Qiyas':/Al-Sarf/i.test(r)?'Al-Sarf':'Usul and legal rules';
 default:return null;
 }
}

export function selectBlueprint(pool,count,offset=0,usage={}){
 const topics=[...new Set(pool.map(q=>q.syllabusTopic))].sort();
 const chosen=[],used=new Set();
 for(let round=0;chosen.length<count;round++){
  let added=false;
  for(let t=0;t<topics.length&&chosen.length<count;t++){
   const topic=topics[(t+offset)%topics.length];
   const choices=pool.filter(q=>q.syllabusTopic===topic&&!used.has(q.id)).sort((a,b)=>(usage[a.id]||0)-(usage[b.id]||0)||a.number-b.number);
   const q=choices[0];if(!q)continue;
   chosen.push(q.id);used.add(q.id);usage[q.id]=(usage[q.id]||0)+1;added=true;
  }
  if(!added)throw Error('Insufficient eligible questions for syllabus blueprint');
 }
 return chosen;
}
