import { AlertTriangle, CheckCircle2, CircleHelp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { classificationLabel } from "@/lib/safety";

export function StatusBadge({ classification, className }: { classification: string; className?: string }) {
  const styles =
    classification === "SIF"
      ? "border-red-200 bg-red-50 text-red-700"
      : classification === "NON_SIF"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700";
  const Icon = classification === "SIF" ? AlertTriangle : classification === "NON_SIF" ? CheckCircle2 : CircleHelp;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", styles, className)}>
      <Icon className="size-3.5" />
      {classificationLabel(classification)}
    </Badge>
  );
}

export function AiMarker() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      <ShieldCheck className="size-3.5 text-primary" />
      AI assessment
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
