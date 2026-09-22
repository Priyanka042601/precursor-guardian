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

export const REVIEW_STATUSES = [
  "Pending HSE Review",
  "HSE Validated",
  "Needs Correction",
  "Action Assigned",
  "Closed",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const CORE_LIFE_SAVING_RULES = [
  "Energy Isolation",
  "Hot Work",
  "Confined Space",
  "Line of Fire",
  "Working at Height",
  "Lifting Operations",
] as const;

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
  status: ReviewStatus;
  comment: string;
  correctedRule?: string;
  assignedAction?: string;
  reviewedBy?: string;
}): Promise<Review> {
  const { data, error } = await supabase
    .from("safety_reviews")
    .insert({
      report_id: input.reportId,
      classification: input.classification,
      status: input.status,
      comment: input.comment,
      corrected_rule: input.correctedRule ?? "",
      assigned_action: input.assignedAction ?? "",
      reviewed_by: input.reviewedBy ?? "HSE User",
    })
    .select("*")
    .single();
  if (error) throw error;

  if (input.correctedRule) {
    await supabase
      .from("safety_analyses")
      .update({ life_saving_rule: input.correctedRule })
      .eq("report_id", input.reportId);
  }
  return data;
}

export async function saveReportWithAnalysis(input: {
  report: Database["public"]["Tables"]["safety_reports"]["Insert"];
  analysis: Database["public"]["Tables"]["safety_analyses"]["Insert"] | null;
}): Promise<Report> {
  const { data: report, error: reportError } = await supabase
    .from("safety_reports")
    .insert(input.report)
    .select("*")
    .single();
  if (reportError) throw reportError;

  if (input.analysis) {
    const { error: analysisError } = await supabase
      .from("safety_analyses")
      .upsert({ ...input.analysis, report_id: report.id }, { onConflict: "report_id" });
    if (analysisError) {
      await supabase.from("safety_reports").delete().eq("id", report.id);
      throw analysisError;
    }
  }
  return report;
}

export function effectiveClassification(record: Pick<ReportRecord, "analysis" | "review">): ReviewClassification {
  if (record.review?.classification) return record.review.classification as ReviewClassification;
  if (record.analysis) return record.analysis.sif_potential ? "SIF" : "NON_SIF";
  return "NEEDS_REVIEW";
}

export function reviewStatusOf(record: Pick<ReportRecord, "review">): ReviewStatus {
  const status = record.review?.status;
  return (REVIEW_STATUSES as readonly string[]).includes(status ?? "")
    ? (status as ReviewStatus)
    : "Pending HSE Review";
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

/** Filters shared by the dashboard, register and analytics views. */
export type ReportFilters = {
  search?: string;
  classification?: string;
  rule?: string;
  activity?: string;
  location?: string;
  barrier?: string;
  type?: string;
  site?: string;
  status?: string;
  from?: string;
  to?: string;
};

export function analysisLocation(record: ReportRecord): string {
  const location = record.analysis?.location;
  return location && location !== "Unknown" ? location : record.site;
}

export function matchesFilters(record: ReportRecord, filters: ReportFilters): boolean {
  const haystack = `${record.report_id} ${record.site} ${record.activity} ${record.description} ${
    record.analysis?.barrier_failure ?? ""
  } ${record.analysis?.life_saving_rule ?? ""}`.toLowerCase();
  if (filters.search && !haystack.includes(filters.search.toLowerCase())) return false;
  if (filters.classification && effectiveClassification(record) !== filters.classification) return false;
  if (filters.rule && (record.analysis?.life_saving_rule ?? "Not mapped") !== filters.rule) return false;
  if (filters.activity && record.activity !== filters.activity) return false;
  if (filters.location && analysisLocation(record) !== filters.location) return false;
  if (filters.barrier && (record.analysis?.barrier_failure ?? "Unknown") !== filters.barrier) return false;
  if (filters.type && record.report_type !== filters.type) return false;
  if (filters.site && record.site !== filters.site) return false;
  if (filters.status && reviewStatusOf(record) !== filters.status) return false;
  if (filters.from && record.report_date < filters.from) return false;
  if (filters.to && record.report_date > filters.to) return false;
  return true;
}

export function countBy<T extends string>(
  records: ReportRecord[],
  key: (record: ReportRecord) => T | null,
): { name: T; total: number; sif: number }[] {
  const map = new Map<T, { name: T; total: number; sif: number }>();
  for (const record of records) {
    const name = key(record);
    if (!name) continue;
    const current = map.get(name) ?? { name, total: 0, sif: 0 };
    current.total += 1;
    if (effectiveClassification(record) === "SIF") current.sif += 1;
    map.set(name, current);
  }
  return [...map.values()].sort((a, b) => b.sif - a.sif || b.total - a.total);
}
