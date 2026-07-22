import test from 'node:test';
import assert from 'node:assert/strict';
import {createMidi,createMusicXml,musicXmlNotes,musicXmlPitch,variableLength,xmlEsc} from '../js/exporters.js';

const voicing={frets:[-1,3,2,0,1,0]};
const data={names:['C'],path:[voicing],capo:0};

test('variableLength: MIDI可変長数値の境界値',()=>{
  assert.deepEqual(variableLength(0),[0]);
  assert.deepEqual(variableLength(127),[127]);
  assert.deepEqual(variableLength(128),[129,0]);
  assert.deepEqual(variableLength(16383),[255,127]);
  assert.deepEqual(variableLength(16384),[129,128,0]);
});

test('createMidi: 有効なヘッダーとトラック長を生成',()=>{
  const midi=createMidi(data);
  assert.equal(String.fromCharCode(...midi.slice(0,4)),'MThd');
  assert.equal(String.fromCharCode(...midi.slice(14,18)),'MTrk');
  const declared=(midi[18]<<24)|(midi[19]<<16)|(midi[20]<<8)|midi[21];
  assert.equal(declared,midi.length-22);
  assert.deepEqual([...createMidi(data).slice(0,22)],[...midi.slice(0,22)]);
});

test('createMidi: 1和音を4/4拍子の1小節分保持する',()=>{
  const midi=createMidi(data);
  const firstNoteOff=22+10+(voicing.frets.filter(fret=>fret>=0).length*4);
  assert.deepEqual([...midi.slice(firstNoteOff,firstNoteOff+3)],variableLength(1920).concat(128));
});

test('XML補助関数: 特殊文字・半音・オクターブ・TAB情報を処理',()=>{
  assert.equal(xmlEsc(`<C & "D">`),'&lt;C &amp; &quot;D&quot;&gt;');
  assert.equal(musicXmlPitch(60),'<pitch><step>C</step><octave>4</octave></pitch>');
  assert.match(musicXmlPitch(61),/<alter>1<\/alter>/);
  const notes=musicXmlNotes(voicing,2,0,true);
  assert.equal((notes.match(/<note>/g)||[]).length,5);
  assert.match(notes,/<string>5<\/string><fret>3<\/fret>/);
});

test('createMusicXml: 小節数、コード名エスケープ、2段譜を生成',()=>{
  const xml=createMusicXml({names:['C&','G'],path:[voicing,{frets:[3,2,0,0,0,3]}],capo:1});
  assert.match(xml,/^<\?xml/);
  assert.doesNotMatch(xml,/<!DOCTYPE/);
  assert.equal((xml.match(/<measure /g)||[]).length,2);
  assert.match(xml,/C&amp;/);
  assert.match(xml,/<staves>2<\/staves>/);
  assert.match(xml,/<clef number="2"><sign>TAB<\/sign>/);
  assert.ok(xml.indexOf('<clef number="2">')<xml.indexOf('<staff-details number="2">'));
  assert.doesNotMatch(xml,/<capo>/);
  assert.match(xml,/<staff-tuning line="1"><tuning-step>E<\/tuning-step><tuning-octave>4<\/tuning-octave>/);
  assert.match(xml,/<pitch><step>F<\/step><octave>4<\/octave><\/pitch>/);
  assert.match(xml,/<words>Capo 1<\/words>/);
  assert.match(xml,/<string>5<\/string><fret>3<\/fret>/);
});

test('createMusicXml: 標準ギターの楽器情報とTAB弦順を明示する',()=>{
  const xml=createMusicXml(data);
  assert.match(xml,/<instrument-name>Acoustic Guitar \(nylon\)<\/instrument-name>/);
  assert.match(xml,/<instrument-sound>pluck\.guitar\.nylon-string<\/instrument-sound>/);
  assert.match(xml,/<staff-tuning line="1"><tuning-step>E<\/tuning-step><tuning-octave>4<\/tuning-octave>/);
  assert.match(xml,/<staff-tuning line="6"><tuning-step>E<\/tuning-step><tuning-octave>2<\/tuning-octave>/);
});
