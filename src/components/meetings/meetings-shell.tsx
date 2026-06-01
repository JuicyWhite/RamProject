"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createMeeting,
  deleteMeeting,
  addActionItem,
  toggleActionItem,
  deleteActionItem,
} from "@/actions/meetings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronRight, Users } from "lucide-react";

interface ActionItem {
  id: string;
  description: string;
  assignee: string | null;
  dueDate: string | null;
  isCompleted: boolean;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string | null;
  facilitator: string | null;
  attendees: string | null;
  agenda: string | null;
  minutes: string | null;
  decisions: string | null;
  actionItems: ActionItem[];
}

const emptyForm = () => ({
  title: "",
  date: new Date().toISOString().split("T")[0],
  location: "",
  facilitator: "",
  attendees: "",
  agenda: "",
  minutes: "",
  decisions: "",
});

const emptyItemForm = () => ({
  description: "",
  assignee: "",
  dueDate: "",
});

export function MeetingsShell({
  projectId,
  initialMeetings,
}: {
  projectId: string;
  initialMeetings: Meeting[];
}) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingItemFor, setAddingItemFor] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState(emptyItemForm());
  const [savingItem, setSavingItem] = useState(false);

  async function handleCreate() {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    if (!form.date) { toast.error("Date is required."); return; }
    setSaving(true);
    try {
      const meeting = await createMeeting(projectId, {
        title: form.title,
        date: form.date,
        location: form.location || null,
        facilitator: form.facilitator || null,
        attendees: form.attendees || null,
        agenda: form.agenda || null,
        minutes: form.minutes || null,
        decisions: form.decisions || null,
      });
      const serialized = JSON.parse(
        JSON.stringify(meeting, (_, v) => (v instanceof Date ? v.toISOString() : v))
      );
      setMeetings((p) => [serialized, ...p]);
      setForm(emptyForm());
      setShowForm(false);
      toast.success("Meeting created.");
    } catch {
      toast.error("Failed to create meeting.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMeeting(projectId, id);
      setMeetings((p) => p.filter((m) => m.id !== id));
      if (expandedId === id) setExpandedId(null);
      toast.success("Deleted.");
    } catch {
      toast.error("Failed.");
    }
  }

  async function handleAddItem(meetingId: string) {
    if (!itemForm.description.trim()) { toast.error("Description is required."); return; }
    setSavingItem(true);
    try {
      const item = await addActionItem(projectId, meetingId, {
        description: itemForm.description,
        assignee: itemForm.assignee || null,
        dueDate: itemForm.dueDate || null,
      });
      const serialized = JSON.parse(
        JSON.stringify(item, (_, v) => (v instanceof Date ? v.toISOString() : v))
      );
      setMeetings((p) =>
        p.map((m) =>
          m.id === meetingId
            ? { ...m, actionItems: [...m.actionItems, serialized] }
            : m
        )
      );
      setItemForm(emptyItemForm());
      setAddingItemFor(null);
      toast.success("Action item added.");
    } catch {
      toast.error("Failed.");
    } finally {
      setSavingItem(false);
    }
  }

  async function handleToggleItem(meetingId: string, itemId: string) {
    try {
      await toggleActionItem(projectId, meetingId, itemId);
      setMeetings((p) =>
        p.map((m) =>
          m.id === meetingId
            ? {
                ...m,
                actionItems: m.actionItems.map((ai) =>
                  ai.id === itemId ? { ...ai, isCompleted: !ai.isCompleted } : ai
                ),
              }
            : m
        )
      );
    } catch {
      toast.error("Failed.");
    }
  }

  async function handleDeleteItem(meetingId: string, itemId: string) {
    try {
      await deleteActionItem(projectId, meetingId, itemId);
      setMeetings((p) =>
        p.map((m) =>
          m.id === meetingId
            ? { ...m, actionItems: m.actionItems.filter((ai) => ai.id !== itemId) }
            : m
        )
      );
      toast.success("Deleted.");
    } catch {
      toast.error("Failed.");
    }
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" /> New Meeting
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">New Meeting</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mtitle">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mtitle"
                placeholder="e.g. Weekly Progress Meeting"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mdate">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mdate"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mloc">Location</Label>
              <Input
                id="mloc"
                placeholder="Conference room, site office…"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mfac">Facilitator</Label>
              <Input
                id="mfac"
                placeholder="Meeting facilitator"
                value={form.facilitator}
                onChange={(e) => setForm((f) => ({ ...f, facilitator: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="matt">Attendees</Label>
              <Input
                id="matt"
                placeholder="Names separated by commas"
                value={form.attendees}
                onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="magenda">Agenda</Label>
              <Textarea
                id="magenda"
                rows={3}
                placeholder="Meeting agenda items…"
                value={form.agenda}
                onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mminutes">Minutes</Label>
              <Textarea
                id="mminutes"
                rows={4}
                placeholder="Meeting minutes and discussion notes…"
                value={form.minutes}
                onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mdec">Decisions</Label>
              <Textarea
                id="mdec"
                rows={2}
                placeholder="Key decisions made…"
                value={form.decisions}
                onChange={(e) => setForm((f) => ({ ...f, decisions: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Create Meeting"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {meetings.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No meetings logged yet.
        </div>
      )}

      {meetings.length > 0 && (
        <div className="space-y-2">
          {meetings.map((meeting) => {
            const isExpanded = expandedId === meeting.id;
            const openItems = meeting.actionItems.filter((ai) => !ai.isCompleted);
            const doneItems = meeting.actionItems.filter((ai) => ai.isCompleted);

            return (
              <div key={meeting.id} className="rounded-md border border-border bg-surface overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                >
                  <span className="shrink-0 text-muted-foreground">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{meeting.title}</span>
                      {meeting.actionItems.length > 0 && (
                        <span className="rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5">
                          {meeting.actionItems.length} action{meeting.actionItems.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(meeting.date).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {meeting.facilitator && (
                        <span className="text-xs text-muted-foreground">
                          Facilitated by {meeting.facilitator}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 space-y-4">
                    <div className="flex justify-end pt-3">
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                      <div className="space-y-0.5">
                        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Date</p>
                        <p>
                          {new Date(meeting.date).toLocaleDateString("en-PH", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {meeting.location && (
                        <div className="space-y-0.5">
                          <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Location</p>
                          <p>{meeting.location}</p>
                        </div>
                      )}
                      {meeting.facilitator && (
                        <div className="space-y-0.5">
                          <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Facilitator</p>
                          <p>{meeting.facilitator}</p>
                        </div>
                      )}
                    </div>

                    {meeting.attendees && (
                      <div className="space-y-1">
                        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Attendees</p>
                        <p className="text-sm">{meeting.attendees}</p>
                      </div>
                    )}

                    {meeting.agenda && (
                      <div className="space-y-1">
                        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Agenda</p>
                        <p className="text-sm whitespace-pre-wrap">{meeting.agenda}</p>
                      </div>
                    )}

                    {meeting.minutes && (
                      <div className="space-y-1">
                        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Minutes</p>
                        <p className="text-sm whitespace-pre-wrap">{meeting.minutes}</p>
                      </div>
                    )}

                    {meeting.decisions && (
                      <div className="space-y-1">
                        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Decisions</p>
                        <p className="text-sm whitespace-pre-wrap">{meeting.decisions}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Action Items</p>
                        {addingItemFor !== meeting.id && (
                          <button
                            onClick={() => {
                              setAddingItemFor(meeting.id);
                              setItemForm(emptyItemForm());
                            }}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Add Action Item
                          </button>
                        )}
                      </div>

                      {meeting.actionItems.length === 0 && addingItemFor !== meeting.id && (
                        <p className="text-xs text-muted-foreground">No action items.</p>
                      )}

                      {meeting.actionItems.length > 0 && (
                        <div className="rounded-md border border-border overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-border bg-muted/40">
                                <th className="w-8 px-3 py-2" />
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Assignee</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Due</th>
                                <th className="w-8 px-3 py-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {[...openItems, ...doneItems].map((ai) => (
                                <tr
                                  key={ai.id}
                                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                                >
                                  <td className="px-3 py-2">
                                    <input
                                      type="checkbox"
                                      checked={ai.isCompleted}
                                      onChange={() => handleToggleItem(meeting.id, ai.id)}
                                      className="h-3.5 w-3.5 rounded border-border"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    <span className={ai.isCompleted ? "line-through text-muted-foreground" : ""}>
                                      {ai.description}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                                    {ai.assignee ?? "—"}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                                    {ai.dueDate
                                      ? new Date(ai.dueDate).toLocaleDateString("en-PH", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                      : "—"}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      onClick={() => handleDeleteItem(meeting.id, ai.id)}
                                      className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {addingItemFor === meeting.id && (
                        <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                          <p className="text-xs font-medium">New Action Item</p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <div className="space-y-1 sm:col-span-3">
                              <Label htmlFor={`aidesc-${meeting.id}`}>
                                Description <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id={`aidesc-${meeting.id}`}
                                placeholder="What needs to be done?"
                                value={itemForm.description}
                                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`aiassign-${meeting.id}`}>Assignee</Label>
                              <Input
                                id={`aiassign-${meeting.id}`}
                                placeholder="Responsible person"
                                value={itemForm.assignee}
                                onChange={(e) => setItemForm((f) => ({ ...f, assignee: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`aidue-${meeting.id}`}>Due Date</Label>
                              <Input
                                id={`aidue-${meeting.id}`}
                                type="date"
                                value={itemForm.dueDate}
                                onChange={(e) => setItemForm((f) => ({ ...f, dueDate: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddItem(meeting.id)}
                              disabled={savingItem}
                            >
                              {savingItem ? "Saving…" : "Add"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAddingItemFor(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
