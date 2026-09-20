import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ReportsPage } from "@/components/safety-pages";

export const Route = createFileRoute("/reports/")({
  head: () => ({ meta: [
    { title: "Safety Reports — OIL SIF Intelligence" },
    { name: "description", content: "Review Oil India safety reports and their current SIF potential assessments." },
    { property: "og:title", content: "Safety Reports — OIL SIF Intelligence" },
    { property: "og:description", content: "Review Oil India safety reports and their current SIF potential assessments." },
  ] }),
  component: () => <AppShell><ReportsPage /></AppShell>,
});
