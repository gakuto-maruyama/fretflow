const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_LABELS = ['C','C# / Db','D','D# / Eb','E','F','F# / Gb','G','G# / Ab','A','A# / Bb','B'];
const CHORD_TYPES = [
  {suffix:'',label:'メジャー'}, {suffix:'m',label:'マイナー'}, {suffix:'7',label:'セブンス'},
  {suffix:'m7',label:'マイナーセブンス'}, {suffix:'maj7',label:'メジャーセブンス'},
  {suffix:'sus2',label:'サスツー'}, {suffix:'sus4',label:'サスフォー'}, {suffix:'add9',label:'アドナインス'},
  {suffix:'dim',label:'ディミニッシュ'}, {suffix:'dim7',label:'ディミニッシュセブンス'},
  {suffix:'aug',label:'オーギュメント'}, {suffix:'m7b5',label:'マイナーセブンフラットファイブ'}
];
const OPEN = [40,45,50,55,59,64]; // low E → high E
const PC = Object.fromEntries(NOTES.map((n,i)=>[n,i]));
Object.assign(PC,{Db:1,Eb:3,Gb:6,Ab:8,Bb:10,'B#':0,'E#':5,Cb:11,Fb:4});
const OPEN_SHAPES = {
  C:[-1,3,2,0,1,0], D:[-1,-1,0,2,3,2], E:[0,2,2,1,0,0], F:[-1,-1,3,2,1,1],
  G:[3,2,0,0,0,3], A:[-1,0,2,2,2,0], B:[-1,2,4,4,4,2],
  Cm:[-1,3,5,5,4,3], Dm:[-1,-1,0,2,3,1], Em:[0,2,2,0,0,0], Fm:[1,3,3,1,1,1],
  Gm:[3,5,5,3,3,3], Am:[-1,0,2,2,1,0], Bm:[-1,2,4,4,3,2],
  C7:[-1,3,2,3,1,0], D7:[-1,-1,0,2,1,2], E7:[0,2,0,1,0,0], F7:[1,3,1,2,1,1],
  G7:[3,2,0,0,0,1], A7:[-1,0,2,0,2,0], B7:[-1,2,1,2,0,2],
  Cmaj7:[-1,3,2,0,0,0],Dmaj7:[-1,-1,0,2,2,2],Emaj7:[0,2,1,1,0,0],Fmaj7:[-1,-1,3,2,1,0],
  Gmaj7:[3,2,0,0,0,2],Amaj7:[-1,0,2,1,2,0],Cadd9:[-1,3,2,0,3,0],Dsus4:[-1,-1,0,2,3,3],Asus4:[-1,0,2,2,3,0],
  'Bm7b5':[-1,2,3,2,3,-1], 'Em7b5':[0,1,0,0,3,0], 'Am7b5':[-1,0,1,0,1,-1], 'Dm7b5':[-1,-1,0,1,1,1]
};

