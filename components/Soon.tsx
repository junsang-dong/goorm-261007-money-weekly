"use client";

import { AppHeader } from "@/components/AppHeader";
import { RequireAuth } from "@/components/RequireAuth";

export function Soon({ title, body }: { title: string; body: string }) {
  return (
    <RequireAuth mode="app">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-10">
        <h1 className="font-serif text-3xl text-navy">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
      </main>
    </RequireAuth>
  );
}
