import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Filter,
  Loader2,
  MapPin,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  effectiveClassification,
  evidenceList,
  formatDate,
  formatPercent,
  getReport,
  getReports,
  getRules,
  type Analysis,
  type ReportRecord,
  saveReportWithAnalysis,
  saveReview,
  type ReviewClassification,
} from "@/lib/safety";
import { analyzeSafetyReport, type AnalysisResult } from "@/lib/ai.functions";
import { AiMarker, PageHeader, StatusBadge } from "@/components/safety-ui";

function LoadingState({ label = "Loading safety data..." }: { label?: string }) {
  return <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{label}</div>;
}

function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center"><AlertCircle className="size-7 text-destructive" /><p className="max-w-md text-sm text-muted-foreground">{error}</p>{retry ? <Button variant="outline" onClick={retry}><RefreshCw />Try again</Button> : null}</div>;
}

function classificationCounts(records: ReportRecord[]) {
  return records.reduce((counts, record) => {
    const classification = effectiveClassification(record);
    counts[classification] += 1;
    return counts;
  }, { SIF: 0, NON_SIF: 0, NEEDS_REVIEW: 0 });
}

function KpiCard({ title, value, detail, icon: Icon, tone = "primary" }: { title: string; value: string; detail: string; icon: typeof Target; tone?: "primary" | "danger" | "success" | "warning" }) {
  const toneClass = { primary: "bg-primary/10 text-primary", danger: "bg-red-50 text-red-700", success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700" }[tone];
  return <Card className="shadow-sm"><CardContent className="flex items-start justify-between p-5"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{title}</p><p className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><div className={`flex size-10 items-center justify-center rounded-md ${toneClass}`}><Icon className="size-5" /></div></CardContent></Card>;
}

export function DashboardPage() {
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const load = () => { setState("loading"); getReports().then((data) => { setRecords(data); setState("ready"); }).catch((reason: Error) => { setError(reason.message); setState("error"); }); };
  useEffect(load, []);

  const counts = classificationCounts(records);
  const trend = useMemo(() => {
    const grouped = new Map<string, { month: string; reports: number; sif: number }>();
    records.forEach((record) => {
      const month = new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(`${record.report_date}T00:00:00`));
      const current = grouped.get(month) ?? { month, reports: 0, sif: 0 };
      current.reports += 1;
      if (effectiveClassification(record) === "SIF") current.sif += 1;
      grouped.set(month, current);
    });
    return [...grouped.values()];
  }, [records]);
  const siteData = useMemo(() => {
    const bySite = new Map<string, { site: string; total: number; sif: number }>();
    records.forEach((record) => {
      const current = bySite.get(record.site) ?? { site: record.site, total: 0, sif: 0 };
      current.total += 1;
      if (effectiveClassification(record) === "SIF") current.sif += 1;
      bySite.set(record.site, current);
    });
    return [...bySite.values()].map((item) => ({ ...item, density: item.total ? Math.round((item.sif / item.total) * 100) : 0 })).sort((a, b) => b.density - a.density);
  }, [records]);
  const ruleData = useMemo(() => {
    const byRule = new Map<string, number>();
    records.forEach((record) => { if (record.analysis?.life_saving_rule && record.analysis.life_saving_rule !== "Not mapped") byRule.set(record.analysis.life_saving_rule, (byRule.get(record.analysis.life_saving_rule) ?? 0) + 1); });
    return [...byRule.entries()].map(([name, value]) => ({ name: name.replace(" and ", " & "), value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [records]);
  const barrierData = useMemo(() => {
    const byBarrier = new Map<string, number>();
    records.forEach((record) => { const barrier = record.analysis?.barrier_failure; if (barrier && barrier !== "Unknown") byBarrier.set(barrier, (byBarrier.get(barrier) ?? 0) + 1); });
    return [...byBarrier.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [records]);

  if (state === "loading") return <AppPage><LoadingState /></AppPage>;
  if (state === "error") return <AppPage><ErrorState error={error} retry={load} /></AppPage>;
  return <AppPage>
    <PageHeader eyebrow="Overview" title="Safety Intelligence Dashboard" description="A live view of SIF potential, precursor signals, and HSE review coverage across the current report set." action={<Link to="/analysis"><Button><Plus />Analyze a report</Button></Link>} />
    <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard title="Total reports" value={String(records.length)} detail="Reports in the live register" icon={FileText} />
      <KpiCard title="SIF potential" value={String(counts.SIF)} detail={`${records.length ? formatPercent(counts.SIF / records.length) : "0%"} of current reports`} icon={ShieldAlert} tone="danger" />
      <KpiCard title="SIF density" value={records.length ? formatPercent(counts.SIF / records.length) : "0%"} detail="AI assessment across reports" icon={TrendingUp} tone="warning" />
      <KpiCard title="Needs HSE review" value={String(counts.NEEDS_REVIEW)} detail={`${records.length ? formatPercent((records.length - counts.NEEDS_REVIEW) / records.length) : "0%"} have a classification`} icon={ClipboardCheck} tone="success" />
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Card className="shadow-sm"><CardHeader><CardTitle>Report trend</CardTitle><CardDescription>Monthly report volume compared with SIF potential.</CardDescription></CardHeader><CardContent><div className="h-72">{trend.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ left: -20, right: 10, top: 10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="reports" name="Reports" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="sif" name="SIF potential" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer> : <EmptyChart />}</div></CardContent></Card>
      <Card className="shadow-sm"><CardHeader><CardTitle>Classification mix</CardTitle><CardDescription>Current assessment status across the register.</CardDescription></CardHeader><CardContent><div className="h-72">{records.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: "SIF Potential", value: counts.SIF }, { name: "Non-SIF", value: counts.NON_SIF }, { name: "Needs Review", value: counts.NEEDS_REVIEW }]} dataKey="value" nameKey="name" innerRadius={66} outerRadius={94} paddingAngle={3}><Cell fill="hsl(var(--destructive))" /><Cell fill="hsl(160 60% 42%)" /><Cell fill="hsl(38 92% 50%)" /></Pie><Tooltip /></PieChart></ResponsiveContainer> : <EmptyChart />}</div><div className="flex justify-center gap-4 text-xs text-muted-foreground"><span><i className="mr-1 inline-block size-2 rounded-full bg-destructive" />SIF {counts.SIF}</span><span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />Non-SIF {counts.NON_SIF}</span><span><i className="mr-1 inline-block size-2 rounded-full bg-amber-500" />Review {counts.NEEDS_REVIEW}</span></div></CardContent></Card>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card className="shadow-sm"><CardHeader><CardTitle>Site SIF density</CardTitle><CardDescription>Share of reports assessed as SIF potential by site.</CardDescription></CardHeader><CardContent><div className="h-72">{siteData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={siteData} layout="vertical" margin={{ left: 0, right: 18 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} unit="%" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="site" width={62} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => [`${value}%`, "SIF density"]} /><Bar dataKey="density" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart />}</div></CardContent></Card>
      <Card className="shadow-sm"><CardHeader><CardTitle>Recurring barrier failures</CardTitle><CardDescription>Frequently observed controls in the current report set.</CardDescription></CardHeader><CardContent><div className="h-72">{barrierData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={barrierData} layout="vertical" margin={{ left: 0, right: 18 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="name" width={125} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="Reports" fill="hsl(var(--chart-2))" radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart />}</div></CardContent></Card>
    </div>
    <Card className="mt-5 shadow-sm"><CardHeader><CardTitle>Life-Saving Rule distribution</CardTitle><CardDescription>Mapped assessments are configurable and reflect the rules available in the live database.</CardDescription></CardHeader><CardContent><div className="h-64">{ruleData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={ruleData} margin={{ left: 0, right: 12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={58} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="value" name="Reports" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart />}</div></CardContent></Card>
  </AppPage>;
}

function EmptyChart() { return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No assessment data available.</div>; }
function AppPage({ children }: { children: React.ReactNode }) { return <div className="animate-in fade-in duration-300">{children}</div>; }

export function ReportsPage() {
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [site, setSite] = useState("ALL");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const load = () => { setState("loading"); getReports().then((data) => { setRecords(data); setState("ready"); }).catch((reason: Error) => { setError(reason.message); setState("error"); }); };
  useEffect(load, []);
  const sites = [...new Set(records.map((record) => record.site))];
  const types = [...new Set(records.map((record) => record.report_type))];
  const filtered = records.filter((record) => {
    const haystack = `${record.report_id} ${record.site} ${record.activity} ${record.description}`.toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (classification === "ALL" || effectiveClassification(record) === classification) && (type === "ALL" || record.report_type === type) && (site === "ALL" || record.site === site);
  });
  if (state === "loading") return <AppPage><LoadingState /></AppPage>;
  if (state === "error") return <AppPage><ErrorState error={error} retry={load} /></AppPage>;
  return <AppPage><PageHeader eyebrow="Register" title="Safety Reports" description="Review every report, its current assessment, and the human review state." action={<Link to="/analysis"><Button><Plus />New analysis</Button></Link>} />
    <Card className="shadow-sm"><CardContent className="p-4"><div className="grid gap-3 md:grid-cols-[1fr_170px_170px_170px]">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search ID, site, activity..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search safety reports" /></div>
      <select value={classification} onChange={(event) => setClassification(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="ALL">All classifications</option><option value="SIF">SIF Potential</option><option value="NON_SIF">Non-SIF</option><option value="NEEDS_REVIEW">Needs Review</option></select>
      <select value={type} onChange={(event) => setType(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="ALL">All report types</option>{types.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={site} onChange={(event) => setSite(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="ALL">All sites</option>{sites.map((item) => <option key={item}>{item}</option>)}</select>
    </div></CardContent></Card>
    <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold">Report register</h2><p className="mt-1 text-xs text-muted-foreground">{filtered.length} of {records.length} reports shown</p></div><Filter className="size-4 text-muted-foreground" /></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-muted/40"><tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground"><th className="px-5 py-3 font-medium">Report</th><th className="px-3 py-3 font-medium">Date</th><th className="px-3 py-3 font-medium">Site</th><th className="px-3 py-3 font-medium">Type / activity</th><th className="px-3 py-3 font-medium">Assessment</th><th className="px-3 py-3 font-medium">Rule</th><th className="px-5 py-3" /></tr></thead><tbody>{filtered.map((record) => <tr key={record.id} className="border-b border-border last:border-0 hover:bg-muted/30"><td className="px-5 py-4"><Link to="/reports/$reportId" params={{ reportId: record.id }} className="font-semibold text-primary hover:underline">{record.report_id}</Link><p className="mt-1 max-w-[250px] truncate text-xs text-muted-foreground">{record.description}</p></td><td className="whitespace-nowrap px-3 py-4 text-muted-foreground">{formatDate(record.report_date)}</td><td className="px-3 py-4"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-muted-foreground" />{record.site}</span></td><td className="px-3 py-4"><p className="font-medium">{record.report_type}</p><p className="mt-1 text-xs text-muted-foreground">{record.activity}</p></td><td className="px-3 py-4"><StatusBadge classification={effectiveClassification(record)} /></td><td className="px-3 py-4 text-muted-foreground">{record.analysis?.life_saving_rule ?? "Not assessed"}</td><td className="px-5 py-4 text-right"><Link to="/reports/$reportId" params={{ reportId: record.id }} aria-label={`Open ${record.report_id}`}><Button variant="ghost" size="icon"><ChevronRight /></Button></Link></td></tr>)}</tbody></table>{filtered.length === 0 ? <div className="p-12 text-center text-sm text-muted-foreground">No reports match the selected filters.</div> : null}</div></div>
  </AppPage>;
}

function AssessmentPanel({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) return <Card className="border-dashed shadow-none"><CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center"><Sparkles className="size-7 text-primary" /><div><p className="font-semibold">No assessment saved</p><p className="mt-1 text-sm text-muted-foreground">Run an analysis to identify potential precursors and controls.</p></div><Link to="/analysis"><Button size="sm">Analyze a report</Button></Link></CardContent></Card>;
  return <Card className="shadow-sm"><CardHeader className="border-b border-border"><div className="flex items-start justify-between gap-3"><div><AiMarker /><CardTitle className="mt-2">Assessment outcome</CardTitle><CardDescription className="mt-1">Decision support for HSE review — not an autonomous safety decision.</CardDescription></div><StatusBadge classification={analysis.sif_potential ? "SIF" : "NON_SIF"} /></div></CardHeader><CardContent className="space-y-6 p-6"><div className="grid gap-4 sm:grid-cols-3"><InfoBox label="Potential level" value={analysis.sif_level} /><InfoBox label="Life-Saving Rule" value={analysis.life_saving_rule} /><InfoBox label="AI confidence estimate" value={analysis.sif_level === "High" ? "High" : analysis.sif_level === "Medium" ? "Medium" : "Low"} /></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Why this was classified</p><p className="text-sm leading-6 text-foreground">{analysis.explanation}</p></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Evidence from the report</p><ul className="space-y-2">{evidenceList(analysis.evidence).map((item) => <li key={item} className="flex gap-2 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></div></CardContent></Card>;
}

function InfoBox({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div>; }

export function ReportDetailsPage() {
  const { reportId } = useParams({ from: "/reports/$reportId" });
  const [record, setRecord] = useState<ReportRecord | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const load = () => { setState("loading"); getReport(reportId).then((data) => { setRecord(data); setState("ready"); }).catch(() => setState("error")); };
  useEffect(load, [reportId]);
  if (state === "loading") return <AppPage><LoadingState label="Loading report details..." /></AppPage>;
  if (state === "error" || !record) return <AppPage><ErrorState error="This safety report could not be loaded." retry={load} /></AppPage>;
  const classification = effectiveClassification(record);
  const submitReview = async (value: ReviewClassification) => { setSaving(true); try { const review = await saveReview({ reportId: record.id, classification: value, comment }); setRecord({ ...record, review }); setComment(""); toast.success("HSE review saved"); } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Review could not be saved"); } finally { setSaving(false); } };
  return <AppPage><div className="mb-6"><Button variant="ghost" className="-ml-3" onClick={() => navigate({ to: "/reports" })}><ArrowLeft />Back to reports</Button></div><PageHeader eyebrow={record.report_id} title={record.activity} description={`${record.report_type} reported at ${record.site} on ${formatDate(record.report_date)}.`} action={<StatusBadge classification={classification} />} />
    <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]"><div className="space-y-5"><Card className="shadow-sm"><CardHeader><CardTitle>Original report</CardTitle><CardDescription>Source text provided by the safety reporting workflow.</CardDescription></CardHeader><CardContent><div className="rounded-md border border-border bg-muted/20 p-5 text-sm leading-7">{record.description}</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><InfoBox label="Report ID" value={record.report_id} /><InfoBox label="Department" value={record.department} /><InfoBox label="Site" value={record.site} /><InfoBox label="Report type" value={record.report_type} /></div></CardContent></Card><AssessmentPanel analysis={record.analysis} /></div><div className="space-y-5"><Card className="shadow-sm"><CardHeader><CardTitle>Precursor profile</CardTitle><CardDescription>Extracted signals to guide HSE attention.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{[["Activity", record.analysis?.activity], ["Location", record.analysis?.location], ["Hazard", record.analysis?.hazard], ["Barrier failure", record.analysis?.barrier_failure], ["Potential consequence", record.analysis?.potential_consequence], ["Recommended HSE focus", record.analysis?.recommended_focus]].map(([label, value]) => <div key={label} className="border-b border-border pb-3"><p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-5">{value ?? "Unknown"}</p></div>)}</CardContent></Card><Card className="shadow-sm"><CardHeader><CardTitle>HSE review</CardTitle><CardDescription>Human review can confirm, override, or keep the case open.</CardDescription></CardHeader><CardContent className="space-y-4"><Textarea placeholder="Optional review comment" value={comment} onChange={(event) => setComment(event.target.value)} aria-label="HSE review comment" /><div className="grid gap-2 sm:grid-cols-3"><Button variant={classification === "SIF" ? "default" : "outline"} disabled={saving} onClick={() => submitReview("SIF")}>Confirm SIF</Button><Button variant={classification === "NON_SIF" ? "default" : "outline"} disabled={saving} onClick={() => submitReview("NON_SIF")}>Mark Non-SIF</Button><Button variant={classification === "NEEDS_REVIEW" ? "default" : "outline"} disabled={saving} onClick={() => submitReview("NEEDS_REVIEW")}>Needs review</Button></div>{record.review ? <p className="text-xs text-muted-foreground">Last reviewed by {record.review.reviewed_by} on {new Date(record.review.reviewed_at).toLocaleString("en-IN")}</p> : <p className="text-xs text-muted-foreground">No human review has been recorded for this report.</p>}</CardContent></Card></div></div>
  </AppPage>;
}

export function AnalysisPage() {
  const [description, setDescription] = useState("");
  const [site, setSite] = useState("");
  const [activity, setActivity] = useState("");
  const [reportType, setReportType] = useState("Near Miss");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState("");
  const runAnalysis = async () => { if (description.trim().length < 20 || !site.trim() || !activity.trim()) { toast.error("Add the report text, site, and activity before analyzing."); return; } setSaving(true); try { setResult(await analyzeSafetyReport({ data: { description, site, activity, reportType } })); toast.success("Assessment completed"); } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Assessment could not be completed"); } finally { setSaving(false); } };
  const save = async () => { if (!result) return; setSaving(true); try { const report = await saveReportWithAnalysis({ report: { report_id: `OIL-AN-${Date.now()}`, report_date: new Date().toISOString().slice(0, 10), site, department: "HSSE", report_type: reportType, activity, description }, analysis: { report_id: "", sif_potential: result.sif_potential, sif_level: result.sif_level, life_saving_rule: result.life_saving_rule, activity: result.activity, location: result.location, hazard: result.hazard, barrier_failure: result.barrier_failure, potential_consequence: result.potential_consequence, evidence: result.evidence, explanation: result.explanation, recommended_focus: result.recommended_focus, model: "Lovable AI assessment" } }); setSavedReportId(report.id); toast.success("Report and assessment saved to the live register"); } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Report could not be saved"); } finally { setSaving(false); } };
  return <AppPage><PageHeader eyebrow="Decision support" title="AI Analysis" description="Paste a safety report to generate a structured assessment for HSE review. Results are saved only when you choose to save them." action={<Link to="/reports"><Button variant="outline">View report register <ArrowRight /></Button></Link>} /><div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]"><Card className="shadow-sm"><CardHeader><CardTitle>Analyze a report</CardTitle><CardDescription>Use the original report wording; do not include sensitive personal information.</CardDescription></CardHeader><CardContent className="space-y-4"><div><label className="mb-1.5 block text-sm font-medium" htmlFor="analysis-description">Report description</label><Textarea id="analysis-description" className="min-h-48" placeholder="Describe what happened, where, and which controls were present or missing..." value={description} onChange={(event) => setDescription(event.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium" htmlFor="analysis-site">Site</label><Input id="analysis-site" placeholder="Site A" value={site} onChange={(event) => setSite(event.target.value)} /></div><div><label className="mb-1.5 block text-sm font-medium" htmlFor="analysis-activity">Activity</label><Input id="analysis-activity" placeholder="Valve replacement" value={activity} onChange={(event) => setActivity(event.target.value)} /></div></div><div><label className="mb-1.5 block text-sm font-medium" htmlFor="analysis-type">Report type</label><select id="analysis-type" value={reportType} onChange={(event) => setReportType(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Near Miss</option><option>Unsafe Act</option><option>Unsafe Condition</option><option>Incident</option></select></div><Button className="w-full" disabled={saving} onClick={runAnalysis}>{saving ? <Loader2 className="animate-spin" /> : <Sparkles />}Analyze report</Button>{savedReportId ? <Link to="/reports/$reportId" params={{ reportId: savedReportId }} className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline">Open saved report <ArrowRight className="size-4" /></Link> : null}</CardContent></Card><Card className="shadow-sm"><CardHeader><div className="flex items-center justify-between"><div><AiMarker /><CardTitle className="mt-2">Assessment preview</CardTitle></div>{result ? <StatusBadge classification={result.sif_potential ? "SIF" : "NON_SIF"} /> : null}</div><CardDescription>Review the evidence and extracted precursors before saving.</CardDescription></CardHeader><CardContent>{result ? <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><InfoBox label="Potential level" value={result.sif_level} /><InfoBox label="Life-Saving Rule" value={result.life_saving_rule} /><InfoBox label="AI confidence estimate" value={result.sif_level} /></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Explanation</p><p className="text-sm leading-6">{result.explanation}</p></div><div className="grid gap-3 sm:grid-cols-2">{[["Activity", result.activity], ["Location", result.location], ["Hazard", result.hazard], ["Barrier failure", result.barrier_failure], ["Potential consequence", result.potential_consequence], ["Recommended focus", result.recommended_focus]].map(([label, value]) => <InfoBox key={label} label={label} value={value} />)}</div><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Evidence</p><ul className="space-y-2">{result.evidence.map((item) => <li key={item} className="flex gap-2 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></div><Button variant="outline" className="w-full" disabled={saving || Boolean(savedReportId)} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <ClipboardCheck />} {savedReportId ? "Saved to report register" : "Save report and assessment"}</Button></div> : <div className="flex min-h-[470px] flex-col items-center justify-center text-center"><Target className="size-9 text-primary/70" /><p className="mt-4 font-semibold">No assessment yet</p><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Complete the report fields and run an assessment to see the structured result here.</p></div>}</CardContent></Card></div></AppPage>;
}

export function PlaceholderPage({ title, description, icon: Icon = BarChart3 }: { title: string; description: string; icon?: typeof BarChart3 }) { return <AppPage><PageHeader eyebrow="Workspace" title={title} description={description} /><Card className="border-dashed shadow-none"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Icon className="size-8 text-primary/70" /><p className="mt-4 font-semibold">This view is ready for the next workflow.</p><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">The report register and assessment workflow are connected to the live data now.</p></CardContent></Card></AppPage>; }
