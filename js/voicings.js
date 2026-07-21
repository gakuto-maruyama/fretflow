import {OPEN,OPEN_SHAPES} from './music-data.js';

function barreCandidates(chord){
  const out=[];
  if(chord.q.includes('m7b5')){
    for(let fret=1;fret<=12;fret++)if((OPEN[1]+fret)%12===chord.root)out.push({frets:[-1,fret,fret+1,fret,fret+1,-1],type:'セーハー',base:fret});
    return out;
  }
  for(const base of [{rootString:0,shape:[0,2,2,1,0,0],minor:[0,2,2,0,0,0]},{rootString:1,shape:[-1,0,2,2,2,0],minor:[-1,0,2,2,1,0]}]){
    for(let fret=1;fret<=12;fret++){
      if((OPEN[base.rootString]+fret)%12!==chord.root)continue;
      const shape=chord.q.startsWith('m')&&!chord.q.startsWith('maj')?base.minor:base.shape;
      let frets=shape.map(value=>value<0?-1:value+fret);
      if(chord.q==='7')frets=base.rootString===0?[fret,fret+2,fret,fret+1,fret,fret]:[-1,fret,fret+2,fret,fret+2,fret];
      if(chord.q==='m7')frets=base.rootString===0?[fret,fret+2,fret,fret,fret,fret]:[-1,fret,fret+2,fret,fret,fret];
      if(chord.q==='maj7')frets=base.rootString===0?[fret,fret+2,fret+1,fret+1,fret,fret]:[-1,fret,fret+2,fret+1,fret+2,fret];
      out.push({frets,type:'セーハー',base:fret});
    }
  }
  return out;
}

function validVoicing(chord,frets){
  const heard=frets.map((fret,index)=>fret<0?null:(OPEN[index]+fret)%12).filter(value=>value!==null);
  return heard.length>=4&&heard.every(note=>chord.tones.has(note))&&heard.includes(chord.root);
}

function candidates(chord,setting){
  let out=[];
  const open=OPEN_SHAPES[chord.name];
  if(open&&setting.form!=='barre')out.push({frets:open,type:open.includes(0)?'オープン':'コンパクト',base:Math.min(...open.filter(value=>value>0),1)});
  if(setting.form!=='open'||!open)out.push(...barreCandidates(chord));
  return out.filter(voicing=>validVoicing(chord,voicing.frets));
}

function localCost(voicing,setting){
  const used=voicing.frets.filter(value=>value>=0),positions=used.filter(value=>value>0);
  const span=positions.length?Math.max(...positions)-Math.min(...positions):0;
  let cost=span*2+used.length*.25+(voicing.type==='セーハー'?(setting.difficulty==='easy'?5:2):0);
  const average=positions.length?positions.reduce((a,b)=>a+b,0)/positions.length:0;
  if(setting.position==='low')cost+=average*.65;
  if(setting.position==='high')cost+=Math.max(0,7-average)*1.2;
  if(setting.form==='barre'&&voicing.type!=='セーハー')cost+=100;
  if(setting.form==='open'&&voicing.frets.includes(0))cost-=3;
  return cost;
}

export function transition(a,b){
  let sum=0,count=0;
  for(let index=0;index<6;index++)if(a.frets[index]>=0&&b.frets[index]>=0){sum+=Math.abs(a.frets[index]-b.frets[index]);count++;}
  const center=values=>values.length?values.reduce((p,q)=>p+q,0)/values.length:0;
  return sum/Math.max(count,1)+Math.abs(center(a.frets.filter(x=>x>0))-center(b.frets.filter(x=>x>0)))*1.4;
}

export function optimize(chords,setting){
  const lists=chords.map(chord=>candidates(chord,setting));
  const missing=lists.findIndex(list=>list.length===0);
  if(missing>=0)return {error:`${chords[missing].name} は現在の演奏設定では押さえ方を生成できません。`};
  let dp=lists[0].map(voicing=>({cost:localCost(voicing,setting),path:[voicing]}));
  for(let index=1;index<lists.length;index++)dp=lists[index].map(voicing=>dp.reduce((best,previous)=>{
    const next={cost:previous.cost+localCost(voicing,setting)+transition(previous.path.at(-1),voicing),path:[...previous.path,voicing]};
    return !best||next.cost<best.cost?next:best;
  },null));
  return dp.reduce((a,b)=>a.cost<b.cost?a:b);
}
