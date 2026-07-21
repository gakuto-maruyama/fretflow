export const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export const NOTE_LABELS = ['C','C# / Db','D','D# / Eb','E','F','F# / Gb','G','G# / Ab','A','A# / Bb','B'];
export const CHORD_TYPES = [
  {suffix:'',label:'メジャー'}, {suffix:'m',label:'マイナー'}, {suffix:'7',label:'セブンス'},
  {suffix:'m7',label:'マイナーセブンス'}, {suffix:'maj7',label:'メジャーセブンス'},
  {suffix:'sus2',label:'サスツー'}, {suffix:'sus4',label:'サスフォー'}, {suffix:'add9',label:'アドナインス'},
  {suffix:'dim',label:'ディミニッシュ'}, {suffix:'dim7',label:'ディミニッシュセブンス'},
  {suffix:'aug',label:'オーギュメント'}, {suffix:'m7b5',label:'マイナーセブンフラットファイブ'}
];
export const OPEN = [40,45,50,55,59,64];
export const PC = Object.assign(Object.fromEntries(NOTES.map((note,index)=>[note,index])),{
  Db:1,Eb:3,Gb:6,Ab:8,Bb:10,'B#':0,'E#':5,Cb:11,Fb:4
});
export const OPEN_SHAPES = {
  C:[-1,3,2,0,1,0], D:[-1,-1,0,2,3,2], E:[0,2,2,1,0,0], F:[-1,-1,3,2,1,1],
  G:[3,2,0,0,0,3], A:[-1,0,2,2,2,0], B:[-1,2,4,4,4,2],
  Cm:[-1,3,5,5,4,3], Dm:[-1,-1,0,2,3,1], Em:[0,2,2,0,0,0], Fm:[1,3,3,1,1,1],
  Gm:[3,5,5,3,3,3], Am:[-1,0,2,2,1,0], Bm:[-1,2,4,4,3,2],
  C7:[-1,3,2,3,1,0], D7:[-1,-1,0,2,1,2], E7:[0,2,0,1,0,0], F7:[1,3,1,2,1,1],
  G7:[3,2,0,0,0,1], A7:[-1,0,2,0,2,0], B7:[-1,2,1,2,0,2],
  Cmaj7:[-1,3,2,0,0,0],Dmaj7:[-1,-1,0,2,2,2],Emaj7:[0,2,1,1,0,0],Fmaj7:[-1,-1,3,2,1,0],
  Gmaj7:[3,2,0,0,0,2],Amaj7:[-1,0,2,1,2,0],Cadd9:[-1,3,2,0,3,0],Dsus4:[-1,-1,0,2,3,3],Asus4:[-1,0,2,2,3,0],
  Bm7b5:[-1,2,3,2,3,-1], Em7b5:[0,1,0,0,3,0], Am7b5:[-1,0,1,0,1,-1], Dm7b5:[-1,-1,0,1,1,1]
};
