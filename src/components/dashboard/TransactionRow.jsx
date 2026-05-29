import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

const typeConfig = {
  deposit: { icon: ArrowDownToLine, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Deposit" },
  withdrawal: { icon: ArrowUpFromLine, color: "text-red-500", bg: "bg-red-500/10", label: "Withdrawal" },
  transfer_in: { icon: ArrowLeftRight, color: "text-blue-500", bg: "bg-blue-500/10", label: "Transfer In" },
  transfer_out: { icon: ArrowRightLeft, color: "text-orange-500", bg: "bg-orange-500/10", label: "Transfer Out" },
};

const statusColors = {
  completed: "bg-emerald-500/10 text-emerald-500",
  pending: "bg-amber-500/10 text-amber-500",
  failed: "bg-red-500/10 text-red-500",
  cancelled: "bg-muted text-muted-foreground",
};

export default function TransactionRow({ transaction }) {
  const config = typeConfig[transaction.type] || typeConfig.deposit;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-4 py-4 px-2 hover:bg-muted/50 rounded-xl transition-colors">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", config.bg)}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {transaction.description || config.label}
        </p>
        <p className="text-xs text-muted-foreground">
          {moment(transaction.created_date).format("MMM DD, YYYY • h:mm A")}
        </p>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-semibold", 
          transaction.type === "deposit" || transaction.type === "transfer_in" 
            ? "text-emerald-500" : "text-foreground"
        )}>
          {transaction.type === "deposit" || transaction.type === "transfer_in" ? "+" : "-"}
          ${transaction.amount?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1",
          statusColors[transaction.status] || statusColors.pending
        )}>
          {transaction.status}
        </span>
      </div>
    </div>
  );
}