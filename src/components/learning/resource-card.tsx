"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RatingStars } from "@/components/learning/rating-stars";
import { LogSessionDialog } from "@/components/growth/log-session-dialog";
import { LEARNING_STATUSES } from "@/server/validation/growth";
import type { LearningResourceDetail } from "@/server/services/growth";

const STATUS_VARIANT = { WANT_TO_LEARN: "default", LEARNING: "blue", COMPLETED: "green" } as const;
const TYPE_LABEL: Record<string, string> = {
  COURSE: "Course",
  BOOK: "Book",
  ARTICLE: "Article",
  TUTORIAL: "Tutorial",
  DOCUMENTATION: "Docs",
  VIDEO: "Video",
};

function statusLabel(status: string) {
  return status
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function ResourceCard({ resource, onChanged }: { resource: LearningResourceDetail; onChanged: () => void }) {
  const [notes, setNotes] = useState(resource.notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/learning/${resource.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    onChanged();
  }

  async function saveNotes() {
    await patch({ notes });
    setNotesDirty(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${resource.title}" from your learning list?`)) return;
    setBusy(true);
    await fetch(`/api/learning/${resource.id}`, { method: "DELETE" });
    setBusy(false);
    onChanged();
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge>{TYPE_LABEL[resource.type] ?? resource.type}</Badge>
              <Badge variant={STATUS_VARIANT[resource.status as keyof typeof STATUS_VARIANT] ?? "default"}>
                {statusLabel(resource.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-medium leading-snug">{resource.title}</h3>
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open "${resource.title}" in a new tab`}
                  className="text-foreground/30 hover:text-accent-blue"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {resource.category && <p className="text-xs text-foreground/40">{resource.category}</p>}
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="shrink-0 text-foreground/30 hover:text-accent-coral"
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <Progress value={resource.progress} />
        <p className="text-xs text-foreground/40">
          {resource.sessionCount > 0
            ? `${Math.floor(resource.totalMinutes / 60)}h ${resource.totalMinutes % 60}m logged across ${resource.sessionCount} session${resource.sessionCount === 1 ? "" : "s"}`
            : "No sessions logged yet"}
        </p>

        <div className="flex items-center justify-between">
          <Select value={resource.status} onValueChange={(v) => patch({ status: v, ...(v === "COMPLETED" ? { progress: 100 } : {}) })}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEARNING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RatingStars value={resource.rating} disabled={busy} onChange={(rating) => patch({ rating })} />
        </div>

        <div className="space-y-1.5">
          <Textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesDirty(true);
            }}
            placeholder="Notes…"
            className="min-h-16 text-sm"
          />
          {notesDirty && (
            <Button size="sm" variant="outline" onClick={saveNotes} disabled={busy}>
              <Save className="h-3.5 w-3.5" /> Save notes
            </Button>
          )}
        </div>

        <LogSessionDialog resourceId={resource.id} onLogged={onChanged} />
      </CardContent>
    </Card>
  );
}
