import {NOTES,OPEN} from './music-data.js';

const MIDI_TICKS_PER_QUARTER=480;
const BEATS_PER_MEASURE=4;
const MIDI_TICKS_PER_MEASURE=MIDI_TICKS_PER_QUARTER*BEATS_PER_MEASURE;

export function variableLength(value){
  const bytes=[value&127];
  while((value>>=7))bytes.unshift((value&127)|128);
  return bytes;
}

export function createMidi(data){
  const track=[0,255,81,3,7,161,32,0,192,24];
  data.path.forEach(voicing=>{
    const pitches=voicing.frets.map((fret,index)=>fret<0?null:OPEN[index]+fret+data.capo).filter(Number.isFinite);
    pitches.forEach(pitch=>track.push(0,144,pitch,88));
    pitches.forEach((pitch,index)=>track.push(...variableLength(index?0:MIDI_TICKS_PER_MEASURE),128,pitch,0));
  });
  track.push(0,255,47,0);
  const length=track.length;
  return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,(length>>>24)&255,(length>>>16)&255,(length>>>8)&255,length&255,...track]);
}

export function xmlEsc(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));}
export function musicXmlPitch(midi){const note=NOTES[midi%12];return `<pitch><step>${note[0]}</step>${note.includes('#')?'<alter>1</alter>':''}<octave>${Math.floor(midi/12)-1}</octave></pitch>`;}
function musicXmlTuning(midi,line){const note=NOTES[midi%12];return `<staff-tuning line="${line}"><tuning-step>${note[0]}</tuning-step>${note.includes('#')?'<tuning-alter>1</tuning-alter>':''}<tuning-octave>${Math.floor(midi/12)-1}</tuning-octave></staff-tuning>`;}
export function musicXmlNotes(voicing,staff,capo,tab=false){
  let first=true;
  return voicing.frets.map((fret,index)=>{
    if(fret<0)return '';
    const chord=first?'':'<chord/>';first=false;
    const technical=tab?`<notations><technical><string>${6-index}</string><fret>${fret}</fret></technical></notations>`:'';
    return `<note>${chord}${musicXmlPitch(OPEN[index]+fret+capo)}<duration>4</duration><voice>1</voice><type>whole</type><staff>${staff}</staff>${technical}</note>`;
  }).join('');
}
function attributes(){const tuning=OPEN.map((midi,index)=>musicXmlTuning(midi,index+1)).join('');return `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line><clef-octave-change>-1</clef-octave-change></clef><clef number="2"><sign>TAB</sign><line>5</line></clef><staff-details number="2"><staff-type>alternate</staff-type><staff-lines>6</staff-lines>${tuning}</staff-details></attributes>`;}

export function createMusicXml(data){
  const measures=data.path.map((voicing,index)=>`<measure number="${index+1}">${index===0?attributes(data.capo):''}${index===0&&data.capo?`<direction placement="above"><direction-type><words>Capo ${data.capo}</words></direction-type><staff>1</staff></direction>`:''}<direction placement="above"><direction-type><words>${xmlEsc(data.names[index])}</words></direction-type><staff>1</staff></direction>${musicXmlNotes(voicing,1,data.capo)}<backup><duration>4</duration></backup>${musicXmlNotes(voicing,2,data.capo,true)}</measure>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>FretFlow Guitar TAB</work-title></work><identification><encoding><software>FretFlow</software></encoding></identification><part-list><score-part id="P1"><part-name>Guitar</part-name><part-abbreviation>Gtr.</part-abbreviation><score-instrument id="P1-I1"><instrument-name>Acoustic Guitar (nylon)</instrument-name><instrument-sound>pluck.guitar.nylon-string</instrument-sound></score-instrument><midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>25</midi-program></midi-instrument></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}
