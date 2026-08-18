---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

---

# Project-Specific Guidance (upnote-mcp)

## Overview

This project is a server that reads the local SQLite database used by the UpNote desktop app and exposes note search and retrieval over MCP (`stdio`). It is **strictly read-only** and must never write to the UpNote database (`Database` is opened with `readonly: true, create: false`). Do not introduce changes that break this constraint.

## Commands

```bash
bun install          # Install dependencies
bun run start        # Start the MCP server over stdio
bun run dev          # Start with --watch
bun run check        # Run tsc --noEmit; this is the main verification gate
bun run smoke        # Execute repository methods via scripts/smoke.ts
```

- There is no automated `bun test` suite. Validate changes with `bun run check` and `bun run smoke`.
- `bun run smoke` requires a real UpNote database and currently uses hard-coded Japanese sample queries (`会議`, `名古屋`). The output depends on the user's real notes, so treat it as a manual smoke check rather than a pass/fail test. If you only want one case, trim the `run(...)` calls in [scripts/smoke.ts](scripts/smoke.ts).

## Architecture

Keep a strict two-layer boundary.

- [src/upnote.ts](src/upnote.ts) — `UpNoteRepository`. This is the only place that may touch SQL or `bun:sqlite`. Database path resolution, soft-delete filtering, and timestamp conversion also belong here.
- [src/index.ts](src/index.ts) — MCP server wiring (`registerTool`) and user-facing formatting helpers only. Do not write SQL here.

When adding a feature, always follow this sequence: add a method to `UpNoteRepository`, then register a tool in `src/index.ts`.

## UpNote Database Facts

These are observed facts about the UpNote database and cannot be derived from files in this repository. They are required context when writing SQL.

- Tables in use: `notes`, `notebooks`, `tags`, `organizers`
- Always apply soft-delete filters. Use `deleted = 0 AND trashed = 0` for `notes`, and `deleted = 0 AND inactive = 0` for `notebooks` and `tags`
- `notes.tagLinks` is a JSON array containing tag **titles**, not tag IDs. Expand it with `json_each(tagLinks)` when matching. This is why `searchByTag` strips a leading `#` before matching the title
- Notebook-to-note relationships are resolved via `organizers.notebookId` and `organizers.noteId`
- Timestamps are millisecond epoch integers and must be converted to ISO strings through `formatTimestamp`

## Implementation Rules

- Search uses a simple `LIKE %query%` strategy across `title`, `text`, and `summary`. FTS is not used
- Clamp `limit` to `1..50` in both zod schemas and repository methods; do not rely on only one side
- Every tool should return `structuredContent` and include `dbPath`
- This project is intended for a global audience, so user-facing strings, tool descriptions, errors, and the main README should be written in English
- Commit messages should also be written in English
- Use `UPNOTE_DB` when provided; otherwise fall back to `~/Library/Containers/com.getupnote.desktop/Data/Library/Application Support/UpNote/upnote.sqlite3`

## Repository Notes

- `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc` is a **symbolic link to this file (`CLAUDE.md`)**. Cursor reads the same content through that path. Do not remove or replace the Bun section at the top, or the Cursor rule will break
- The YAML frontmatter at the top of this file (`description`, `globs`, `alwaysApply`) is used by Cursor MDC and must remain at the very beginning of the file
- `.cursor/rules/` contains only that symlink. There are no separate Cursor rules in this repository, and there is no `.github/copilot-instructions.md`
