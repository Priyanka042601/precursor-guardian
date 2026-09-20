import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DashboardPage } from "@/components/safety-pages";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Safety Intelligence Dashboard — OIL SIF Intelligence" },
    { name: "description", content: "Monitor SIF potential, precursor signals, and HSE review coverage from live safety reports." },
    { property: "og:title", content: "Safety Intelligence Dashboard — OIL SIF Intelligence" },
    { property: "og:description", content: "Monitor SIF potential, precursor signals, and HSE review coverage from live safety reports." },
  ] }),
  component: () => <AppShell><DashboardPage /></AppShell>,
});
