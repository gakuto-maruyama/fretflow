import {NOTES,OPEN} from './music-data.js';

const CELL_WIDTH=112;
const SCORE_HEIGHT=290;
const STAFF_BOTTOM=95;
const STAFF_STEP=5;
const STAFF_LINES=[55,65,75,85,95];
const TAB_LINES=[167,181,195,209,223,237];
const LETTER_INDEX={C:0,D:1,E:2,F:3,G:4,A:5,B:6};

export function scoreDimensions(chordCount){
  return {width:Math.max(520,80+CELL_WIDTH*Math.max(0,chordCount)),height:SCORE_HEIGHT};
}

export function pitchLayout(midi){
  const note=NOTES[((midi%12)+12)%12];
  const octave=Math.floor(midi/12)-1;
  const diatonic=octave*7+LETTER_INDEX[note[0]];
  const reference=3*7+LETTER_INDEX.E;
  return {step:diatonic-reference,accidental:note.includes('#')?'♯':''};
}

function ledgerPositions(step){
  const positions=[];
  if(step<=-2)for(let ledger=-2;ledger>=step;ledger-=2)positions.push(STAFF_BOTTOM-ledger*STAFF_STEP);
  if(step>=10)for(let ledger=10;ledger<=step;ledger+=2)positions.push(STAFF_BOTTOM-ledger*STAFF_STEP);
  return positions;
}

export function scoreLayout(names,path,capo=0){
  const dimensions=scoreDimensions(names.length);
  const measures=names.map((name,index)=>{
    const center=82+index*CELL_WIDTH,voicing=path[index];
    const pitches=voicing.frets.map((fret,string)=>fret<0?null:OPEN[string]+fret+Number(capo)).filter(Number.isFinite);
    return {
      name,center,barline:center+CELL_WIDTH/2,
      notes:pitches.map((midi,noteIndex)=>{
        const x=center+(noteIndex%3-1)*6,{step,accidental}=pitchLayout(midi);
        return {x,y:STAFF_BOTTOM-step*STAFF_STEP,step,accidental,ledgers:ledgerPositions(step)};
      }),
      tabs:[5,4,3,2,1,0].map((string,row)=>({x:center,y:TAB_LINES[row],value:voicing.frets[string]<0?'×':String(voicing.frets[string])}))
    };
  });
  return {...dimensions,staffLines:[...STAFF_LINES],tabLines:[...TAB_LINES],measures};
}

function element(className,text=''){
  const node=document.createElement('span');node.className=className;node.textContent=text;return node;
}

function position(node,left,top){node.style.left=`${left}px`;node.style.top=`${top}px`;return node;}

export function drawScore(root,names,path,capo=0){
  const layout=scoreLayout(names,path,capo);
  root.replaceChildren();root.style.width=`${layout.width}px`;root.style.height=`${layout.height}px`;
  layout.staffLines.forEach(y=>root.append(position(element('notation-line staff-line'),42,y)));
  layout.tabLines.forEach(y=>root.append(position(element('notation-line tab-line'),42,y)));
  root.append(position(element('notation-bar'),42,55),position(element('notation-tab-bar'),42,167));
  root.append(position(element('notation-clef','𝄞'),7,48),position(element('notation-octave','8'),21,91),position(element('notation-tab-label','TAB'),5,188));
  layout.measures.forEach(measure=>{
    root.append(position(element('notation-chord-name',measure.name),measure.center,16));
    measure.notes.forEach(note=>{
      note.ledgers.forEach(y=>root.append(position(element('notation-ledger'),note.x,y)));
      if(note.accidental)root.append(position(element('notation-accidental',note.accidental),note.x-15,note.y-10));
      root.append(position(element('notation-note'),note.x,note.y));
    });
    measure.tabs.forEach(tab=>root.append(position(element('notation-fret',tab.value),tab.x,tab.y)));
    root.append(position(element('notation-measure-bar'),measure.barline,55),position(element('notation-tab-measure-bar'),measure.barline,167));
  });
  root.append(position(element('notation-footer','4/4  ·  LET RING  ·  FRET NUMBERS ARE RELATIVE TO CAPO'),42,260));
  return layout;
}
