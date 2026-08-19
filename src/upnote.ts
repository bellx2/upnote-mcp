import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { Database } from "bun:sqlite";

const DEFAULT_UPNOTE_DB = `${homedir()}/Library/Containers/com.getupnote.desktop/Data/Library/Application Support/UpNote/upnote.sqlite3`;

export type SearchNotesParams = {
  query: string;
  limit?: number;
};

export type SearchNoteResult = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string | null;
  createdAt: string | null;
  url: string;
};

export type NoteDetail = {
  id: string;
  title: string;
  content: string;
  html: string;
  summary: string;
  updatedAt: string | null;
  createdAt: string | null;
  url: string;
};

export type NotebookResult = {
  id: string;
  title: string;
  noteCount: number;
  parent: string | null;
  updatedAt: string | null;
  url: string;
};

export type TagResult = {
  id: string;
  title: string;
  updatedAt: string | null;
  url: string;
};

export type CreateNoteParams = {
  title?: string;
  text?: string;
  notebook?: string;
  markdown?: boolean;
  newWindow?: boolean;
};

export type FindNotesParams = {
  period?: "recent" | "this_week" | "this_month";
  query?: string;
  tag?: string;
  limit?: number;
};

type SearchNoteRow = {
  id: string;
  title: string | null;
  preview: string | null;
  updatedAt: number | null;
  createdAt: number | null;
};

type NotebookRow = {
  id: string;
  title: string | null;
  noteCount: number;
  parent: string | null;
  updatedAt: number | null;
};

type TagRow = {
  id: string;
  title: string | null;
  updatedAt: number | null;
};

type NoteDetailRow = {
  id: string;
  title: string | null;
  text: string | null;
  html: string | null;
  summary: string | null;
  updatedAt: number | null;
  createdAt: number | null;
};

function resolveUpnoteDbPath(): string {
  const configured = process.env.UPNOTE_DB?.trim();
  const raw = configured || DEFAULT_UPNOTE_DB;
  return raw.replaceAll("${HOME}", homedir());
}

function createOpenDbMessage(dbPath: string, error: unknown): string {
  return [
    "Failed to open the UpNote database.",
    `Checked path: ${dbPath}`,
    "If you installed via Claude Desktop, open UpNote MCP settings and choose upnote.sqlite3 with the file picker.",
    "On macOS, Claude Desktop may also need Full Disk Access in System Settings > Privacy & Security.",
    `Details: ${String(error)}`,
  ].join("\n");
}

