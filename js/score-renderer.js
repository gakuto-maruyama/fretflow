import {NOTES,OPEN} from './music-data.js';

const CELL_WIDTH=112;
const SCORE_HEIGHT=290;
const STAFF_BOTTOM=95;
const STAFF_STEP=5;
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

function line(ctx,x1,y1,x2,y2,width=1,color='#34362f'){
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
}

function ledgerLines(ctx,x,y,step){
  if(step<=-2)for(let ledger=-2;ledger>=step;ledger-=2)line(ctx,x-10,STAFF_BOTTOM-ledger*STAFF_STEP,x+10,STAFF_BOTTOM-ledger*STAFF_STEP);
  if(step>=10)for(let ledger=10;ledger<=step;ledger+=2)line(ctx,x-10,STAFF_BOTTOM-ledger*STAFF_STEP,x+10,STAFF_BOTTOM-ledger*STAFF_STEP);
}

export function drawScore(canvas,names,path,capo=0){
  const {width,height}=scoreDimensions(names.length);
  const ratio=Math.max(1,globalThis.devicePixelRatio||1);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
  const ctx=canvas.getContext('2d');
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.fillStyle='#faf9f3';ctx.fillRect(0,0,width,height);
  ctx.textAlign='center';ctx.textBaseline='alphabetic';

  [55,65,75,85,95].forEach(y=>line(ctx,42,y,width-24,y));
  TAB_LINES.forEach(y=>line(ctx,42,y,width-24,y,.7));
  line(ctx,42,55,42,95,2,'#171914');line(ctx,42,167,42,237,2,'#171914');
  ctx.fillStyle='#171914';ctx.font='bold 45px serif';ctx.fillText('𝄞',24,89);
  ctx.font='500 9px sans-serif';ctx.fillText('8',25,101);
  ctx.font='500 18px monospace';ctx.fillText('TAB',22,207);

  names.forEach((name,index)=>{
    const center=82+index*CELL_WIDTH,voicing=path[index];
    ctx.fillStyle='#171914';ctx.font='600 15px monospace';ctx.fillText(name,center,30);
    const pitches=voicing.frets.map((fret,string)=>fret<0?null:OPEN[string]+fret+Number(capo)).filter(Number.isFinite);
    pitches.forEach((midi,noteIndex)=>{
      const x=center+(noteIndex%3-1)*6;
      const {step,accidental}=pitchLayout(midi),y=STAFF_BOTTOM-step*STAFF_STEP;
      ledgerLines(ctx,x,y,step);
      if(accidental){ctx.font='15px serif';ctx.textAlign='right';ctx.fillText(accidental,x-7,y+5);ctx.textAlign='center';}
      ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/10);ctx.beginPath();ctx.ellipse(0,0,6,4,0,0,Math.PI*2);ctx.fill();ctx.restore();
    });
    [5,4,3,2,1,0].forEach((string,row)=>{
      const fret=voicing.frets[string],value=fret<0?'×':String(fret),y=TAB_LINES[row];
      ctx.fillStyle='#faf9f3';ctx.fillRect(center-11,y-8,22,16);
      ctx.fillStyle='#171914';ctx.font='500 11px monospace';ctx.fillText(value,center,y+4);
    });
    line(ctx,center+CELL_WIDTH/2,55,center+CELL_WIDTH/2,95,1,'#77796f');
    line(ctx,center+CELL_WIDTH/2,167,center+CELL_WIDTH/2,237,1,'#77796f');
  });
  ctx.textAlign='left';ctx.fillStyle='#77796f';ctx.font='8px monospace';
  ctx.fillText('4/4  ·  LET RING  ·  FRET NUMBERS ARE RELATIVE TO CAPO',42,268);
  return {width,height};
}
