import test from 'node:test';
import assert from 'node:assert/strict';
import {chordInfo} from '../js/chords.js';
import {barreCandidates,candidates,localCost,optimize,transition,validVoicing} from '../js/voicings.js';

const AUTO={form:'auto',difficulty:'easy',position:'auto'};

test('validVoicing: 構成音・最低音数・ルートを検証',()=>{
  const c=chordInfo('C');
  assert.equal(validVoicing(c,[-1,3,2,0,1,0]),true);
  assert.equal(validVoicing(c,[-1,-1,-1,0,1,0]),false);
  assert.equal(validVoicing(c,[0,2,2,1,0,0]),false);
});

test('barreCandidates: 1〜12フレット内の候補だけを返す',()=>{
  const result=barreCandidates(chordInfo('F'));
  assert.ok(result.length>0);
  assert.ok(result.every(item=>item.base>=1&&item.base<=12));
});

test('candidates: フォーム設定を反映',()=>{
  assert.ok(candidates(chordInfo('C'),AUTO).some(item=>item.type==='オープン'));
  assert.ok(candidates(chordInfo('C'),{...AUTO,form:'barre'}).every(item=>item.type==='セーハー'));
  assert.ok(candidates(chordInfo('C'),{...AUTO,form:'open'}).every(item=>item.type!=='セーハー'));
});

test('localCost: 難易度・ポジション・フォーム選好をコスト化',()=>{
  const barre={frets:[1,3,3,2,1,1],type:'セーハー'};
  const open={frets:[-1,3,2,0,1,0],type:'オープン'};
  assert.ok(localCost(barre,{...AUTO,difficulty:'easy'})>localCost(barre,{...AUTO,difficulty:'advanced'}));
  assert.ok(localCost(barre,{...AUTO,position:'low'})>localCost(barre,AUTO));
  assert.ok(localCost(open,{...AUTO,form:'open'})<localCost(open,AUTO));
});

test('transition: 同一運指は0、移動量は対称',()=>{
  const a={frets:[-1,3,2,0,1,0]},b={frets:[3,2,0,0,0,3]};
  assert.equal(transition(a,a),0);
  assert.equal(transition(a,b),transition(b,a));
  assert.ok(transition(a,b)>0);
});

test('optimize: 進行全体と単一コードを最適化',()=>{
  const progression=['F','G','Em','Am'].map(chordInfo),result=optimize(progression,AUTO);
  assert.equal(result.path.length,4);
  assert.ok(Number.isFinite(result.cost));
  assert.equal(optimize([chordInfo('C')],AUTO).path.length,1);
});

test('optimize: 空配列と候補なしをエラー化',()=>{
  assert.ok(optimize([],AUTO).error);
  assert.ok(optimize([{name:'X',root:0,q:'',tones:new Set()}],AUTO).error);
});
