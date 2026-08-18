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

## 環境変数

- `UPNOTE_DB`: `upnote.sqlite3` の絶対パス

例:

```bash
export UPNOTE_DB="$HOME/Library/Containers/com.getupnote.desktop/Data/Library/Application Support/UpNote/upnote.sqlite3"
```

## Cursor の MCP 設定例

```json
{
  "mcpServers": {
    "upnote": {
      "command": "bun",
      "args": ["run", "/Users/bell/dev/t7b/upnote_mcp/src/index.ts"],
      "env": {
        "UPNOTE_DB": "/Users/bell/Library/Containers/com.getupnote.desktop/Data/Library/Application Support/UpNote/upnote.sqlite3"
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
```