function formatTimestamp(value: number | null): string | null {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function normalizeMultilineText(value: string | null): string {
  return value?.trim() ?? "";
}

function startOfCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function startOfCurrentMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export function noteUrl(noteId: string): string {
  return `upnote://x-callback-url/openNote?noteId=${encodeURIComponent(noteId)}`;
}

export function notebookUrl(notebookId: string): string {
  return `upnote://x-callback-url/openNotebook?notebookId=${encodeURIComponent(notebookId)}`;
}

export function tagUrl(tagTitle: string): string {
  const tag = tagTitle.replace(/^#/, "");
  return `upnote://x-callback-url/tag/view?tag=${encodeURIComponent(tag)}`;
}

export function createNoteUrl(params: CreateNoteParams): string {
  const searchParams = new URLSearchParams();

  if (params.title) {
    searchParams.set("title", params.title);
  }
  if (params.text) {
    searchParams.set("text", params.text);
  }
  if (params.notebook) {
    searchParams.set("notebook", params.notebook);
  }
  if (params.markdown !== undefined) {
    searchParams.set("markdown", String(params.markdown));
  }
  if (params.newWindow !== undefined) {
    searchParams.set("new_window", String(params.newWindow));
  }

  const query = searchParams.toString();
  return query
    ? `upnote://x-callback-url/note/new?${query}`
    : "upnote://x-callback-url/note/new";
}

function createMissingDbMessage(dbPath: string): string {
  return [
    "UpNote database file was not found.",
    `Checked path: ${dbPath}`,
    "Set the UPNOTE_DB environment variable if your upnote.sqlite3 is stored in a different location.",
  ].join("\n");
}

export class UpNoteRepository {
  private readonly dbPath: string;
  private readonly db: Database;

  constructor(dbPath = resolveUpnoteDbPath()) {
    this.dbPath = dbPath;

    if (!existsSync(this.dbPath)) {
      throw new Error(createMissingDbMessage(this.dbPath));
    }

    try {
      this.db = new Database(this.dbPath, {
        readonly: true,
        create: false,
        strict: true,
      });
    } catch (error) {
      throw new Error(createOpenDbMessage(this.dbPath, error));
    }
  }

  getResolvedDbPath(): string {
    return this.dbPath;
  }

  listNotebooks(): NotebookResult[] {
    try {
      const rows = this.db
        .query<NotebookRow, []>(
          `
            SELECT
              nb.id,
              nb.title,
              nb.parent,
              nb.updatedAt,
              COUNT(o.noteId) AS noteCount
            FROM notebooks nb
            LEFT JOIN organizers o ON o.notebookId = nb.id AND o.deleted = 0
            WHERE nb.deleted = 0 AND nb.inactive = 0
            GROUP BY nb.id
            ORDER BY nb.title ASC
          `,
        )
        .all();

      return rows.map((row) => ({
        id: row.id,
        title: row.title?.trim() || "Untitled",
        noteCount: row.noteCount,
        parent: row.parent?.trim() || null,
        updatedAt: formatTimestamp(row.updatedAt),
        url: notebookUrl(row.id),
      }));
    } catch (error) {
      throw new Error(`Failed to list notebooks: ${String(error)}`);
    }
  }

  listTags(): TagResult[] {
    try {
      const rows = this.db
        .query<TagRow, []>(
          `
            SELECT id, title, updatedAt
            FROM tags
            WHERE deleted = 0 AND inactive = 0
            ORDER BY title ASC
          `,
        )
        .all();

      return rows.map((row) => ({
        id: row.id,
        title: row.title?.trim() || "",
        updatedAt: formatTimestamp(row.updatedAt),
        url: tagUrl(row.title?.trim() || ""),
      }));
    } catch (error) {
      throw new Error(`Failed to list tags: ${String(error)}`);
    }
  }

  listRecentNotes(limit = 10): SearchNoteResult[] {
    const clamped = Math.min(Math.max(limit, 1), 50);

    try {
      const rows = this.db
        .query<SearchNoteRow, [number]>(
          `
            SELECT
              id,
              title,
              substr(COALESCE(text, summary, ''), 1, 240) AS preview,
              updatedAt,
              createdAt
            FROM notes
            WHERE deleted = 0
              AND trashed = 0
            ORDER BY updatedAt DESC
            LIMIT ?
          `,
        )
        .all(clamped);

      return rows.map((row) => ({
        id: row.id,
        title: row.title?.trim() || "Untitled",
        preview: normalizeMultilineText(row.preview),
        updatedAt: formatTimestamp(row.updatedAt),
        createdAt: formatTimestamp(row.createdAt),
        url: noteUrl(row.id),
      }));
    } catch (error) {
      throw new Error(`Failed to list recent notes: ${String(error)}`);
    }
  }

  listNotesThisWeek(limit = 50): SearchNoteResult[] {
    return this.listNotesUpdatedSince(startOfCurrentWeek(), limit, "this week");
  }

  listNotesThisMonth(limit = 50): SearchNoteResult[] {
    return this.listNotesUpdatedSince(startOfCurrentMonth(), limit, "this month");
  }

  findNotes(params: FindNotesParams): SearchNoteResult[] {
    const period = params.period ?? "recent";
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 100);
    const clauses = ["deleted = 0", "trashed = 0"];
    const values: Array<string | number> = [];

    if (period === "this_week") {
      clauses.push("updatedAt >= ?");
      values.push(startOfCurrentWeek());
    } else if (period === "this_month") {
      clauses.push("updatedAt >= ?");
      values.push(startOfCurrentMonth());
    }

    if (params.query?.trim()) {
      const likeQuery = `%${params.query.trim()}%`;
      clauses.push("(COALESCE(title, '') LIKE ? OR COALESCE(text, '') LIKE ? OR COALESCE(summary, '') LIKE ?)");
      values.push(likeQuery, likeQuery, likeQuery);
    }

    if (params.tag?.trim()) {
      clauses.push("EXISTS (SELECT 1 FROM json_each(tagLinks) WHERE json_each.value = ?)");
      values.push(params.tag.trim().replace(/^#/, ""));
    }

    values.push(limit);

    try {
      const rows = this.db
        .query<SearchNoteRow, Array<string | number>>(
          `
            SELECT
              id,
              title,
              substr(COALESCE(text, summary, ''), 1, 240) AS preview,
              updatedAt,
              createdAt
            FROM notes
            WHERE ${clauses.join("\n              AND ")}
            ORDER BY updatedAt DESC
            LIMIT ?
          `,
        )
        .all(...values);

      return rows.map((row) => ({
        id: row.id,
        title: row.title?.trim() || "Untitled",
        preview: normalizeMultilineText(row.preview),
        updatedAt: formatTimestamp(row.updatedAt),
        createdAt: formatTimestamp(row.createdAt),
        url: noteUrl(row.id),
      }));
    } catch (error) {
      throw new Error(`Failed to find notes: ${String(error)}`);
    }
  }

  private listNotesUpdatedSince(startMs: number, limit: number, label: string): SearchNoteResult[] {
    const clamped = Math.min(Math.max(limit, 1), 100);

    try {
      const rows = this.db
        .query<SearchNoteRow, [number, number]>(
          `
            SELECT
              id,
              title,
              substr(COALESCE(text, summary, ''), 1, 240) AS preview,
              updatedAt,
              createdAt
            FROM notes
            WHERE deleted = 0
              AND trashed = 0
              AND updatedAt >= ?
            ORDER BY updatedAt DESC
            LIMIT ?
          `,
        )
        .all(startMs, clamped);

      return rows.map((row) => ({
        id: row.id,
        title: row.title?.trim() || "Untitled",
        preview: normalizeMultilineText(row.preview),
        updatedAt: formatTimestamp(row.updatedAt),
        createdAt: formatTimestamp(row.createdAt),
        url: noteUrl(row.id),
      }));
    } catch (error) {
      throw new Error(`Failed to list notes updated ${label}: ${String(error)}`);
    }
  }

  searchByTag(tagTitle: string, limit = 10): SearchNoteResult[] {
    const tag = tagTitle.trim().replace(/^#/, "");
    if (!tag) {
      throw new Error("tagTitle cannot be empty.");
    }

    const clamped = Math.min(Math.max(limit, 1), 50);

    try {
      const rows = this.db
        .query<SearchNoteRow, [string, number]>(
          `
            SELECT
              id,
              title,
              substr(COALESCE(text, summary, ''), 1, 240) AS preview,
              updatedAt,
              createdAt
            FROM notes
            WHERE deleted = 0
              AND trashed = 0
              AND EXISTS (
                SELECT 1
                FROM json_each(tagLinks)
                WHERE json_each.value = ?
              )
            ORDER BY updatedAt DESC
            LIMIT ?
          `,
        )
        .all(tag, clamped);

      return rows.map((row) => ({
        id: row.id,
        title: row.title?.trim() || "Untitled",
        preview: normalizeMultilineText(row.preview),
        updatedAt: formatTimestamp(row.updatedAt),
        createdAt: formatTimestamp(row.createdAt),
        url: noteUrl(row.id),
      }));
    } catch (error) {
      throw new Error(`Failed to search notes by tag: ${String(error)}`);
    }
  }

  searchNotes(params: SearchNotesParams): SearchNoteResult[] {
    const query = params.query.trim();
    if (!query) {
      throw new Error("query cannot be empty.");
    }

    const limit = Math.min(Math.max(params.limit ?? 10, 1), 50);
    const likeQuery = `%${query}%`;

    try {
      const rows = this.db
        .query<SearchNoteRow, [string, string, string, number]>(
          `
            SELECT
              id,
              title,
              substr(COALESCE(text, summary, ''), 1, 240) AS preview,
              updatedAt,
              createdAt
            FROM notes
            WHERE deleted = 0
              AND trashed = 0
              AND (
                COALESCE(title, '') LIKE ?
                OR COALESCE(text, '') LIKE ?
                OR COALESCE(summary, '') LIKE ?
              )
            ORDER BY updatedAt DESC
            LIMIT ?
          `,
        )
        .all(likeQuery, likeQuery, likeQuery, limit);

      return rows.map((row) => ({
        id: row.id,
        title: row.title?.trim() || "Untitled",
        preview: normalizeMultilineText(row.preview),
        updatedAt: formatTimestamp(row.updatedAt),
        createdAt: formatTimestamp(row.createdAt),
        url: noteUrl(row.id),
      }));
    } catch (error) {
      throw new Error(`Failed to search UpNote notes: ${String(error)}`);
    }
  }

  getNote(id: string): NoteDetail {
    const noteId = id.trim();
    if (!noteId) {
      throw new Error("id cannot be empty.");
    }

    try {
      const row = this.db
        .query<NoteDetailRow, [string]>(
          `
            SELECT
              id,
              title,
              text,
              html,
              summary,
              updatedAt,
              createdAt
            FROM notes
            WHERE id = ?
              AND deleted = 0
              AND trashed = 0
            LIMIT 1
          `,
        )
        .get(noteId);

      if (!row) {
        throw new Error(`Note not found: ${noteId}`);
      }

      return {
        id: row.id,
        title: row.title?.trim() || "Untitled",
        content: normalizeMultilineText(row.text),
        html: row.html ?? "",
        summary: row.summary ?? "",
        updatedAt: formatTimestamp(row.updatedAt),
        createdAt: formatTimestamp(row.createdAt),
        url: noteUrl(row.id),
      };
    } catch (error) {
      throw new Error(`Failed to get UpNote note: ${String(error)}`);
    }
  }
}
