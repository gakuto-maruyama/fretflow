# FretFlow

コード進行全体の指の移動量を動的計画法で最小化し、弾きやすいギターTAB譜を生成するブラウザアプリです。

## 起動

`index.html` をブラウザで開くだけで動作します。ローカルサーバーを使う場合：

```powershell
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いてください。

## 入力例

- `FGEmAm`（スペースなし）
- `F G Em Am`
- `Dm7 | G7 | Cmaj7 | A7`

入力全体を検証し、対応していないコードや文字が含まれる場合はエラーを表示します。対応コードは画面内の「対応コード一覧」で確認できます。

## ファイル構成

- `app.js`: 画面描画とイベント制御
- `js/music-data.js`: 音名、コード種別、基本フォーム
- `js/chords.js`: コード進行の検証、コード構成音、カポ移調
- `js/voicings.js`: 運指候補の生成と進行全体の最適化
- `js/exporters.js`: MIDI / MusicXML の生成
- `js/score-renderer.js`: HTML/CSSによる五線譜・TAB譜の描画座標と描画処理

## テスト

Node.js 18以降で、追加パッケージなしに実行できます。

```powershell
npm test
```

MuseScore 4 でMusicXMLを実際に読み込み、MSCZ、PNG、SVGへ変換できることは次で確認できます。SVGに赤色の音符が含まれないことも自動確認します。Windowsの標準インストール先以外では `MUSESCORE_PATH` を指定してください。

```powershell
npm run test:musescore
$env:MUSESCORE_PATH='D:\\Apps\\MuseScore 4\\bin\\MuseScore4.exe'; npm run test:musescore
```

目視確認用のPNG、SVG、MSCZを `test-output/musescore-smoke/` に残す場合は次を実行します。

```powershell
npm run test:musescore:visual
```

構文検査を含む一括確認は `npm run check`、開発中の継続実行は `npm run test:watch` を使用します。テストは `test/` に機能別に配置し、公開関数の正常系・異常系・境界値を入出力で検証します。仕様追加や不具合修正では、実装と同じコミットに回帰テストを追加してください。

フォーム（自動・開放弦あり・セーハーのみ）、難易度、ポジション、カポを設定できます。標準チューニング E A D G B E を前提としています。
