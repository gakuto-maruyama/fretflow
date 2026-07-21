import test from 'node:test';
import assert from 'node:assert/strict';
import {CHORD_TYPES,PC} from '../js/music-data.js';
import {chordInfo,normalizeRoot,parseProgression,transposeForCapo} from '../js/chords.js';

test('normalizeRoot: 大文字化と異名記号の正規化',()=>{
  assert.equal(normalizeRoot('c♯'),'C#');
  assert.equal(normalizeRoot('e♭'),'Eb');
});

test('parseProgression: 空白・各区切り文字・連結入力を受理',()=>{
  assert.deepEqual(parseProgression('F G|Em，Am→C').names,['F','G','Em','Am','C']);
  assert.deepEqual(parseProgression('FGEmAm').names,['F','G','Em','Am']);
  assert.deepEqual(parseProgression('c♯m7 / invalid').names,[]);
});

test('parseProgression: 全対応コード種別を受理',()=>{
  for(const {suffix} of CHORD_TYPES)assert.deepEqual(parseProgression(`C${suffix}`).names,[`C${suffix}`]);
  assert.deepEqual(parseProgression('CM7').names,['Cmaj7']);
  assert.deepEqual(parseProgression('C/E').names,['C/E']);
});

test('parseProgression: 空入力と未対応部分を明確に拒否',()=>{
  for(const input of ['', '   ', 'C9', 'H', 'C hello', 'C/', 'Cmaj9', '(C)']){
    const result=parseProgression(input);
    assert.equal(result.names.length,0,input);
    assert.ok(result.error,input);
  }
});

test('chordInfo: コード種別ごとの構成音を返す',()=>{
  assert.deepEqual([...chordInfo('C').tones],[0,4,7]);
  assert.deepEqual([...chordInfo('Cm7').tones],[0,3,7,10]);
  assert.deepEqual([...chordInfo('Cdim7').tones],[0,3,6,9]);
  assert.deepEqual([...chordInfo('Csus4').tones],[0,5,7]);
  assert.deepEqual([...chordInfo('Cadd9').tones],[0,4,7,2]);
  assert.equal(chordInfo('C/E').bass,PC.E);
});

test('chordInfo: 未対応品質・不正ルートを拒否',()=>{
  assert.equal(chordInfo('C9'),null);
  assert.equal(chordInfo('H'),null);
  assert.equal(chordInfo('C/H'),null);
});

test('transposeForCapo: 0、通常値、1周、1周超を処理',()=>{
  assert.equal(transposeForCapo('Cmaj7',0),'Cmaj7');
  assert.equal(transposeForCapo('C',1),'B');
  assert.equal(transposeForCapo('C',7),'F');
  assert.equal(transposeForCapo('F#m7',12),'F#m7');
  assert.equal(transposeForCapo('C',13),'B');
});
