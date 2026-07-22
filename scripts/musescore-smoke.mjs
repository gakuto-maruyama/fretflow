import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createMusicXml} from '../js/exporters.js';

const defaultWindowsPath='C:\\Program Files\\MuseScore 4\\bin\\MuseScore4.exe';
const executable=process.env.MUSESCORE_PATH||defaultWindowsPath;
assert.ok(existsSync(executable),`MuseScore 4 が見つかりません: ${executable}\nMUSESCORE_PATH で実行ファイルを指定してください。`);

const keepOutput=process.argv.includes('--keep-output');
const outputDir=keepOutput
  ?resolve('test-output','musescore-smoke')
  :mkdtempSync(resolve(tmpdir(),'fretflow-musescore-'));
if(keepOutput){
  rmSync(outputDir,{recursive:true,force:true});
  mkdirSync(outputDir,{recursive:true});
}

const sourceDir=resolve(outputDir,'source');
const resultDir=resolve(outputDir,'result');
mkdirSync(sourceDir,{recursive:true});
mkdirSync(resultDir,{recursive:true});
const inputPath=resolve(sourceDir,'fretflow.musicxml');
const scorePath=resolve(resultDir,'imported.mscz');
const imageRequestPath=resolve(resultDir,'preview.png');
const imagePath=resolve(resultDir,'preview-1.png');
const svgPath=resolve(resultDir,'preview.svg');
const data={
  names:['C','G'],
  path:[{frets:[-1,3,2,0,1,0]},{frets:[3,2,0,0,0,3]}],
  capo:2
};
writeFileSync(inputPath,createMusicXml(data),'utf8');

function convert(input,output,generated=output){
  const result=spawnSync(executable,['--force','-o',output,input],{
    encoding:'utf8',timeout:60000,windowsHide:true
  });
  assert.equal(result.error,undefined,result.error?.message);
  assert.equal(result.status,0,`MuseScore 4 の変換に失敗しました。\n${result.stderr||result.stdout}`);
  assert.ok(existsSync(generated),`MuseScore 4 が ${generated} を生成しませんでした。`);
}

try{
  convert(inputPath,scorePath);
  const unpacked=spawnSync('tar',['-xOf',scorePath,'imported.mscx'],{encoding:'utf8',timeout:10000,windowsHide:true});
  assert.equal(unpacked.error,undefined,unpacked.error?.message);
  assert.equal(unpacked.status,0,`MSCZ内部の検査に失敗しました。\n${unpacked.stderr||unpacked.stdout}`);
  const imported=unpacked.stdout;
  assert.match(imported,/<Instrument id="guitar-nylon">/);
  assert.match(imported,/<instrumentId>pluck\.guitar\.nylon-string<\/instrumentId>/);
  assert.match(imported,/<minPitchP>40<\/minPitchP>/);
  assert.match(imported,/<maxPitchP>83<\/maxPitchP>/);
  assert.doesNotMatch(imported,/<Instrument id="(?:soprano-guitar|cavaquinho)">/);
  convert(scorePath,imageRequestPath,imagePath);
  convert(scorePath,svgPath);
  const rendered=readFileSync(svgPath,'utf8');
  assert.ok(readFileSync(scorePath).length>0);
  assert.doesNotMatch(rendered,/(?:#ff0000|#FF0000|rgb\(255,\s*0,\s*0\))/);
  console.log(`MuseScore 4 でMusicXMLの読み込みとMSCZ/PNG/SVG変換に成功: ${outputDir}`);
}finally{
  if(!keepOutput)rmSync(outputDir,{recursive:true,force:true});
}
