# upnote-mcp

`upnote-mcp` is a read-only MCP server for reading local UpNote data from SQLite over stdio.

This is an unofficial project and is not affiliated with, endorsed by, or maintained by UpNote.

## Features

- `search_notes`: search notes by title, body text, or summary
- `get_note`: fetch the full contents of a note by note ID
- `list_notebooks`: list notebooks with note counts
- `list_tags`: list tags
- `search_by_tag`: list notes for a tag

This project is intentionally read-only. It does not write to the UpNote database.

## Package Name

This package is prepared to be published as `@bellx2/upnote-mcp`.

## Requirements

- `macOS`
- `bun` installed on the machine that runs the server
- UpNote desktop app installed
- Default UpNote database path:

```text
~/Library/Containers/com.getupnote.desktop/Data/Library/Application Support/UpNote/upnote.sqlite3
```

If your database lives somewhere else, set `UPNOTE_DB`.

## Setup

```bash
bun install
```

## Run

```bash
bun run start
```

You can also run the published package through:

```bash
bunx @bellx2/upnote-mcp
```

or:

```bash
npx @bellx2/upnote-mcp
```

`npx` support still depends on `bun` being installed, because this package uses Bun-specific APIs such as `bun:sqlite`.

For development with file watching:

```bash
bun run dev
```

## Environment Variables

- `UPNOTE_DB`: absolute path to `upnote.sqlite3`

Example:

```bash
export UPNOTE_DB="$HOME/Library/Containers/com.getupnote.desktop/Data/Library/Application Support/UpNote/upnote.sqlite3"
```

## Permissions

On first run, your MCP client may show permission prompts for command execution and local file access.

This is expected because the server:

- launches through `bun`
- reads your local UpNote SQLite database

If you deny these permissions, note search and retrieval will not work. After granting access, you may need to restart the MCP server in Cursor or Claude Desktop.

## MCP Config Example

### Cursor

```json
{
  "mcpServers": {
    "upnote": {
      "command": "/Users/bell/.local/share/mise/installs/bun/latest/bin/bun",
      "args": ["run", "/Users/bell/dev/t7b/upnote_mcp/src/index.ts"]
    }
  }
}
```

### Claude Desktop

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

### Cursor (published package)

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

### Claude Desktop (published package)

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

## Tool Reference

### `search_notes`

Input:

```json
{
  "query": "travel",
  "limit": 5
}
```

### `get_note`

Input:

```json
{
  "id": "019fd239-a98a-742b-b75b-cee66e7aa830"
}
```

### `list_notebooks`

Input:

```json
{}
```

### `list_tags`

Input:

```json
{}
```

### `search_by_tag`

Input:

```json
{
  "tag": "meeting",
  "limit": 5
}
```

## Verification

```bash
bun run check
bun run smoke
```

## Publishing

```bash
npm publish
```

Make sure the `@bellx2` scope is available in your npm account before publishing.

## Japanese README

The previous Japanese README is available at `README_ja.md`.
