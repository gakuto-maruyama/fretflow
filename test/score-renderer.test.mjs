import test from 'node:test';
import assert from 'node:assert/strict';
import {pitchLayout,scoreDimensions,scoreLayout} from '../js/score-renderer.js';

test('pitchLayout: 五線譜の位置を音名単位で配置する',()=>{
  assert.deepEqual(pitchLayout(52),{step:0,accidental:''}); // 実音E3: 記譜上のE4（第1線）
  assert.deepEqual(pitchLayout(53),{step:1,accidental:''}); // 実音F3: 第1間
  assert.deepEqual(pitchLayout(54),{step:1,accidental:'♯'}); // F#3: Fと同位置
  assert.deepEqual(pitchLayout(55),{step:2,accidental:''}); // 実音G3: 第2線
  assert.deepEqual(pitchLayout(48),{step:-2,accidental:''}); // 実音C3: 下第1加線
});

test('scoreDimensions: 0件、1件、複数件で描画領域を確保する',()=>{
  assert.deepEqual(scoreDimensions(0),{width:520,height:290});
  assert.deepEqual(scoreDimensions(1),{width:520,height:290});
  assert.deepEqual(scoreDimensions(5),{width:640,height:290});
});

test('scoreLayout: HTML描画用の五線とTAB六線を常に生成する',()=>{
  const layout=scoreLayout(['C'],[{frets:[-1,3,2,0,1,0]}],0);
  assert.deepEqual(layout.staffLines,[55,65,75,85,95]);
  assert.deepEqual(layout.tabLines,[167,181,195,209,223,237]);
  assert.equal(layout.measures.length,1);
  assert.equal(layout.measures[0].notes.length,5);
});
