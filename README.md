# upnote-mcp

`upnote-mcp` is a read-only MCP server for reading local UpNote data from SQLite over stdio.

This is an unofficial project and is not affiliated with, endorsed by, or maintained by UpNote.

## Features

- `search_notes`: search notes by title, body text, or summary
- `open_note`: open a note in the UpNote app by note ID
- `get_note`: fetch the full contents of a note by note ID
- `open_notebook`: open a notebook in the UpNote app by notebook ID
- `list_notebooks`: list notebooks with note counts
- `create_note`: create a new note through UpNote's official URL scheme
- `list_tags`: list tags
- `search_by_tag`: list notes for a tag

This project is intentionally read-only. It does not write to the UpNote database.
Safe note creation and open actions are performed through UpNote's official URL scheme instead of direct database writes.

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

## Install

```bash
bun install
```

## Run

```bash
bun run start
```

For normal use, prefer the published package:

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
- may open the UpNote app for `open_note`, `open_notebook`, or `create_note`

If you deny these permissions, note search and retrieval will not work. After granting access, you may need to restart the MCP server in Cursor or Claude Desktop.

## MCP Config Example

### Recommended: published package

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

### Local development checkout

#### Cursor

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

#### Claude Desktop

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

## Example Workflows

Try prompts like:

- `Search UpNote for "travel" and show me the first result`
- `List my UpNote tags and open the note that matches the tag "meeting"`
- `Find notes about "launch", summarize them, and create a new UpNote note with the summary`
- `List notebooks and open the one named "Research"`

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

### `open_note`

Input:

```json
{
  "id": "019fd239-a98a-742b-b75b-cee66e7aa830"
}
```

### `open_notebook`

Input:

```json
{
  "id": "3f03c742-1270-4d35-a5bc-c7d98580d6fc"
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

### `create_note`

Input:

```json
{
  "title": "Meeting Notes",
  "text": "# Summary\n\nDraft created by MCP.",
  "markdown": true,
  "newWindow": false
}
```

## Verification

```bash
bun run check
bun run smoke
```

## Japanese README

The previous Japanese README is available at `README_ja.md`.
