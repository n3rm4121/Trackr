import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconNote, IconSpinner, IconTrash } from "@/components/icons";
import type { Application } from "@/lib/applications";
import { noteTimestamp } from "@/lib/date";

export function NotesTimeline({
  application,
  onAdd,
  onDelete,
  composerAtEnd = false,
}: {
  application: Application;
  onAdd: (body: string) => void;
  onDelete: (noteId: string) => void;
  /** The mobile sheet pins the composer to the bottom, above the keyboard and
   *  the home indicator, instead of leaving it above the note history. */
  composerAtEnd?: boolean;
}) {
  const [body, setBody] = useState("");

  function handleAdd() {
    if (!body.trim()) {
      return;
    }
    onAdd(body);
    setBody("");
  }

  const composer = (
    <div className="grid gap-2">
      <label htmlFor="note-body" className="sr-only">
        Add a note
      </label>
      <Textarea
        id="note-body"
        value={body}
        rows={2}
        placeholder="What happened? Who did you speak to?"
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            handleAdd();
          }
        }}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!body.trim()}
        >
          Add note
        </Button>
      </div>
    </div>
  );

  const history =
    application.notes.length === 0 ? (
      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <IconNote className="size-4" aria-hidden />
        No notes yet.
      </p>
    ) : (
      <ol className="grid gap-2">
        {/* Newest first: the note you just wrote is the one you want to see. */}
        {application.notes.map((note) => (
          <li
            key={note.id}
            className="bg-muted/50 group/note rounded-lg px-3 py-2"
          >
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-xs leading-relaxed">
                {note.body}
              </p>
              {note.pending ? (
                <span
                  aria-label="Saving note"
                  className="text-muted-foreground shrink-0 p-1"
                >
                  <IconSpinner className="size-3.5 animate-spin" aria-hidden />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete(note.id)}
                  aria-label="Delete note"
                  className="text-muted-foreground hover:text-destructive shrink-0 rounded p-1 opacity-70 transition-opacity group-hover/note:opacity-100 focus-visible:opacity-100"
                >
                  <IconTrash className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
            <time
              dateTime={note.createdAt}
              className="text-muted-foreground mt-1 block text-[11px]"
            >
              {noteTimestamp(note.createdAt)}
            </time>
          </li>
        ))}
      </ol>
    );

  return (
    <section aria-labelledby="notes-heading" className="grid gap-3">
      <h3 id="notes-heading" className="text-sm font-semibold">
        Notes
        {application.notes.length > 0 ? (
          <span className="text-muted-foreground ml-1.5 text-xs font-normal tabular-nums">
            {application.notes.length}
          </span>
        ) : null}
      </h3>

      {composerAtEnd ? history : composer}
      {composerAtEnd ? composer : history}
    </section>
  );
}
