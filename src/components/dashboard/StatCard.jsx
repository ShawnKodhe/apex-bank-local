import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, subtitle, trend, className }) {
  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 animate-fade-in",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-semibold px-2 py-1 rounded-full",
            trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-heading font-bold tracking-tight">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}