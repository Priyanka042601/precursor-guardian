import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Activity, BarChart3, ClipboardList, LayoutDashboard, Search, Settings, ShieldAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reports", label: "Safety Reports", icon: ClipboardList },
  { to: "/analysis", label: "AI Analysis", icon: ShieldAlert },
  { to: "/patterns", label: "Precursor Patterns", icon: Activity },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-sidebar-foreground">OIL Safety</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/60">Intelligence</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Primary navigation">
          <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">Workspace</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3">
            <p className="text-xs font-semibold text-sidebar-foreground">Decision support only</p>
            <p className="mt-1 text-xs leading-5 text-sidebar-foreground/60">HSE review remains the final safety decision.</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-8">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-primary">OIL SIF Precursor Intelligence</p>
            <p className="mt-1 hidden text-xs text-muted-foreground sm:block">HSSE report review workspace</p>
          </div>
          <form
            className="hidden max-w-sm flex-1 sm:flex"
            onSubmit={(event) => {
              event.preventDefault();
              navigate({ to: "/reports", search: { search } });
            }}
          >
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports..." className="pl-9" aria-label="Search reports" />
            </div>
          </form>
          <Button variant="outline" size="sm" className="shrink-0 gap-2 bg-background">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">H</span>
            <span className="hidden sm:inline">HSE User</span>
          </Button>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
