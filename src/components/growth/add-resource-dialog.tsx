"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { addLearningResourceSchema, type AddLearningResourceInput, LEARNING_RESOURCE_TYPES } from "@/server/validation/growth";
import { postJson } from "@/lib/api-client";

function typeLabel(t: string) {
  return t[0] + t.slice(1).toLowerCase();
}

export function AddResourceDialog({ onAdded }: { onAdded?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddLearningResourceInput>({
    resolver: zodResolver(addLearningResourceSchema),
    defaultValues: { type: "COURSE" },
  });

  async function onSubmit(values: AddLearningResourceInput) {
    setFormError(null);
    try {
      await postJson("/api/learning", values);
      reset();
      setOpen(false);
      onAdded?.();
      router.refresh();
    } catch (e) {
      setFormError((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" /> Add resource
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a learning resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="resource-title">Title</Label>
            <Input id="resource-title" placeholder="e.g. Designing Data-Intensive Applications" invalid={!!errors.title} {...register("title")} />
            {errors.title && <p className="text-xs text-accent-coral">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEARNING_RESOURCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resource-url">URL (optional)</Label>
            <Input id="resource-url" placeholder="https://…" invalid={!!errors.url} {...register("url")} />
            {errors.url && <p className="text-xs text-accent-coral">{errors.url.message}</p>}
          </div>
          {formError && <p className="text-sm text-accent-coral">{formError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding…" : "Add resource"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
