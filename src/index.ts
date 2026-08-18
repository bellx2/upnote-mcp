import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { UpNoteRepository, noteUrl, notebookUrl, tagUrl, type NotebookResult, type TagResult } from "./upnote";

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
