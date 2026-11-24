# EVENT REPORT 作成ツール（GitHub Pages用）

## 公開前の重要事項

このフォルダはGitHub Pages向けの静的ファイル構成です。GitHub Pagesで通常公開すると、サイトはインターネット上で誰でも閲覧できます。リポジトリをPrivateにするだけでは、Pagesサイトは非公開になりません。

GitHub Pages自体の非公開公開はGitHub Enterprise CloudのOrganization向け機能です。一般的な個人アカウントでメンバー限定にしたい場合は、Cloudflare Access等の認証ゲートを前段に設けるか、別の認証付きホスティングを利用してください。

## GitHub Pagesの公開構成

- `index.html`：`/report/` へ移動するトップページ
- `style.css`：共通スタイル
- `report/index.html`：アプリ本体
- `report/app.js`、`caption.js`、`caption.css`
- `report/assets/`：背景動画・プレースホルダー

## 公開手順（公開サイトとして利用する場合）

1. このフォルダの中身をGitHubリポジトリのルートにアップロードします。
2. GitHubリポジトリの Settings → Pages を開きます。
3. Build and deployment の Source を Deploy from a branch にします。
4. Branch を `main`、Folder を `/(root)` にして Save します。
5. 公開後、`https://<ユーザー名>.github.io/<リポジトリ名>/` を開きます。

**注意：上記手順は公開サイトになります。メンバー限定アクセスを実現する手順ではありません。**


### フォント
画面表示と書き出しには Google Fonts の Zen Kaku Gothic New を使用します。初回アクセス時にインターネット接続が必要です。

背景動画は添付された background_v3.mp4 に差し替え済みです。動画に2026が焼き込まれているため年は固定です。
