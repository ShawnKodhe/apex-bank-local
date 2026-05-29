import { cn } from "@/lib/utils";

export default function AdminStatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div>
          <p className="text-2xl font-heading font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}