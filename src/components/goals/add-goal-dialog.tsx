"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createGoalSchema, type CreateGoalInput, GOAL_PRIORITIES } from "@/server/validation/goals";
import { postJson } from "@/lib/api-client";

function priorityLabel(p: string) {
  return p[0] + p.slice(1).toLowerCase();
}

export function AddGoalDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: { priority: "MEDIUM", milestones: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "milestones" as never });

  async function onSubmit(values: CreateGoalInput) {
    setFormError(null);
    try {
      const payload = { ...values, deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined };
      await postJson("/api/goals", payload);
      reset();
      setOpen(false);
      onCreated();
    } catch (e) {
      setFormError((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Title</Label>
            <Input id="goal-title" placeholder="e.g. Ship Sentinel v1.0" invalid={!!errors.title} {...register("title")} />
            {errors.title && <p className="text-xs text-accent-coral">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-description">Description (optional)</Label>
            <Textarea id="goal-description" placeholder="What does done look like?" {...register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {priorityLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-deadline">Deadline (optional)</Label>
              <Input id="goal-deadline" type="date" {...register("deadline")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Milestones (optional)</Label>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input placeholder={`Milestone ${i + 1}`} {...register(`milestones.${i}` as const)} />
                  <button type="button" onClick={() => remove(i)} className="text-foreground/40 hover:text-accent-coral">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button type="button" size="sm" variant="ghost" onClick={() => append("")}>
                <Plus className="h-3.5 w-3.5" /> Add milestone
              </Button>
            </div>
          </div>

          {formError && <p className="text-sm text-accent-coral">{formError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create goal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
