#!/usr/bin/env bun
import { $ } from "bun";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createNoteUrl,
  noteUrl,
  notebookUrl,
  tagUrl,
  UpNoteRepository,
  type CreateNoteParams,
  type NotebookResult,
  type TagResult,
} from "./upnote";

const repository = new UpNoteRepository();

function formatSearchResults(query: string, notes: ReturnType<UpNoteRepository["searchNotes"]>): string {
  if (notes.length === 0) {
    return `No notes matched query="${query}".`;
  }

  return [
    `Search results for query="${query}": ${notes.length} item(s)`,
    ...notes.map((note, index) =>
      [
        `${index + 1}. ${note.title}`,
        `id: ${note.id}`,
        `url: ${noteUrl(note.id)}`,
        `updatedAt: ${note.updatedAt ?? "unknown"}`,
        note.preview ? `preview: ${note.preview}` : "preview: none",
      ].join("\n"),
    ),
  ].join("\n\n");
}

function formatNotebooks(notebooks: NotebookResult[]): string {
  if (notebooks.length === 0) {
    return "No notebooks were found.";
  }
  return [
    `Notebook list: ${notebooks.length} item(s)`,
    ...notebooks.map((nb) =>
      [
        `- ${nb.title}`,
        `  id: ${nb.id}`,
        `  url: ${notebookUrl(nb.id)}`,
        `  noteCount: ${nb.noteCount}`,
        nb.parent ? `  parent: ${nb.parent}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ].join("\n");
}

function formatTags(tags: TagResult[]): string {
  if (tags.length === 0) {
    return "No tags were found.";
  }
  return [
    `Tag list: ${tags.length} item(s)`,
    ...tags.map((tag) => `- ${tag.title}  (id: ${tag.id})  url: ${tagUrl(tag.title)}`),
  ].join("\n");
}

function formatNoteDetail(note: ReturnType<UpNoteRepository["getNote"]>): string {
  return [
    `title: ${note.title}`,
    `id: ${note.id}`,
    `url: ${note.url}`,
    `updatedAt: ${note.updatedAt ?? "unknown"}`,
    `createdAt: ${note.createdAt ?? "unknown"}`,
    "",
    note.content || "(no content)",
  ].join("\n");
}

async function openUpNoteUrl(url: string): Promise<void> {
  await $`open ${url}`.quiet();
}

function formatOpenResult(label: string, url: string): string {
  return [`Opened ${label} in UpNote.`, `url: ${url}`].join("\n");
}

function formatCreateResult(url: string): string {
  return [`Created a note in UpNote using the official URL scheme.`, `url: ${url}`].join("\n");
}

async function main(): Promise<void> {
  const server = new McpServer({
    name: "upnote-reader",
    version: "0.1.0",
  });

  server.registerTool(
    "search_notes",
    {
      description: [
        "Search UpNote notes by keyword across title, body text, and summary.",
        "Use this when you want to find notes by a word or phrase.",
        "Use search_by_tag instead when you want tag-based filtering.",
        "Results include note IDs. Call get_note with a returned ID when you need the full note body.",
        "If limit is omitted, 10 results are returned.",
      ].join(" "),
      inputSchema: {
        query: z.string().min(1).describe("Search keyword or phrase"),
        limit: z.number().int().min(1).max(50).optional().describe("Maximum number of results. Defaults to 10"),
      },
    },
    async ({ query, limit }) => {
      const notes = repository.searchNotes({ query, limit });

      return {
        content: [
          {
            type: "text",
            text: formatSearchResults(query, notes),
          },
        ],
        structuredContent: {
          query,
          count: notes.length,
          notes,
          dbPath: repository.getResolvedDbPath(),
        },
      };
    },
  );

  server.registerTool(
    "open_note",
    {
      description: [
        "Open an existing UpNote note in the UpNote desktop app by note ID.",
        "Use an ID returned from search_notes or search_by_tag.",
        "This launches UpNote through the official URL scheme.",
      ].join(" "),
      inputSchema: {
        id: z.string().min(1).describe("Note ID returned by search_notes or search_by_tag"),
      },
    },
    async ({ id }) => {
      const url = noteUrl(id);
      await openUpNoteUrl(url);

      return {
        content: [{ type: "text", text: formatOpenResult(`note ${id}`, url) }],
        structuredContent: {
          id,
          url,
          executed: true,
        },
      };
    },
  );

  server.registerTool(
    "get_note",
    {
      description: [
        "Fetch the full contents of a specific UpNote note by note ID.",
        "Use an ID returned from search_notes or search_by_tag.",
        "If you do not know the ID yet, call search_notes or search_by_tag first.",
        "Returns title, plain text body, HTML, summary, timestamps, and an UpNote deep link.",
      ].join(" "),
      inputSchema: {
        id: z.string().min(1).describe("Note ID returned by search_notes or search_by_tag"),
      },
    },
    async ({ id }) => {
      const note = repository.getNote(id);

      return {
        content: [
          {
            type: "text",
            text: formatNoteDetail(note),
          },
        ],
        structuredContent: {
          note,
          dbPath: repository.getResolvedDbPath(),
        },
      };
    },
  );

  server.registerTool(
    "open_notebook",
    {
      description: [
        "Open an existing UpNote notebook in the UpNote desktop app by notebook ID.",
        "Use an ID returned from list_notebooks.",
        "This launches UpNote through the official URL scheme.",
      ].join(" "),
      inputSchema: {
        id: z.string().min(1).describe("Notebook ID returned by list_notebooks"),
      },
    },
    async ({ id }) => {
      const url = notebookUrl(id);
      await openUpNoteUrl(url);

      return {
        content: [{ type: "text", text: formatOpenResult(`notebook ${id}`, url) }],
        structuredContent: {
          id,
          url,
          executed: true,
        },
      };
    },
  );

  server.registerTool(
    "list_notebooks",
    {
      description: [
        "List notebooks available in UpNote with notebook name, ID, note count, and deep link.",
        "Use this first when you need to discover what notebooks exist.",
        "If you want notes from a specific notebook, use the notebook name in a follow-up search_notes query.",
      ].join(" "),
      inputSchema: {},
    },
    async () => {
      const notebooks = repository.listNotebooks();
      return {
        content: [{ type: "text", text: formatNotebooks(notebooks) }],
        structuredContent: {
          count: notebooks.length,
          notebooks,
          dbPath: repository.getResolvedDbPath(),
        },
      };
    },
  );

  server.registerTool(
    "create_note",
    {
      description: [
        "Create a new UpNote note through the official URL scheme.",
        "Use this when you want to save generated text or draft content into UpNote safely without writing to the SQLite database directly.",
        "At least one of title or text must be provided.",
      ].join(" "),
      inputSchema: {
        title: z.string().optional().describe("Optional note title"),
        text: z.string().optional().describe("Optional note body text"),
        notebook: z.string().optional().describe("Optional target notebook name"),
        markdown: z.boolean().optional().describe("Whether the text should be treated as Markdown. Defaults to true"),
        newWindow: z.boolean().optional().describe("Whether UpNote should open the note in a new window. Defaults to false"),
      },
    },
    async ({ title, text, notebook, markdown, newWindow }) => {
      if (!title && !text) {
        throw new Error("create_note requires at least one of title or text.");
      }

      const params: CreateNoteParams = {
        title,
        text,
        notebook,
        markdown: markdown ?? true,
        newWindow: newWindow ?? false,
      };
      const url = createNoteUrl(params);
      await openUpNoteUrl(url);

      return {
        content: [{ type: "text", text: formatCreateResult(url) }],
        structuredContent: {
          url,
          executed: true,
          params,
        },
      };
    },
  );

  server.registerTool(
    "list_tags",
    {
      description: [
        "List tags available in UpNote with tag name, ID, and deep link.",
        "Use this when you need to discover tag names or confirm tag spelling.",
        "Once you know the tag name, call search_by_tag to fetch notes for that tag.",
      ].join(" "),
      inputSchema: {},
    },
    async () => {
      const tags = repository.listTags();
      return {
        content: [{ type: "text", text: formatTags(tags) }],
        structuredContent: {
          count: tags.length,
          tags,
          dbPath: repository.getResolvedDbPath(),
        },
      };
    },
  );

  server.registerTool(
    "search_by_tag",
    {
      description: [
        "List notes that have a specific UpNote tag.",
        "The tag works with or without a leading # character.",
        "If you do not know the tag name yet, call list_tags first.",
        "Results include note IDs. Call get_note with a returned ID when you need the full note body.",
        "Use search_notes instead when you want keyword-based search rather than tag filtering.",
      ].join(" "),
      inputSchema: {
        tag: z.string().min(1).describe("Tag name, with or without #"),
        limit: z.number().int().min(1).max(50).optional().describe("Maximum number of results. Defaults to 10"),
      },
    },
    async ({ tag, limit }) => {
      const notes = repository.searchByTag(tag, limit);
      return {
        content: [
          {
            type: "text",
            text: notes.length === 0
              ? `No notes were found for tag "${tag}".`
              : formatSearchResults(tag, notes),
          },
        ],
        structuredContent: {
          tag,
          count: notes.length,
          notes,
          dbPath: repository.getResolvedDbPath(),
        },
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("An error occurred in the UpNote MCP server.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
