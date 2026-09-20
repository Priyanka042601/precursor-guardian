import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/safety-pages";

export const Route = createFileRoute("/patterns")({
  head: () => ({ meta: [{ title: "Precursor Patterns — OIL SIF Intelligence" }, { name: "description", content: "Review recurring precursor patterns across safety reports." }, { property: "og:title", content: "Precursor Patterns — OIL SIF Intelligence" }, { property: "og:description", content: "Review recurring precursor patterns across safety reports." }] }),
  component: () => <AppShell><PlaceholderPage title="Precursor Patterns" description="Explore recurring combinations of sites, activities, hazards, and barrier failures." /></AppShell>,
});
