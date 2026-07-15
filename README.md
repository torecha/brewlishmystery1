# Brewlish Mystery — 潮騒館の最後の編集

10日間で真相へ到達する、資料探索型のデジタル本格ミステリーです。GitHub Pagesへそのまま公開できる静的サイトとして、作品トップ、Day1〜Day10、BrewPhone、12の架空Webサイト、事件設計書、画像生成プロンプト、検証ツールを収録しています。

## 作品を始める

- 作品トップ: `/`
- BrewPhone: `/brewphone/`
- Dayサイト: `/day01/`〜`/day10/`

プレイヤーはDayサイトで物語と探索を進め、「今日の問い」に正解します。表示された Today's Brew Code をBrewPhoneへ入力すると、そのDayのメール、写真、音声、事情聴取、Web閲覧履歴などが解放されます。

## 収録内容

- Day1〜Day10の独立ページと共通描画エンジン
- 17アプリ・63資料を持つBrewPhone
- Access Code、未読、検索、証拠ボード、自由編集型捜査ノート
- Day4・Day6・Day8・Day9の緊急通知、画面揺れ、対応端末の振動
- 新聞、資料館、企業、個人ブログ、交通、行政記録、技術フォーラム等12サイト・63ページ
- 事件の完全設計、時系列、証拠台帳、伏線回収表、Day別公開表
- 68点分の画像固定設定、完成プロンプト、修正プロンプト、保存先
- GitHub Pages公開手順と自動検証

## 画像について

配置済み画像は1点です。残り67点は [画像生成プロンプト](docs/brewlish-image-generation-prompts.md) と [画像制作ワークフロー](docs/image-production-workflow.md) に従って生成し、指定名・指定フォルダへ保存してください。HTML、CSS、JavaScriptの修正は不要です。

未配置の間もファイル名付きの仮枠が表示され、本文、探索、回答、BrewPhone、最終解決まで停止せず動作します。

## GitHub Pagesで公開する

1. このフォルダの**中身**を1つのGitHubリポジトリ直下へアップロードします。
2. GitHubの `Settings` → `Pages` を開きます。
3. Sourceを `Deploy from a branch`、Branchを `main`、Folderを `/ (root)` に設定します。
4. 公開URLの `/`、`/brewphone/`、`/day01/` を確認します。

詳しくは [GitHub公開手順](docs/github-publish-guide.md) を参照してください。

## 検証

外部ライブラリなしの静的検証:

```bash
python tools/validate_repository.py
```

期待結果:

```text
Summary: 12 pass groups, 0 warnings, 0 failures
```

PlaywrightとChromiumが利用できる環境では、ルート、全Day、BrewPhone、全架空サイトの操作・レスポンシブ確認も実行できます。

```bash
node tools/visual_qa.js
```

## 技術仕様

- HTML / CSS / JavaScript / JSONのみ
- ビルド、外部サーバー、外部フォント、外部CDN不要
- 相対パスのみ使用
- localStorageへ進行、既読、イベント、ノートを保存
- スマートフォン優先、PC対応
- `prefers-reduced-motion` 対応
- 画像欠落時の自動フォールバック

## ネタバレ文書

`docs/brewlish-mystery-master-design.md`、`docs/access-codes.md`、各種検証報告は制作・運用者向けで、犯人、真相、Access Codeを含みます。プレイヤーへリポジトリ内部を見せたくない場合は、公開ブランチから制作文書だけを除外して別途保管してください。静的サイトの性質上、ブラウザ内のデータを技術的に完全秘匿することはできません。
