"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/actions/profile";

export function ProfileForm({ userId, initialName, email }: { userId: string; initialName: string; email: string }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile(userId, name);
      toast.success("Profile updated.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-border bg-surface p-4 space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}
