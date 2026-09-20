import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/safety-pages";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — OIL SIF Intelligence" }, { name: "description", content: "Manage workspace settings for OIL SIF Intelligence." }, { property: "og:title", content: "Settings — OIL SIF Intelligence" }, { property: "og:description", content: "Manage workspace settings for OIL SIF Intelligence." }] }),
  component: () => <AppShell><PlaceholderPage title="Settings" description="Manage configurable safety intelligence workspace settings." /></AppShell>,
});
