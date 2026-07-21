import {CHORD_TYPES,NOTES,PC} from './music-data.js';

const QUALITIES = [...CHORD_TYPES.map(type=>type.suffix),'M7'].sort((a,b)=>b.length-a.length);
const ROOT_PATTERN = '[A-Ga-g](?:#|♯|b|♭)?';
const CHORD_PATTERN = new RegExp(`^(${ROOT_PATTERN})(${QUALITIES.filter(Boolean).join('|')})?(?:\/(${ROOT_PATTERN}))?`);
const SEPARATOR_PATTERN = /^[\s|｜,，→]+/;

function normalizeRoot(root){
  return root[0].toUpperCase()+root.slice(1).replaceAll('♯','#').replaceAll('♭','b');
}

export function parseProgression(raw){
  const source=raw.trim();
  if(!source)return {names:[],error:'コードを入力してください（例：F G Em Am）'};
  const names=[];
  let rest=source;
  while(rest){
    const separator=rest.match(SEPARATOR_PATTERN);
    if(separator){rest=rest.slice(separator[0].length);continue;}
    const match=rest.match(CHORD_PATTERN);
    if(!match){
      const invalid=rest.match(/^[^\s|｜,，→]+/)?.[0]||rest[0];
      return {names:[],error:`「${invalid}」は対応していないコードです。対応コード一覧から選択してください。`};
    }
    let quality=match[2]||'';
    if(quality==='M7')quality='maj7';
    const name=normalizeRoot(match[1])+quality+(match[3]?`/${normalizeRoot(match[3])}`:'');
    names.push(name);
    rest=rest.slice(match[0].length);
  }
  return {names,error:null};
}

export function chordInfo(name){
  const match=name.match(/^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/);
  if(!match||PC[match[1]]===undefined)return null;
  const root=PC[match[1]],quality=match[2]||'';
  let intervals=quality.includes('m7b5')?[0,3,6,10]:quality==='dim7'?[0,3,6,9]:quality.startsWith('m')&&!quality.startsWith('maj')?[0,3,7]:quality.startsWith('dim')?[0,3,6]:quality.startsWith('aug')?[0,4,8]:[0,4,7];
  if(quality==='7'||quality==='m7')intervals.push(10);
  if(quality==='maj7')intervals.push(11);
  if(quality==='sus2')intervals=[0,2,7];
  if(quality==='sus4')intervals=[0,5,7];
  if(quality==='add9')intervals.push(2);
  return {name,root,q:quality,tones:new Set(intervals.map(value=>(root+value)%12)),bass:match[3]?PC[match[3]]:root};
}

export function transposeForCapo(name,capo){
  if(!capo)return name;
  return name.replace(/^([A-G](?:#|b)?)/,root=>NOTES[(PC[root]-capo+12)%12]);
}
