"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createNote, updateNote, deleteNote } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pin, PinOff, FileText } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export function NotesShell({ projectId, initialNotes }: { projectId: string; initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  async function handleCreate() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setSaving(true);
    try {
      const note = await createNote(projectId, { title: form.title, content: form.content, isPinned: false });
      setNotes((prev) => [{ ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() }, ...prev]);
      setForm({ title: "", content: "" });
      setShowForm(false);
      toast.success("Note created.");
    } catch {
      toast.error("Failed to create note.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePin(note: Note) {
    try {
      await updateNote(projectId, note.id, { isPinned: !note.isPinned });
      setNotes((prev) =>
        [...prev.map((n) => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n)]
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
      );
    } catch {
      toast.error("Failed to update note.");
    }
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteNote(projectId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted.");
    } catch {
      toast.error("Failed to delete note.");
    }
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Note
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">New Note</h2>
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Note title..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              rows={5}
              placeholder="Write your note here..."
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Save Note"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No notes yet. Add your first note.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`rounded-md border bg-surface p-4 space-y-2 ${note.isPinned ? "border-primary/40" : "border-border"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug">{note.title}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handlePin(note)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  title={note.isPinned ? "Unpin" : "Pin"}
                >
                  {note.isPinned ? <Pin className="h-3.5 w-3.5 text-primary" /> : <PinOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{note.content}</p>
            <p className="text-2xs text-muted-foreground">
              {new Date(note.updatedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
