"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceCard } from "@/components/learning/resource-card";
import { AddResourceDialog } from "@/components/growth/add-resource-dialog";
import { LEARNING_STATUSES, LEARNING_RESOURCE_TYPES } from "@/server/validation/growth";
import type { LearningResourceDetail } from "@/server/services/growth";

const STATUS_FILTERS = [{ label: "All", value: null }, ...LEARNING_STATUSES.map((s) => ({ label: s.replace(/_/g, " "), value: s }))];
const SORTS = [
  { label: "Recent", value: "recent" },
  { label: "Title", value: "title" },
  { label: "Rating", value: "rating" },
];

function statusLabel(status: string) {
  return status
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

export function LearningBoard({ initial }: { initial: LearningResourceDetail[] }) {
  const [status, setStatus] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [sort, setSort] = useState("recent");
  const [resources, setResources] = useState(initial);
  const [loading, setLoading] = useState(false);
  const isFirstRun = useRef(true);

  async function fetchResources() {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    const res = await fetch(`/api/learning?${params.toString()}`);
    const json = await res.json();
    setResources(json.data as LearningResourceDetail[]);
    setLoading(false);
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <Button key={s.label} size="sm" variant={status === s.value ? "default" : "outline"} onClick={() => setStatus(s.value)}>
              {s.label === "All" ? s.label : statusLabel(s.value as string)}
            </Button>
          ))}
        </div>
        <AddResourceDialog onAdded={fetchResources} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={type === null ? "default" : "ghost"} className="h-8 px-2.5 text-xs" onClick={() => setType(null)}>
            All types
          </Button>
          {LEARNING_RESOURCE_TYPES.map((t) => (
            <Button key={t} size="sm" variant={type === t ? "default" : "ghost"} className="h-8 px-2.5 text-xs" onClick={() => setType(t)}>
              {t[0] + t.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 rounded-md bg-surface p-0.5">
          {SORTS.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={sort === s.value ? "default" : "ghost"}
              className="h-8 px-2.5 text-xs"
              onClick={() => setSort(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {resources.length === 0 && !loading ? (
        <EmptyState
          icon={GraduationCap}
          title="Nothing here yet"
          description="Add a course, book, or article to start building your learning list."
          className="py-16"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} onChanged={fetchResources} />
          ))}
        </div>
      )}
    </div>
  );
}
