import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ReportDetailsPage } from "@/components/safety-pages";

export const Route = createFileRoute("/reports/$reportId")({
  head: () => ({ meta: [
    { title: "Report Detail — OIL SIF Intelligence" },
    { name: "description", content: "Inspect the source report, assessment evidence, precursor profile, and HSE review." },
    { property: "og:title", content: "Report Detail — OIL SIF Intelligence" },
    { property: "og:description", content: "Inspect the source report, assessment evidence, precursor profile, and HSE review." },
  ] }),
  component: () => <AppShell><ReportDetailsPage /></AppShell>,
});
