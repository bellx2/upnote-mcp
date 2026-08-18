import { UpNoteRepository } from "../src/upnote";

const repository = new UpNoteRepository();

function run<T>(label: string, fn: () => T): void {
  try {
    const result = fn();
    console.log(`\n=== ${label} ===`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`[${label}] ERROR:`, error instanceof Error ? error.message : String(error));
  }
}

run("list_notebooks", () => repository.listNotebooks().slice(0, 3));
run("list_tags", () => repository.listTags().slice(0, 5));
run("search_by_tag (会議)", () => repository.searchByTag("会議", 2));
run("search_notes (名古屋)", () => repository.searchNotes({ query: "名古屋", limit: 2 }));
run("get_note (first result)", () => {
  const first = repository.searchNotes({ query: "名古屋", limit: 1 })[0];
  if (!first) return null;
  const note = repository.getNote(first.id);
  return { id: note.id, title: note.title, contentLength: note.content.length };
});
