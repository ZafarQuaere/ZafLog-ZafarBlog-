"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { Button } from "@/components/common/Button";

const schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email(),
  subject: z.string().min(1, "Required"),
  message: z.string().min(10, "Please write a bit more detail"),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { website: "" } });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    setMsg("");
    if (values.website) {
      // honeypot
      return;
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message,
        }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setStatus("err");
        setMsg(data.message ?? "Something went wrong.");
        return;
      }
      setStatus("ok");
      setMsg("Thanks — your message was sent.");
      reset();
    } catch {
      setStatus("err");
      setMsg("Network error. Try again later.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="hidden" aria-hidden>
        <label>
          Website
          <Input tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
        <Input {...register("name")} />
        {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
        <Input type="email" {...register("email")} />
        {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Subject</label>
        <Input {...register("subject")} />
        {errors.subject ? <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Message</label>
        <Textarea rows={6} {...register("message")} />
        {errors.message ? <p className="mt-1 text-sm text-red-600">{errors.message.message}</p> : null}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
      {status !== "idle" ? (
        <p
          className={status === "ok" ? "text-sm text-green-700 dark:text-green-400" : "text-sm text-red-600"}
          role="status"
        >
          {msg}
        </p>
      ) : null}
    </form>
  );
}
