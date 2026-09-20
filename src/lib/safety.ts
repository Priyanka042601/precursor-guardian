import { supabase } from "@/integrations/supabase/client";
import type { Database, Json, Tables } from "@/integrations/supabase/types";

export type Report = Tables<"safety_reports">;
export type Analysis = Tables<"safety_analyses">;
export type Review = Tables<"safety_reviews">;
export type Rule = Tables<"life_saving_rules">;

export type ReportRecord = Report & {
  analysis: Analysis | null;
  review: Review | null;
};

export type ReviewClassification = "SIF" | "NON_SIF" | "NEEDS_REVIEW";

export async function getReports(): Promise<ReportRecord[]> {
  const [reportsResult, analysesResult, reviewsResult] = await Promise.all([
    supabase.from("safety_reports").select("*").order("report_date", { ascending: false }),
    supabase.from("safety_analyses").select("*"),
    supabase.from("safety_reviews").select("*").order("reviewed_at", { ascending: false }),
  ]);

  if (reportsResult.error) throw reportsResult.error;
  if (analysesResult.error) throw analysesResult.error;
  if (reviewsResult.error) throw reviewsResult.error;

  const analysesByReport = new Map(analysesResult.data.map((analysis) => [analysis.report_id, analysis]));
  const reviewsByReport = new Map<string, Review>();
  for (const review of reviewsResult.data) {
    if (!reviewsByReport.has(review.report_id)) reviewsByReport.set(review.report_id, review);
  }

  return reportsResult.data.map((report) => ({
    ...report,
    analysis: analysesByReport.get(report.id) ?? null,
    review: reviewsByReport.get(report.id) ?? null,
  }));
}

export async function getReport(reportId: string): Promise<ReportRecord> {
  const { data: report, error: reportError } = await supabase
    .from("safety_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();
  if (reportError) throw reportError;
  if (!report) throw new Error("Safety report not found");

  const [analysisResult, reviewResult] = await Promise.all([
    supabase.from("safety_analyses").select("*").eq("report_id", report.id).maybeSingle(),
    supabase
      .from("safety_reviews")
      .select("*")
      .eq("report_id", report.id)
      .order("reviewed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (analysisResult.error) throw analysisResult.error;
  if (reviewResult.error) throw reviewResult.error;

  return { ...report, analysis: analysisResult.data, review: reviewResult.data };
}

export async function getRules(): Promise<Rule[]> {
  const { data, error } = await supabase
    .from("life_saving_rules")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function saveReview(input: {
  reportId: string;
  classification: ReviewClassification;
  comment: string;
  reviewedBy?: string;
}): Promise<Review> {
  const { data, error } = await supabase
    .from("safety_reviews")
    .insert({
      report_id: input.reportId,
      classification: input.classification,
      comment: input.comment,
      reviewed_by: input.reviewedBy ?? "HSE User",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function saveReportWithAnalysis(input: {
  report: Database["public"]["Tables"]["safety_reports"]["Insert"];
  analysis: Database["public"]["Tables"]["safety_analyses"]["Insert"];
}): Promise<Report> {
  const { data: report, error: reportError } = await supabase
    .from("safety_reports")
    .insert(input.report)
    .select("*")
    .single();
  if (reportError) throw reportError;

  const { error: analysisError } = await supabase
    .from("safety_analyses")
    .upsert({ ...input.analysis, report_id: report.id }, { onConflict: "report_id" });
  if (analysisError) {
    await supabase.from("safety_reports").delete().eq("id", report.id);
    throw analysisError;
  }
  return report;
}

export function effectiveClassification(record: Pick<ReportRecord, "analysis" | "review">):
  | "SIF"
  | "NON_SIF"
  | "NEEDS_REVIEW" {
  if (record.review?.classification) return record.review.classification as ReviewClassification;
  if (record.analysis) return record.analysis.sif_potential ? "SIF" : "NON_SIF";
  return "NEEDS_REVIEW";
}

export function classificationLabel(classification: string): string {
  if (classification === "SIF") return "SIF Potential";
  if (classification === "NON_SIF") return "Non-SIF";
  return "Needs Review";
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function evidenceList(evidence: Json): string[] {
  if (!Array.isArray(evidence)) return [];
  return evidence.filter((item): item is string => typeof item === "string");
}
