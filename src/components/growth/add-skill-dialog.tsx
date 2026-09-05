"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSkillSchema, type AddSkillInput } from "@/server/validation/growth";
import { postJson } from "@/lib/api-client";

export function AddSkillDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddSkillInput>({
    resolver: zodResolver(addSkillSchema),
    defaultValues: { currentLevel: 0, targetLevel: 100 },
  });

  async function onSubmit(values: AddSkillInput) {
    setFormError(null);
    try {
      await postJson("/api/skills", values);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      setFormError((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" /> Add skill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Track a new skill</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="skill-name">Skill name</Label>
            <Input id="skill-name" placeholder="e.g. GraphQL" invalid={!!errors.name} {...register("name")} />
            {errors.name && <p className="text-xs text-accent-coral">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skill-category">Category (optional)</Label>
            <Input id="skill-category" placeholder="e.g. Backend" {...register("category")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="skill-current">Current level</Label>
              <Input id="skill-current" type="number" min={0} max={100} {...register("currentLevel", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skill-target">Target level</Label>
              <Input id="skill-target" type="number" min={1} max={100} {...register("targetLevel", { valueAsNumber: true })} />
            </div>
          </div>
          {formError && <p className="text-sm text-accent-coral">{formError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding…" : "Add skill"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
