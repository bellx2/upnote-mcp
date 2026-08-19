# upnote-mcp

`upnote-mcp` is a read-only MCP server for reading local UpNote data from SQLite over stdio.

This is an unofficial project and is not affiliated with, endorsed by, or maintained by UpNote.

## Features

- `search_notes`: search notes by title, body text, or summary
- `list_recent_notes`: list the most recently updated notes
- `list_notes_this_week`: list notes updated during the current week
- `list_notes_this_month`: list notes updated during the current month
- `find_notes`: combine period, keyword, and tag filters in one call
- `find_and_open_note`: find matching notes and open the most recent match in UpNote
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

## Install via MCP Bundle (`.mcpb`)

For Claude Desktop on macOS, you can also install a prebuilt MCP Bundle instead of running `bunx`.

An `.mcpb` file is a zip archive containing a standalone MCP server and a `manifest.json`. Claude Desktop can install it with a double click, similar to a browser extension.

### Download

Tagged releases include an `.mcpb` asset on [GitHub Releases](https://github.com/bellx2/upnote-mcp/releases).

Example file name:

```text
upnote-mcp-0.2.6.mcpb
```

### Install in Claude Desktop

1. Download the `.mcpb` file from GitHub Releases
2. Double-click the file
3. Follow the Claude Desktop installation dialog
4. Optionally set the UpNote database path during setup. The default path works for the standard UpNote desktop app location

The bundle includes a compiled macOS binary, so Bun is not required for this install path.

### Build locally

To rebuild the bundle from source:

```bash
bun run build:mcpb
```

This creates `dist/upnote-mcp.mcpb`.

Release builds run on GitHub Actions (`macos-latest`) and are attached automatically when a `v*` tag is pushed.

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

##### Option 1: MCP Bundle (recommended)

Download and install the `.mcpb` file from [GitHub Releases](https://github.com/bellx2/upnote-mcp/releases). No manual JSON editing is required.

##### Option 2: published package

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
      "command": "/absolute/path/to/bun",
      "args": ["run", "/absolute/path/to/upnote-mcp/src/index.ts"]
    }
  }
}
```

#### Claude Desktop

```json
{
  "mcpServers": {
    "upnote": {
      "command": "/absolute/path/to/bun",
      "args": ["run", "/absolute/path/to/upnote-mcp/src/index.ts"]
    }
  }
}
```

## Example Workflows

Try prompts like:

- `Search UpNote for "travel" and show me the first result`
- `Show me my 10 most recent UpNote notes`
- `Show me this week's notes`
- `Show me this month's notes`
- `Find this week's AI notes`
- `Open this week's AI note`
- `Find this month's notes tagged meeting`
- `Open the latest note tagged meeting`
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

### `list_recent_notes`

Input:

```json
{
  "limit": 10
}
```

### `list_notes_this_week`

Input:

```json
{
  "limit": 20
}
```

### `list_notes_this_month`

Input:

```json
{
  "limit": 20
}
```

### `find_notes`

Input:

```json
{
  "period": "this_week",
  "query": "AI",
  "limit": 10
}
```

Or:

```json
{
  "period": "this_month",
  "tag": "meeting",
  "limit": 10
}
```

### `find_and_open_note`

Input:

```json
{
  "period": "this_week",
  "query": "AI",
  "limit": 10
}
```

Or:

```json
{
  "period": "recent",
  "tag": "meeting",
  "limit": 10
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
bun run build:mcpb
```

## Japanese README

The previous Japanese README is available at `README_ja.md`.
