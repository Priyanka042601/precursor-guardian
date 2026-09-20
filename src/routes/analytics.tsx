import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/safety-pages";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — OIL SIF Intelligence" }, { name: "description", content: "Compare safety report signals across sites, activities, and rules." }, { property: "og:title", content: "Analytics — OIL SIF Intelligence" }, { property: "og:description", content: "Compare safety report signals across sites, activities, and rules." }] }),
  component: () => <AppShell><PlaceholderPage title="Analytics" description="Compare safety signals across the live report register." /></AppShell>,
});
