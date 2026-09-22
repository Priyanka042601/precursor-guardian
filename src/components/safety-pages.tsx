import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Filter,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
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
  analysisLocation,
  countBy,
  effectiveClassification,
  evidenceList,
  formatDate,
  formatPercent,
  getReport,
  getReports,
  getRules,
  matchesFilters,
  reviewStatusOf,
  REVIEW_STATUSES,
  type Analysis,
  type ReportFilters,
  type ReportRecord,
  type ReviewClassification,
  type ReviewStatus,
  saveReportWithAnalysis,
  saveReview,
} from "@/lib/safety";
import { analyzeSafetyReport, type AnalysisResult } from "@/lib/ai.functions";
import { AiMarker, PageHeader, StatusBadge } from "@/components/safety-ui";

export function AppPage({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in duration-300">{children}</div>;
}

export function LoadingState({ label = "Loading safety data..." }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
      <AlertCircle className="size-7 text-destructive" />
      <p className="max-w-md text-sm text-muted-foreground">{error}</p>
      {retry ? (
        <Button variant="outline" onClick={retry}>
          <RefreshCw />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyChart() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data available yet.</div>;
}

export function useReports() {
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const load = () => {
    setState("loading");
    getReports()
      .then((data) => {
        setRecords(data);
        setState("ready");
      })
      .catch((reason: Error) => {
        setError(reason.message);
        setState("error");
      });
  };
  useEffect(load, []);
  return { records, state, error, load };
}

export function SyntheticDataNote() {
  return (
    <p className="mt-4 text-xs text-muted-foreground">
      Seeded records are synthetic demonstration data — not actual OIL operational data.
    </p>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-5">{value}</p>
    </div>
  );
}

function KpiCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Target;
  tone?: "primary" | "danger" | "success" | "warning";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    danger: "bg-red-50 text-red-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  }[tone];
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className={`flex size-10 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FilterBar({
  records,
  filters,
  onChange,
  showStatus = true,
}: {
  records: ReportRecord[];
  filters: ReportFilters;
  onChange: (next: ReportFilters) => void;
  showStatus?: boolean;
}) {
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort();
  const sites = unique(records.map((record) => record.site));
  const types = unique(records.map((record) => record.report_type));
  const activities = unique(records.map((record) => record.activity));
  const locations = unique(records.map(analysisLocation));
  const rules = unique(records.map((record) => record.analysis?.life_saving_rule ?? ""));
  const barriers = unique(records.map((record) => record.analysis?.barrier_failure ?? ""));
  const set = (key: keyof ReportFilters) => (value: string) => onChange({ ...filters, [key]: value || undefined });

  const selectClass = "h-9 rounded-md border border-input bg-background px-2 text-sm";
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search report ID, site, activity, barrier..."
              value={filters.search ?? ""}
              onChange={(event) => set("search")(event.target.value)}
              aria-label="Search safety reports"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="filter-from">
              From date
            </label>
            <Input id="filter-from" type="date" value={filters.from ?? ""} onChange={(event) => set("from")(event.target.value)} />
          </div>
          <div>
            <label className="sr-only" htmlFor="filter-to">
              To date
            </label>
            <Input id="filter-to" type="date" value={filters.to ?? ""} onChange={(event) => set("to")(event.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <select aria-label="SIF potential" className={selectClass} value={filters.classification ?? ""} onChange={(e) => set("classification")(e.target.value)}>
            <option value="">All SIF classifications</option>
            <option value="SIF">SIF Potential</option>
            <option value="NON_SIF">Non-SIF</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
          </select>
          <select aria-label="Life-Saving Rule" className={selectClass} value={filters.rule ?? ""} onChange={(e) => set("rule")(e.target.value)}>
            <option value="">All Life-Saving Rules</option>
            {rules.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select aria-label="Activity" className={selectClass} value={filters.activity ?? ""} onChange={(e) => set("activity")(e.target.value)}>
            <option value="">All activities</option>
            {activities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select aria-label="Location" className={selectClass} value={filters.location ?? ""} onChange={(e) => set("location")(e.target.value)}>
            <option value="">All locations</option>
            {locations.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select aria-label="Barrier failure" className={selectClass} value={filters.barrier ?? ""} onChange={(e) => set("barrier")(e.target.value)}>
            <option value="">All barrier failures</option>
            {barriers.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select aria-label="Report type" className={selectClass} value={filters.type ?? ""} onChange={(e) => set("type")(e.target.value)}>
            <option value="">All report types</option>
            {types.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select aria-label="Site" className={selectClass} value={filters.site ?? ""} onChange={(e) => set("site")(e.target.value)}>
            <option value="">All sites</option>
            {sites.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          {showStatus ? (
            <select aria-label="HSE review status" className={selectClass} value={filters.status ?? ""} onChange={(e) => set("status")(e.target.value)}>
              <option value="">All review statuses</option>
              {REVIEW_STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onChange({})}>
            Clear filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { records, state, error, load } = useReports();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ReportFilters>({});
  const visible = useMemo(() => records.filter((record) => matchesFilters(record, filters)), [records, filters]);

  const openReports = (next: ReportFilters) => navigate({ to: "/reports", search: { ...filters, ...next } });

  const counts = visible.reduce(
    (totals, record) => {
      totals[effectiveClassification(record)] += 1;
      return totals;
    },
    { SIF: 0, NON_SIF: 0, NEEDS_REVIEW: 0 },
  );
  const pending = visible.filter((record) => reviewStatusOf(record) === "Pending HSE Review").length;
  const validated = visible.filter(
    (record) => record.review?.classification === "SIF" && reviewStatusOf(record) !== "Pending HSE Review",
  ).length;

  const trend = useMemo(() => {
    const grouped = new Map<string, { month: string; reports: number; sif: number }>();
    [...visible]
      .sort((a, b) => a.report_date.localeCompare(b.report_date))
      .forEach((record) => {
        const month = record.report_date.slice(0, 7);
        const current = grouped.get(month) ?? { month, reports: 0, sif: 0 };
        current.reports += 1;
        if (effectiveClassification(record) === "SIF") current.sif += 1;
        grouped.set(month, current);
      });
    return [...grouped.values()];
  }, [visible]);

  const siteData = countBy(visible, (record) => record.site).map((item) => ({
    ...item,
    density: item.total ? Math.round((item.sif / item.total) * 100) : 0,
  }));
  const locationData = countBy(visible, analysisLocation).slice(0, 8);
  const ruleData = countBy(visible, (record) => record.analysis?.life_saving_rule ?? null).filter((item) => item.name !== "Not mapped");
  const barrierData = countBy(visible, (record) => {
    const barrier = record.analysis?.barrier_failure;
    return barrier && barrier !== "Unknown" ? barrier : null;
  }).slice(0, 6);
  const activityData = countBy(visible, (record) => record.activity).slice(0, 8);

  if (state === "loading") return <AppPage><LoadingState /></AppPage>;
  if (state === "error") return <AppPage><ErrorState error={error} retry={load} /></AppPage>;

  return (
    <AppPage>
      <PageHeader
        eyebrow="Overview"
        title="Safety Intelligence Dashboard"
        description="SIF precursor signals, barrier failures and HSE review coverage, calculated live from the report register."
        action={
          <div className="flex gap-2">
            <Link to="/upload">
              <Button variant="outline">
                <Upload />
                Bulk upload
              </Button>
            </Link>
            <Link to="/analysis">
              <Button>
                <Plus />
                Analyze a report
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-5">
        <FilterBar records={records} filters={filters} onChange={setFilters} />
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total reports" value={String(visible.length)} detail="Records matching current filters" icon={FileText} />
        <KpiCard
          title="SIF potential"
          value={String(counts.SIF)}
          detail={`${visible.length ? formatPercent(counts.SIF / visible.length) : "0%"} SIF precursor density`}
          icon={ShieldAlert}
          tone="danger"
        />
        <KpiCard title="Non-SIF" value={String(counts.NON_SIF)} detail="Assessed without SIF precursors" icon={CheckCircle2} tone="success" />
        <KpiCard title="Pending HSE review" value={String(pending)} detail={`${validated} SIF precursors validated by HSE`} icon={ClipboardCheck} tone="warning" />
      </div>
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <KpiCard title="Validated SIF precursors" value={String(validated)} detail="Confirmed by an HSE reviewer" icon={ShieldCheck} tone="danger" />
        <KpiCard title="Life-Saving Rule categories" value={String(ruleData.length)} detail="Distinct rules mapped in this set" icon={Target} />
        <KpiCard title="Barrier failure types" value={String(countBy(visible, (r) => (r.analysis?.barrier_failure && r.analysis.barrier_failure !== "Unknown" ? r.analysis.barrier_failure : null)).length)} detail="Distinct failed controls observed" icon={BarChart3} tone="warning" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>SIF precursor trend</CardTitle>
            <CardDescription>Monthly report volume compared with SIF precursor reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {trend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ left: -20, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="reports" name="Reports" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="sif" name="SIF precursors" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Classification mix</CardTitle>
            <CardDescription>Current assessment status across the filtered set.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {visible.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "SIF Potential", value: counts.SIF },
                        { name: "Non-SIF", value: counts.NON_SIF },
                        { name: "Needs Review", value: counts.NEEDS_REVIEW },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={66}
                      outerRadius={94}
                      paddingAngle={3}
                    >
                      <Cell fill="hsl(var(--destructive))" />
                      <Cell fill="hsl(160 60% 42%)" />
                      <Cell fill="hsl(38 92% 50%)" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <button type="button" className="hover:underline" onClick={() => openReports({ classification: "SIF" })}>
                <i className="mr-1 inline-block size-2 rounded-full bg-destructive" />SIF {counts.SIF}
              </button>
              <button type="button" className="hover:underline" onClick={() => openReports({ classification: "NON_SIF" })}>
                <i className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />Non-SIF {counts.NON_SIF}
              </button>
              <button type="button" className="hover:underline" onClick={() => openReports({ classification: "NEEDS_REVIEW" })}>
                <i className="mr-1 inline-block size-2 rounded-full bg-amber-500" />Review {counts.NEEDS_REVIEW}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ClickableBarCard
          title="Recurring barrier failures"
          description="Frequently observed failed controls. Select a bar to filter the register."
          data={barrierData}
          onSelect={(name) => openReports({ barrier: name })}
          color="hsl(var(--chart-2))"
        />
        <ClickableBarCard
          title="SIF precursors by activity"
          description="Activities with the highest SIF precursor counts. Select a bar to filter."
          data={activityData}
          onSelect={(name) => openReports({ activity: name })}
          color="hsl(var(--chart-4))"
        />
        <ClickableBarCard
          title="Life-Saving Rule distribution"
          description="Mapped rules across the filtered reports. Select a bar to filter."
          data={ruleData}
          onSelect={(name) => openReports({ rule: name })}
          color="hsl(var(--chart-3))"
        />
        <ClickableBarCard
          title="SIF precursors by location"
          description="Locations extracted from the reports. Select a bar to filter."
          data={locationData}
          onSelect={(name) => openReports({ location: name })}
          color="hsl(var(--chart-5))"
        />
      </div>

      <Card className="mt-5 shadow-sm">
        <CardHeader>
          <CardTitle>Site analysis</CardTitle>
          <CardDescription>Total reports, SIF precursor reports and SIF precursor density per site.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 font-medium">Site</th>
                  <th className="px-3 py-3 font-medium">Total reports</th>
                  <th className="px-3 py-3 font-medium">SIF precursors</th>
                  <th className="px-5 py-3 font-medium">SIF precursor density</th>
                </tr>
              </thead>
              <tbody>
                {siteData.map((item) => (
                  <tr key={item.name} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30" onClick={() => openReports({ site: item.name })}>
                    <td className="px-5 py-3 font-medium">{item.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{item.total}</td>
                    <td className="px-3 py-3 text-muted-foreground">{item.sif}</td>
                    <td className="px-5 py-3">{item.density}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {siteData.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No reports match the current filters.</div> : null}
          </div>
          <div className="px-5 pb-5">
            <SyntheticDataNote />
          </div>
        </CardContent>
      </Card>
    </AppPage>
  );
}

export function ClickableBarCard({
  title,
  description,
  data,
  onSelect,
  color,
}: {
  title: string;
  description: string;
  data: { name: string; total: number; sif: number }[];
  onSelect: (name: string) => void;
  color: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {data.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={140} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="sif" name="SIF precursors" stackId="a" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} onClick={(entry: { name?: string }) => entry.name && onSelect(entry.name)} className="cursor-pointer" />
                <Bar dataKey="total" name="Total reports" stackId="b" fill={color} radius={[0, 3, 3, 0]} onClick={(entry: { name?: string }) => entry.name && onSelect(entry.name)} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.slice(0, 6).map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelect(item.name)}
              className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium hover:bg-accent"
            >
              {item.name} · {item.sif}/{item.total}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const { records, state, error, load } = useReports();
  const search = useSearch({ from: "/reports/" }) as ReportFilters;
  const navigate = useNavigate();
  const setFilters = (next: ReportFilters) => navigate({ to: "/reports", search: next });
  const filtered = records.filter((record) => matchesFilters(record, search));

  if (state === "loading") return <AppPage><LoadingState /></AppPage>;
  if (state === "error") return <AppPage><ErrorState error={error} retry={load} /></AppPage>;

  return (
    <AppPage>
      <PageHeader
        eyebrow="Register"
        title="Safety Reports"
        description="Every report with its SIF precursor assessment, mapped Life-Saving Rule and HSE review state."
        action={
          <div className="flex gap-2">
            <Link to="/upload">
              <Button variant="outline">
                <Upload />
                Bulk upload
              </Button>
            </Link>
            <Link to="/analysis">
              <Button>
                <Plus />
                New analysis
              </Button>
            </Link>
          </div>
        }
      />
      <FilterBar records={records} filters={search} onChange={setFilters} />
      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Report register</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtered.length} of {records.length} reports shown
            </p>
          </div>
          <Filter className="size-4 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-5 py-3 font-medium">Report</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Site / location</th>
                <th className="px-3 py-3 font-medium">Type / activity</th>
                <th className="px-3 py-3 font-medium">SIF potential</th>
                <th className="px-3 py-3 font-medium">Life-Saving Rule</th>
                <th className="px-3 py-3 font-medium">Barrier failure</th>
                <th className="px-3 py-3 font-medium">Review status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <Link to="/reports/$reportId" params={{ reportId: record.id }} className="font-semibold text-primary hover:underline">
                      {record.report_id}
                    </Link>
                    <p className="mt-1 max-w-[230px] truncate text-xs text-muted-foreground">{record.description}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-muted-foreground">{formatDate(record.report_date)}</td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      {record.site}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">{analysisLocation(record)}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-medium">{record.report_type}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{record.activity}</p>
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge classification={effectiveClassification(record)} />
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{record.analysis?.life_saving_rule ?? "Not assessed"}</td>
                  <td className="px-3 py-4 text-muted-foreground">{record.analysis?.barrier_failure ?? "Unknown"}</td>
                  <td className="px-3 py-4 text-xs font-medium">{reviewStatusOf(record)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link to="/reports/$reportId" params={{ reportId: record.id }} aria-label={`Open ${record.report_id}`}>
                      <Button variant="ghost" size="icon">
                        <ChevronRight />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? <div className="p-12 text-center text-sm text-muted-foreground">No reports match the selected filters.</div> : null}
        </div>
      </div>
    </AppPage>
  );
}

function AssessmentPanel({ analysis }: { analysis: Analysis | null }) {
  if (!analysis)
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <Sparkles className="size-7 text-primary" />
          <div>
            <p className="font-semibold">No assessment saved</p>
            <p className="mt-1 text-sm text-muted-foreground">Run an analysis to identify potential precursors and failed controls.</p>
          </div>
          <Link to="/analysis">
            <Button size="sm">Analyze a report</Button>
          </Link>
        </CardContent>
      </Card>
    );
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <AiMarker />
            <CardTitle className="mt-2">Assessment outcome</CardTitle>
            <CardDescription className="mt-1">Decision support for HSE review — not an autonomous safety decision.</CardDescription>
          </div>
          <StatusBadge classification={analysis.sif_potential ? "SIF" : "NON_SIF"} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <InfoBox label="SIF potential" value={analysis.sif_potential ? "YES" : "NO"} />
          <InfoBox label="Life-Saving Rule" value={analysis.life_saving_rule} />
          <InfoBox label="Review priority" value={analysis.review_priority} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Why was this flagged?</p>
          <p className="text-sm leading-6 text-foreground">{analysis.why_flagged || analysis.explanation}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Evidence detected in the report</p>
          <ul className="space-y-2">
            {evidenceList(analysis.evidence).map((item) => (
              <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
            {evidenceList(analysis.evidence).length === 0 ? <li className="text-sm text-muted-foreground">No supporting phrases were extracted.</li> : null}
          </ul>
        </div>
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Suggested HSE action</p>
          <p className="mt-2 text-sm leading-6">{analysis.suggested_action || analysis.recommended_focus}</p>
          <p className="mt-2 text-xs text-muted-foreground">Proposed for HSE review — assign and confirm before acting.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportDetailsPage() {
  const { reportId } = useParams({ from: "/reports/$reportId" });
  const [record, setRecord] = useState<ReportRecord | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("HSE Validated");
  const [correctedRule, setCorrectedRule] = useState("");
  const [assignedAction, setAssignedAction] = useState("");
  const [rules, setRules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setState("loading");
    getReport(reportId)
      .then((data) => {
        setRecord(data);
        setAssignedAction(data.review?.assigned_action ?? "");
        setStatus(reviewStatusOf(data) === "Pending HSE Review" ? "HSE Validated" : reviewStatusOf(data));
        setState("ready");
      })
      .catch(() => setState("error"));
  };
  useEffect(load, [reportId]);
  useEffect(() => {
    getRules()
      .then((data) => setRules(data.map((rule) => rule.name)))
      .catch(() => setRules([]));
  }, []);

  if (state === "loading") return <AppPage><LoadingState label="Loading report details..." /></AppPage>;
  if (state === "error" || !record) return <AppPage><ErrorState error="This safety report could not be loaded." retry={load} /></AppPage>;

  const classification = effectiveClassification(record);
  const submitReview = async (value: ReviewClassification) => {
    setSaving(true);
    try {
      const review = await saveReview({
        reportId: record.id,
        classification: value,
        status,
        comment,
        correctedRule: correctedRule || undefined,
        assignedAction,
      });
      setRecord({
        ...record,
        review,
        analysis: record.analysis && correctedRule ? { ...record.analysis, life_saving_rule: correctedRule } : record.analysis,
      });
      setComment("");
      setCorrectedRule("");
      toast.success("HSE review saved");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Review could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const profile: [string, string][] = [
    ["Activity", record.analysis?.activity ?? record.activity],
    ["Hazard", record.analysis?.hazard ?? "Unknown"],
    ["Unsafe act / condition", record.analysis?.unsafe_act_condition ?? "Unknown"],
    ["Location", record.analysis?.location ?? record.site],
    ["Barrier failure", record.analysis?.barrier_failure ?? "Unknown"],
    ["Potential consequence", record.analysis?.potential_consequence ?? "Unknown"],
    ["SIF potential", record.analysis ? (record.analysis.sif_potential ? "YES" : "NO") : "Not assessed"],
    ["Life-Saving Rule", record.analysis?.life_saving_rule ?? "Not mapped"],
  ];

  return (
    <AppPage>
      <div className="mb-6">
        <Button variant="ghost" className="-ml-3" onClick={() => navigate({ to: "/reports", search: {} })}>
          <ArrowLeft />
          Back to reports
        </Button>
      </div>
      <PageHeader
        eyebrow={record.report_id}
        title={record.activity}
        description={`${record.report_type} reported at ${record.site} on ${formatDate(record.report_date)}. Review status: ${reviewStatusOf(record)}.`}
        action={<StatusBadge classification={classification} />}
      />
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Original report</CardTitle>
              <CardDescription>Source text provided by the safety reporting workflow.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border bg-muted/20 p-5 text-sm leading-7">{record.description}</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoBox label="Report ID" value={record.report_id} />
                <InfoBox label="Department" value={record.department} />
                <InfoBox label="Site" value={record.site} />
                <InfoBox label="Report type" value={record.report_type} />
              </div>
            </CardContent>
          </Card>
          <AssessmentPanel analysis={record.analysis} />
        </div>
        <div className="space-y-5">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>SIF precursor profile</CardTitle>
              <CardDescription>Structured signals extracted from this report.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {profile.map(([label, value]) => (
                <div key={label} className="border-b border-border pb-3">
                  <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm leading-5">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>HSE review workflow</CardTitle>
              <CardDescription>Accept or correct the classification, correct the rule, add notes and assign a preventive action.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="review-status">
                  Review status
                </label>
                <select
                  id="review-status"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ReviewStatus)}
                >
                  {REVIEW_STATUSES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="review-rule">
                  Correct the Life-Saving Rule (optional)
                </label>
                <select
                  id="review-rule"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={correctedRule}
                  onChange={(event) => setCorrectedRule(event.target.value)}
                >
                  <option value="">Keep {record.analysis?.life_saving_rule ?? "current mapping"}</option>
                  {rules.map((rule) => (
                    <option key={rule}>{rule}</option>
                  ))}
                  <option>Not mapped</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="review-action">
                  Assigned preventive action
                </label>
                <Textarea
                  id="review-action"
                  placeholder="Describe the preventive action assigned to the site team"
                  value={assignedAction}
                  onChange={(event) => setAssignedAction(event.target.value)}
                />
              </div>
              <Textarea placeholder="Review notes" value={comment} onChange={(event) => setComment(event.target.value)} aria-label="HSE review notes" />
              <div className="grid gap-2 sm:grid-cols-3">
                <Button variant={classification === "SIF" ? "default" : "outline"} disabled={saving} onClick={() => submitReview("SIF")}>
                  Confirm SIF
                </Button>
                <Button variant={classification === "NON_SIF" ? "default" : "outline"} disabled={saving} onClick={() => submitReview("NON_SIF")}>
                  Mark Non-SIF
                </Button>
                <Button variant={classification === "NEEDS_REVIEW" ? "default" : "outline"} disabled={saving} onClick={() => submitReview("NEEDS_REVIEW")}>
                  Needs review
                </Button>
              </div>
              {record.review ? (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p>
                    {reviewStatusOf(record)} · reviewed by {record.review.reviewed_by} on {new Date(record.review.reviewed_at).toLocaleString("en-IN")}
                  </p>
                  {record.review.comment ? <p className="mt-1">Notes: {record.review.comment}</p> : null}
                  {record.review.assigned_action ? <p className="mt-1">Assigned action: {record.review.assigned_action}</p> : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No human review has been recorded for this report.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppPage>
  );
}

export function AnalysisPage() {
  const [description, setDescription] = useState("");
  const [site, setSite] = useState("");
  const [location, setLocation] = useState("");
  const [activity, setActivity] = useState("");
  const [reportType, setReportType] = useState("Near Miss");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedReportId, setSavedReportId] = useState("");

  const runAnalysis = async () => {
    if (description.trim().length < 20 || !site.trim() || !activity.trim()) {
      toast.error("Add the report text, site, and activity before analyzing.");
      return;
    }
    setBusy(true);
    try {
      setResult(await analyzeSafetyReport({ data: { description, site, activity, reportType, location } }));
      setSavedReportId("");
      toast.success("Assessment completed");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Assessment could not be completed");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!result) return;
    setBusy(true);
    try {
      const report = await saveReportWithAnalysis({
        report: {
          report_id: `OIL-AN-${Date.now()}`,
          report_date: new Date().toISOString().slice(0, 10),
          site,
          department: "HSSE",
          report_type: reportType,
          activity,
          description,
        },
        analysis: {
          report_id: "",
          sif_potential: result.sif_potential,
          sif_level: result.sif_level,
          life_saving_rule: result.life_saving_rule,
          activity: result.activity,
          location: location || result.location,
          hazard: result.hazard,
          unsafe_act_condition: result.unsafe_act_condition,
          barrier_failure: result.barrier_failure,
          potential_consequence: result.potential_consequence,
          evidence: result.evidence,
          explanation: result.explanation,
          why_flagged: result.why_flagged,
          recommended_focus: result.recommended_focus,
          suggested_action: result.suggested_action,
          review_priority: result.review_priority,
          model: "Lovable AI assessment",
        },
      });
      setSavedReportId(report.id);
      toast.success("Report and assessment saved to the live register");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Report could not be saved");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppPage>
      <PageHeader
        eyebrow="Decision support"
        title="AI Analysis"
        description="Paste a safety report to extract a structured SIF precursor profile for HSE review. Results are saved only when you choose to save them."
        action={
          <Link to="/reports" search={{}}>
            <Button variant="outline">
              View report register <ArrowRight />
            </Button>
          </Link>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Analyze a report</CardTitle>
            <CardDescription>Use the original report wording; do not include sensitive personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="analysis-description">
                Report description
              </label>
              <Textarea
                id="analysis-description"
                className="min-h-48"
                placeholder="Describe what happened, where, and which controls were present or missing..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="analysis-site">
                  Site
                </label>
                <Input id="analysis-site" placeholder="Site A" value={site} onChange={(event) => setSite(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="analysis-location">
                  Location (optional)
                </label>
                <Input id="analysis-location" placeholder="Compressor shed" value={location} onChange={(event) => setLocation(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="analysis-activity">
                  Activity
                </label>
                <Input id="analysis-activity" placeholder="Valve replacement" value={activity} onChange={(event) => setActivity(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="analysis-type">
                  Report type
                </label>
                <select
                  id="analysis-type"
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option>Near Miss</option>
                  <option>Unsafe Act</option>
                  <option>Unsafe Condition</option>
                  <option>Incident</option>
                </select>
              </div>
            </div>
            <Button className="w-full" disabled={busy} onClick={runAnalysis}>
              {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Analyze report
            </Button>
            {savedReportId ? (
              <Link to="/reports/$reportId" params={{ reportId: savedReportId }} className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline">
                Open saved report <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <AiMarker />
                <CardTitle className="mt-2">Assessment preview</CardTitle>
              </div>
              {result ? <StatusBadge classification={result.sif_potential ? "SIF" : "NON_SIF"} /> : null}
            </div>
            <CardDescription>Review the evidence and extracted precursors before saving.</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoBox label="SIF potential" value={result.sif_potential ? "YES" : "NO"} />
                  <InfoBox label="Life-Saving Rule" value={result.life_saving_rule} />
                  <InfoBox label="Review priority" value={result.review_priority} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["Activity", result.activity],
                      ["Hazard", result.hazard],
                      ["Unsafe act / condition", result.unsafe_act_condition],
                      ["Location", result.location],
                      ["Barrier failure", result.barrier_failure],
                      ["Potential consequence", result.potential_consequence],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <InfoBox key={label} label={label} value={value} />
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Why was this flagged?</p>
                  <p className="text-sm leading-6">{result.why_flagged}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Evidence</p>
                  <ul className="space-y-2">
                    {result.evidence.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Suggested HSE action</p>
                  <p className="mt-2 text-sm leading-6">{result.suggested_action}</p>
                </div>
                <Button variant="outline" className="w-full" disabled={busy || Boolean(savedReportId)} onClick={save}>
                  {busy ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
                  {savedReportId ? "Saved to report register" : "Save report and assessment"}
                </Button>
              </div>
            ) : (
              <div className="flex min-h-[470px] flex-col items-center justify-center text-center">
                <Target className="size-9 text-primary/70" />
                <p className="mt-4 font-semibold">No assessment yet</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Complete the report fields and run an assessment to see the structured precursor profile here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppPage>
  );
}

export function PlaceholderPage({ title, description, icon: Icon = BarChart3 }: { title: string; description: string; icon?: typeof BarChart3 }) {
  return (
    <AppPage>
      <PageHeader eyebrow="Workspace" title={title} description={description} />
      <Card className="border-dashed shadow-none">
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <Icon className="size-8 text-primary/70" />
          <p className="mt-4 font-semibold">This view is ready for the next workflow.</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The report register and assessment workflow are connected to the live data now.
          </p>
        </CardContent>
      </Card>
    </AppPage>
  );
}