function parseProgression(raw){
  const clean=raw.replace(/[｜|,，→]/g,' ').replace(/[()（）].*?[)）]/g,' ');
  const matches=clean.match(/[A-Ga-g](?:#|♯|b|♭)?(?:(?:m7|ø7?)(?:-5|b5|♭5)?|maj7|M7|add9|sus[24]|dim7?|aug|m|7)?(?:\/[A-Ga-g](?:#|b)?)?/g)||[];
  return matches.map(s=>s[0].toUpperCase()+s.slice(1).replaceAll('♯','#').replaceAll('♭','b').replace(/ø7?/,'m7b5').replace(/m7-5/,'m7b5'));
}
function chordInfo(name){
  const m=name.match(/^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/); if(!m)return null;
  const root=PC[m[1]], q=m[2]||'';
  let intervals=q.includes('m7b5')?[0,3,6,10]:q==='dim7'?[0,3,6,9]:q.startsWith('m')&&!q.startsWith('maj')?[0,3,7]:q.startsWith('dim')?[0,3,6]:q.startsWith('aug')?[0,4,8]:[0,4,7];
  if(q==='7')intervals.push(10); if(q==='m7')intervals.push(10); if(/maj7|M7/.test(q))intervals.push(11);
  if(q.includes('sus2'))intervals=[0,2,7]; if(q.includes('sus4'))intervals=[0,5,7]; if(q.includes('add9'))intervals.push(2);
  return {name,root,q,tones:new Set(intervals.map(x=>(root+x)%12)),bass:m[3]?PC[m[3]]:root};
}
function transposeForCapo(name,capo){
  if(!capo)return name;
  return name.replace(/^([A-G](?:#|b)?)/,root=>NOTES[(PC[root]-capo+12)%12]);
}
function barreCandidates(c){
  const out=[];
  if(c.q.includes('m7b5')){
    for(let fret=1;fret<=12;fret++)if((OPEN[1]+fret)%12===c.root)out.push({frets:[-1,fret,fret+1,fret,fret+1,-1],type:'セーハー',base:fret});
    return out;
  }
  for(const base of [{rootString:0,shape:[0,2,2,1,0,0],minor:[0,2,2,0,0,0]},{rootString:1,shape:[-1,0,2,2,2,0],minor:[-1,0,2,2,1,0]}]){
    for(let fret=1;fret<=12;fret++){
      if((OPEN[base.rootString]+fret)%12!==c.root)continue;
      let shape=(c.q.startsWith('m')&&!c.q.startsWith('maj'))?base.minor:base.shape;
      let frets=shape.map(x=>x<0?-1:x+fret);
      // Modify common seventh shapes while keeping movable geometry.
      if(c.q==='7') frets=base.rootString===0?[fret,fret+2,fret,fret+1,fret,fret]:[-1,fret,fret+2,fret,fret+2,fret];
      if(c.q==='m7') frets=base.rootString===0?[fret,fret+2,fret,fret,fret,fret]:[-1,fret,fret+2,fret,fret,fret];
      if(/maj7|M7/.test(c.q)) frets=base.rootString===0?[fret,fret+2,fret+1,fret+1,fret,fret]:[-1,fret,fret+2,fret+1,fret+2,fret];
      out.push({frets,type:'セーハー',base:fret});
    }
  } return out;
}
function validVoicing(c,frets){
  const heard=frets.map((f,i)=>f<0?null:(OPEN[i]+f)%12).filter(x=>x!==null);
  return heard.length>=4&&heard.every(n=>c.tones.has(n))&&heard.includes(c.root);
}
function candidates(c,setting){
  let out=[]; const open=OPEN_SHAPES[c.name];
  if(open&&setting.form!=='barre')out.push({frets:open,type:open.includes(0)?'オープン':'コンパクト',base:Math.min(...open.filter(x=>x>0),1)});
  if(setting.form!=='open'||!open)out.push(...barreCandidates(c));
  out=out.filter(v=>validVoicing(c,v.frets));
  return out.length?out:[...barreCandidates({...c,q:c.q.replace(/7|add9|sus[24]/,'')})].slice(0,2);
}
function localCost(v,s){
  const used=v.frets.filter(x=>x>=0), pos=used.filter(x=>x>0); const span=pos.length?Math.max(...pos)-Math.min(...pos):0;
  let cost=span*2+used.length*.25+(v.type==='セーハー'?(s.difficulty==='easy'?5:2):0);
  const avg=pos.length?pos.reduce((a,b)=>a+b,0)/pos.length:0;
  if(s.position==='low')cost+=avg*.65; if(s.position==='high')cost+=Math.max(0,7-avg)*1.2;
  if(s.form==='barre'&&v.type!=='セーハー')cost+=100; if(s.form==='open'&&v.frets.includes(0))cost-=3;
  return cost;
}
function transition(a,b){
  let sum=0,n=0; for(let i=0;i<6;i++)if(a.frets[i]>=0&&b.frets[i]>=0){sum+=Math.abs(a.frets[i]-b.frets[i]);n++;}
  const ac=a.frets.filter(x=>x>0),bc=b.frets.filter(x=>x>0); const center=x=>x.length?x.reduce((p,q)=>p+q,0)/x.length:0;
  return sum/Math.max(n,1)+Math.abs(center(ac)-center(bc))*1.4;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function scoreSvg(names,path,capo){
  const cell=112,w=Math.max(520,80+cell*names.length), staff=[55,65,75,85,95], tab=[167,181,195,209,223,237];
  let x=`<rect width="${w}" height="290" fill="#faf9f3"/>`;
  [...staff,...tab].forEach(y=>x+=`<line x1="42" y1="${y}" x2="${w-24}" y2="${y}" stroke="#34362f" stroke-width="${tab.includes(y)?.7:1}"/>`);
  x+=`<line x1="42" y1="55" x2="42" y2="95" stroke="#171914" stroke-width="2"/><line x1="42" y1="167" x2="42" y2="237" stroke="#171914" stroke-width="2"/>`;
  x+=`<text x="8" y="86" font-family="serif" font-size="45" font-weight="bold">𝄞</text><text x="8" y="207" font-size="19" font-weight="500">TAB</text>`;
  names.forEach((name,i)=>{
    const cx=82+i*cell, v=path[i];
    x+=`<text x="${cx}" y="30" text-anchor="middle" font-size="15" font-weight="600">${esc(name)}</text>`;
    const pitches=v.frets.map((f,si)=>f<0?null:OPEN[si]+f+Number(capo)).filter(Boolean);
    pitches.forEach((p,j)=>{const nx=cx+(j%3-1)*5,y=92-(p-60)*2.5;
      if(y>100)for(let ly=105;ly<=y+2;ly+=10)x+=`<line x1="${nx-9}" y1="${ly}" x2="${nx+9}" y2="${ly}" stroke="#34362f" stroke-width="1"/>`;
      if(y<50)for(let ly=45;ly>=y-2;ly-=10)x+=`<line x1="${nx-9}" y1="${ly}" x2="${nx+9}" y2="${ly}" stroke="#34362f" stroke-width="1"/>`;
      x+=`<ellipse cx="${nx}" cy="${y}" rx="6" ry="4" transform="rotate(-18 ${nx} ${y})" fill="#171914"/>`;
    });
    [5,4,3,2,1,0].forEach((si,row)=>{const f=v.frets[si],val=f<0?'×':f; x+=`<rect x="${cx-11}" y="${tab[row]-8}" width="22" height="16" rx="2" fill="#faf9f3"/><text x="${cx}" y="${tab[row]+4}" text-anchor="middle" font-size="11" font-weight="500">${val}</text>`;});
    x+=`<line x1="${cx+cell/2}" y1="55" x2="${cx+cell/2}" y2="95" stroke="#77796f"/><line x1="${cx+cell/2}" y1="167" x2="${cx+cell/2}" y2="237" stroke="#77796f"/>`;
  });
  x+=`<text x="42" y="268" font-size="8" fill="#77796f">4/4  ·  LET RING  ·  FRET NUMBERS ARE RELATIVE TO CAPO</text>`;
  return {html:x,width:w};
}
function diagramSvg(v){
  const played=v.frets.filter(f=>f>0), min=played.length?Math.min(...played):1, start=Math.max(1,Math.min(min,9)), visible=v.frets.map(f=>f<=0?f:f-start+1);
  let x=`<svg class="chord-diagram" viewBox="0 0 118 145" aria-label="コードダイアグラム">`;
  for(let i=0;i<6;i++)x+=`<line x1="${14+i*18}" y1="24" x2="${14+i*18}" y2="124" stroke="#777a71"/>`;
  for(let i=0;i<=5;i++)x+=`<line x1="14" y1="${24+i*20}" x2="104" y2="${24+i*20}" stroke="${i===0&&start===1?'#f5f3eb':'#777a71'}" stroke-width="${i===0&&start===1?3:1}"/>`;
  if(start>1)x+=`<text x="3" y="39" font-size="8" fill="#aeb0a7">${start}fr</text>`;
  v.frets.forEach((f,i)=>{const cx=14+i*18;if(f<0)x+=`<text x="${cx}" y="15" text-anchor="middle" font-size="11" fill="#ff8062">×</text>`;else if(f===0)x+=`<circle cx="${cx}" cy="11" r="4" fill="none" stroke="#d8ff52"/>`;else{const cy=24+(visible[i]-.5)*20;x+=`<circle cx="${cx}" cy="${cy}" r="7" fill="#d8ff52"/><text x="${cx}" y="${cy+3}" text-anchor="middle" font-size="8" font-weight="600" fill="#1d201c">●</text>`;}});
  return x+'</svg>';
}
function optimize(chords,s){
  const lists=chords.map(c=>candidates(c,s)); let dp=lists[0].map(v=>({cost:localCost(v,s),path:[v]}));
  for(let i=1;i<lists.length;i++)dp=lists[i].map(v=>{let best=null;for(const p of dp){const x={cost:p.cost+localCost(v,s)+transition(p.path.at(-1),v),path:[...p.path,v]};if(!best||x.cost<best.cost)best=x;}return best;});
  return dp.reduce((a,b)=>a.cost<b.cost?a:b);
}
function render(names,best,s){
  const sheet=scoreSvg(names,best.path,s.capo),svg=document.querySelector('#score-sheet'); svg.setAttribute('viewBox',`0 0 ${sheet.width} 290`);svg.setAttribute('width',sheet.width);svg.innerHTML=sheet.html;
  document.querySelector('#capo-label').textContent=Number(s.capo)?`CAPO ${s.capo} · E A D G B E`:'TUNING: E A D G B E';
  document.querySelector('#cards').innerHTML=best.path.map((v,i)=>`<article class="chord-card ${i===0?'active':''}"><div class="chord-card-top"><div><h3>${esc(names[i])}</h3><p>${v.type} · ${positionName(v)}</p></div><p>6 → 1弦</p></div>${diagramSvg(v)}</article>`).join('');
  const score=Math.max(52,Math.min(98,Math.round(100-best.cost/(names.length||1)*2.4)));
  document.querySelector('#score strong').textContent=score;
  const moves=best.path.slice(1).map((v,i)=>transition(best.path[i],v)); const hardest=moves.indexOf(Math.max(...moves));
  document.querySelector('#tip').innerHTML=moves.length?`<strong>演奏のヒント：</strong> ${names[hardest]} → ${names[hardest+1]} が一番大きな移動です。次のコードを見ながら、力を抜いてまとめて移動しましょう。`:`<strong>演奏のヒント：</strong> まず各弦をゆっくり鳴らし、音詰まりがないか確認しましょう。`;
}
function positionName(v){const p=v.frets.filter(x=>x>0);const a=p.length?p.reduce((x,y)=>x+y,0)/p.length:0;return a>=6?'ハイ':'ロー';}
function generate(){
  const names=parseProgression(document.querySelector('#progression').value); if(!names.length){alert('コードを入力してください（例：F G Em Am）');return;}
  const s={form:document.querySelector('[name=form]:checked').value,difficulty:document.querySelector('[name=difficulty]:checked').value,position:document.querySelector('[name=position]:checked').value,capo:document.querySelector('#capo').value};
  const chords=names.map(n=>chordInfo(transposeForCapo(n,Number(s.capo)))).filter(Boolean),best=optimize(chords,s); render(names,best,s);
  document.querySelector('#empty').hidden=true;document.querySelector('#result').hidden=false;
}
function addChordToProgression(chord){
  const input=document.querySelector('#progression'),current=input.value.trim();
  input.value=current?`${current} ${chord}`:chord;
  input.focus(); input.setSelectionRange(input.value.length,input.value.length);
  document.querySelector('.app-view').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderChordLibrary(){
  const rootSelect=document.querySelector('#library-root');
  rootSelect.innerHTML=NOTES.map(note=>`<option value="${note}">${NOTE_LABELS[PC[note]]}</option>`).join('');
  const draw=()=>{const root=rootSelect.value;document.querySelector('#chord-library-grid').innerHTML=CHORD_TYPES.map(type=>`<button class="chord-option" type="button" data-chord="${root+type.suffix}">${root+type.suffix}<small>${type.label}</small></button>`).join('');};
  rootSelect.addEventListener('change',draw); draw();
}
function renderNotePicker(){
  const picker=document.querySelector('#note-picker'),selected=new Set();
  picker.innerHTML=NOTE_LABELS.map((label,i)=>`<button class="note-button" type="button" data-note="${i}" aria-pressed="false">${label}</button>`).join('');
  picker.addEventListener('click',event=>{
    const button=event.target.closest('.note-button'); if(!button)return;
    const pc=Number(button.dataset.note); selected.has(pc)?selected.delete(pc):selected.add(pc);
    button.setAttribute('aria-pressed',String(selected.has(pc))); renderFinderResults(selected);
  });
}
function renderFinderResults(selected){
  const result=document.querySelector('#finder-result');
  if(selected.size<3){result.innerHTML='<p>3音以上選ぶと、候補のコードを表示します。</p>';return;}
  const matches=[];
  NOTES.forEach(root=>CHORD_TYPES.forEach(type=>{const name=root+type.suffix,info=chordInfo(name);if(info&&info.tones.size===selected.size&&[...info.tones].every(note=>selected.has(note)))matches.push({name,label:type.label});}));
  result.innerHTML=matches.length?`<div class="finder-candidates">${matches.map(match=>`<button class="chord-option" type="button" data-chord="${match.name}">${match.name}<small>${match.label}</small></button>`).join('')}</div>`:'<p>選択した構成音と完全に一致する対応コードはありません。</p>';
}
document.querySelector('#generate').addEventListener('click',generate);
document.querySelector('#progression').addEventListener('keydown',e=>{if(e.key==='Enter')generate()});
document.querySelectorAll('.examples button').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#progression').value=b.dataset.value;generate()}));
document.addEventListener('click',event=>{const button=event.target.closest('[data-chord]');if(button)addChordToProgression(button.dataset.chord);});
renderChordLibrary();
renderNotePicker();
generate();
