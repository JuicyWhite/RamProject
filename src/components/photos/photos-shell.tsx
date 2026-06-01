"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { createSitePhoto, deleteSitePhoto } from "@/actions/photos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Camera } from "lucide-react";

type PhotoCategory = "PROGRESS" | "DEFECT" | "AS_BUILT" | "SAFETY" | "OTHER";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  category: PhotoCategory;
  location: string | null;
  takenAt: string;
}

const categoryLabel: Record<PhotoCategory, string> = {
  PROGRESS: "Progress",
  DEFECT: "Defect",
  AS_BUILT: "As-Built",
  SAFETY: "Safety",
  OTHER: "Other",
};

const categoryColors: Record<PhotoCategory, string> = {
  PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  DEFECT: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  AS_BUILT: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  SAFETY: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  OTHER: "bg-muted text-muted-foreground",
};

type FilterTab = "ALL" | PhotoCategory;

export function PhotosShell({ projectId, initialPhotos }: { projectId: string; initialPhotos: Photo[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [form, setForm] = useState({
    url: "",
    caption: "",
    category: "PROGRESS" as PhotoCategory,
    location: "",
    takenAt: new Date().toISOString().split("T")[0],
  });

  const counts = useMemo(() => ({
    ALL: photos.length,
    PROGRESS: photos.filter((p) => p.category === "PROGRESS").length,
    DEFECT: photos.filter((p) => p.category === "DEFECT").length,
    AS_BUILT: photos.filter((p) => p.category === "AS_BUILT").length,
    SAFETY: photos.filter((p) => p.category === "SAFETY").length,
    OTHER: photos.filter((p) => p.category === "OTHER").length,
  }), [photos]);

  const filtered = activeFilter === "ALL" ? photos : photos.filter((p) => p.category === activeFilter);

  async function handleCreate() {
    if (!form.url.trim()) { toast.error("URL is required."); return; }
    setSaving(true);
    try {
      const photo = await createSitePhoto(projectId, {
        url: form.url,
        caption: form.caption || null,
        category: form.category,
        location: form.location || null,
        takenAt: form.takenAt,
      });
      setPhotos((prev) => [
        JSON.parse(JSON.stringify(photo, (_, v) => v instanceof Date ? v.toISOString() : v)),
        ...prev,
      ]);
      setForm({ url: "", caption: "", category: "PROGRESS", location: "", takenAt: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      toast.success("Photo added.");
    } catch { toast.error("Failed to add photo."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSitePhoto(projectId, id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      toast.success("Photo deleted.");
    } catch { toast.error("Failed to delete photo."); }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "PROGRESS", label: "Progress" },
    { key: "DEFECT", label: "Defect" },
    { key: "AS_BUILT", label: "As-Built" },
    { key: "SAFETY", label: "Safety" },
    { key: "OTHER", label: "Other" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Photo
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">Add Photo</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="purl">URL <span className="text-destructive">*</span></Label>
              <Input
                id="purl"
                placeholder="https://example.com/photo.jpg"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="pcaption">Caption</Label>
              <Input
                id="pcaption"
                placeholder="Describe this photo"
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pcat">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as PhotoCategory }))}>
                <SelectTrigger id="pcat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["PROGRESS", "DEFECT", "AS_BUILT", "SAFETY", "OTHER"] as PhotoCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ploc">Location</Label>
              <Input
                id="ploc"
                placeholder="e.g. Grid A-3, Floor 2"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pdate">Taken At</Label>
              <Input
                id="pdate"
                type="date"
                value={form.takenAt}
                onChange={(e) => setForm((f) => ({ ...f, takenAt: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Add Photo"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Camera className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No photos{activeFilter !== "ALL" ? ` in ${categoryLabel[activeFilter as PhotoCategory]}` : ""} yet.
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((photo) => (
            <div key={photo.id} className="rounded-md border border-border bg-surface overflow-hidden group">
              <div className="relative aspect-video bg-muted overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption ?? "Site photo"}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="absolute top-2 right-2 rounded-md bg-background/80 p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-2xs font-medium px-2 py-0.5 rounded-full ${categoryColors[photo.category]}`}>
                    {categoryLabel[photo.category]}
                  </span>
                  <span className="text-2xs text-muted-foreground tabular">
                    {new Date(photo.takenAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                {photo.caption && (
                  <p className="text-sm font-medium truncate">{photo.caption}</p>
                )}
                {photo.location && (
                  <p className="text-xs text-muted-foreground truncate">{photo.location}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
