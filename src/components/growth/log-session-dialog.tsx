"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { postJson } from "@/lib/api-client";

const formSchema = z.object({
  durationMinutes: z.number().int().min(1).max(600),
  note: z.string().trim().max(280).optional(),
});
type FormInput = z.infer<typeof formSchema>;

export function LogSessionDialog({ resourceId, onLogged }: { resourceId?: string; onLogged?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(formSchema), defaultValues: { durationMinutes: 30 } });

  async function onSubmit(values: FormInput) {
    setFormError(null);
    try {
      await postJson("/api/learning-sessions", { ...values, resourceId });
      reset();
      setOpen(false);
      onLogged?.();
      router.refresh();
    } catch (e) {
      setFormError((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Clock className="h-3.5 w-3.5" /> Log session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a learning session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="session-minutes">Minutes</Label>
            <Input
              id="session-minutes"
              type="number"
              min={1}
              max={600}
              invalid={!!errors.durationMinutes}
              {...register("durationMinutes", { valueAsNumber: true })}
            />
            {errors.durationMinutes && <p className="text-xs text-accent-coral">{errors.durationMinutes.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="session-note">Note (optional)</Label>
            <Textarea id="session-note" placeholder="What did you work on?" {...register("note")} />
          </div>
          {formError && <p className="text-sm text-accent-coral">{formError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging…" : "Log session"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
