"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Save, FolderInput } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SavedArticleView } from "@/server/services/library";

function categoryLabel(category: string): string {
  return category
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function SavedArticleCard({ item, onChanged }: { item: SavedArticleView; onChanged: () => void }) {
  const [notes, setNotes] = useState(item.notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);
  const [folder, setFolder] = useState(item.folder ?? "");
  const [editingFolder, setEditingFolder] = useState(false);
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/library/${item.articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    onChanged();
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="blue">{categoryLabel(item.category)}</Badge>
            <Link href={`/news/${item.slug}`} className="block font-medium leading-snug hover:text-accent-blue">
              {item.title}
            </Link>
            <p className="text-xs text-foreground/40">{item.source}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ isFavorite: !item.isFavorite })}
            aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={cn("shrink-0", item.isFavorite ? "text-accent-coral" : "text-foreground/30 hover:text-accent-coral")}
          >
            <Star className="h-4 w-4" fill={item.isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <FolderInput className="h-3.5 w-3.5 text-foreground/30" />
          {editingFolder ? (
            <Input
              autoFocus
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              onBlur={() => {
                setEditingFolder(false);
                patch({ folder: folder.trim() || null });
              }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder="Folder name"
              className="h-7 text-xs"
            />
          ) : (
            <button type="button" onClick={() => setEditingFolder(true)} className="text-xs text-foreground/50 hover:text-accent-blue">
              {item.folder || "Add to folder"}
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <Textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesDirty(true);
            }}
            placeholder="Notes…"
            className="min-h-14 text-sm"
          />
          {notesDirty && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                patch({ notes: notes.trim() || null });
                setNotesDirty(false);
              }}
            >
              <Save className="h-3.5 w-3.5" /> Save notes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
