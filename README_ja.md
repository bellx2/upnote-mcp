# upnote-mcp

`UpNote` のローカルSQLiteを読み取り、MCP経由でノート検索と本文取得を行う `stdio` サーバーです。

これは非公式プロジェクトであり、UpNote とは提携・承認・保守の関係にありません。

## 機能

- `search_notes`: タイトル・本文・要約からノートを検索
- `get_note`: ノートIDを指定して本文を取得

初期版は `read-only` 専用です。UpNoteのDBを書き換えません。

## 前提

- `macOS`
- `UpNote` デスクトップアプリがインストール済み
- 既定のDBパス:

```text
~/Library/Containers/com.getupnote.desktop/Data/Library/Application Support/UpNote/upnote.sqlite3
```

DBパスが異なる場合は `UPNOTE_DB` で上書きできます。

## セットアップ

```bash
bun install
```

## 起動

```bash
bun run start
```

開発時は監視付きで起動できます。

```bash
bun run dev
```

通常利用では公開パッケージを使うのが簡単です。

```bash
bunx @bellx2/upnote-mcp
```

`npx @bellx2/upnote-mcp` も使えますが、`bun:sqlite` など Bun 依存のため、実行環境には Bun が必要です。

## MCP Bundle（`.mcpb`）でのインストール

macOS 版 Claude Desktop では、`bunx` ではなく `.mcpb` からインストールすることもできます。

`.mcpb` は、スタンドアロンの MCP サーバーと `manifest.json` を含む zip アーカイブです。ブラウザ拡張のように、Claude Desktop からダブルクリックでインストールできます。

### ダウンロード

タグ付きリリースごとに `.mcpb` が [GitHub Releases](https://github.com/bellx2/upnote-mcp/releases) に添付されます。

ファイル名の例:

```text
upnote-mcp-0.2.6.mcpb
```

### Claude Desktop へのインストール

1. GitHub Releases から `.mcpb` をダウンロード
2. ファイルをダブルクリック
3. Claude Desktop のインストールダイアログに従う
4. 必要なら UpNote データベースのパスを設定（標準の UpNote デスクトップ版ならデフォルトのままで問題ありません）

バンドルには macOS 用バイナリが同梱されているため、この方法では Bun は不要です。

### ローカルでビルド

```bash
bun run build:mcpb
```

`dist/upnote-mcp.mcpb` が生成されます。

`v*` 形式のタグを push すると、GitHub Actions（`macos-latest`）でビルドされ、Release に自動添付されます。

## 環境変数

- `UPNOTE_DB`: `upnote.sqlite3` の絶対パス

例:

```bash
export UPNOTE_DB="$HOME/Library/Containers/com.getupnote.desktop/Data/Library/Application Support/UpNote/upnote.sqlite3"
```

## 権限

初回起動時に、MCP クライアント側でコマンド実行やローカルファイルアクセスの権限ダイアログが表示されることがあります。

これはこのサーバーが次を行うためで、正常な挙動です。

- `bun` で起動する
- ローカルの UpNote SQLite データベースを読む

この権限を拒否すると、ノート検索や本文取得は動作しません。許可後は、Cursor や Claude Desktop で MCP サーバーを再起動してください。

## MCP 設定例

### 公開パッケージ（Cursor / Claude Desktop）

#### Cursor

```json
{
  "mcpServers": {
    "upnote": {
      "command": "bunx",
      "args": ["@bellx2/upnote-mcp"]
    }
  }
}
```

#### Claude Desktop

##### 方法1: MCP Bundle（推奨）

[GitHub Releases](https://github.com/bellx2/upnote-mcp/releases) から `.mcpb` をダウンロードしてインストールします。JSON を手で編集する必要はありません。

##### 方法2: 公開パッケージ

```json
{
  "mcpServers": {
    "upnote": {
      "command": "bunx",
      "args": ["@bellx2/upnote-mcp"]
    }
  }
}
```

### ローカル開発用（Cursor）

```json
{
  "mcpServers": {
    "upnote": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/upnote-mcp/src/index.ts"],
      "env": {
        "UPNOTE_DB": "/Users/you/Library/Containers/com.getupnote.desktop/Data/Library/Application Support/UpNote/upnote.sqlite3"
      }
    }
  }
}
```

## ツール仕様

### `search_notes`

入力:

```json
{
  "query": "旅行",
  "limit": 5
}
```

### `get_note`

入力:

```json
{
  "id": "019fd239-a98a-742b-b75b-cee66e7aa830"
}
```

## 検証

```bash
bun run check
bun run build:mcpb
```
