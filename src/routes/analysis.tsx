import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AnalysisPage } from "@/components/safety-pages";

export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [
    { title: "AI Analysis — OIL SIF Intelligence" },
    { name: "description", content: "Analyze a safety report for SIF potential and structured precursor signals." },
    { property: "og:title", content: "AI Analysis — OIL SIF Intelligence" },
    { property: "og:description", content: "Analyze a safety report for SIF potential and structured precursor signals." },
  ] }),
  component: () => <AppShell><AnalysisPage /></AppShell>,
});
