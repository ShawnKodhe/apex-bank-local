import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";
import { generateReceiptPDF } from "./ReceiptGenerator";

const typeConfig = {
  deposit:      { icon: ArrowDownToLine, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Deposit" },
  withdrawal:   { icon: ArrowUpFromLine, color: "text-red-500",     bg: "bg-red-500/10",     label: "Withdrawal" },
  transfer_in:  { icon: ArrowLeftRight,  color: "text-blue-500",    bg: "bg-blue-500/10",    label: "Transfer In" },
  transfer_out: { icon: ArrowRightLeft,  color: "text-orange-500",  bg: "bg-orange-500/10",  label: "Transfer Out" },
};

const statusColors = {
  completed: "bg-emerald-500/10 text-emerald-500",
  pending:   "bg-amber-500/10 text-amber-500",
  failed:    "bg-red-500/10 text-red-500",
  cancelled: "bg-muted text-muted-foreground",
};

export default function TransactionDetailDialog({ transaction, open, onOpenChange }) {
  if (!transaction) return null;

  const config = typeConfig[transaction.type] || typeConfig.deposit;
  const Icon = config.icon;
  const isCredit = transaction.type === "deposit" || transaction.type === "transfer_in";

  const rows = [
    ["Transaction ID",      transaction.id],
    ["Reference",           transaction.reference_id || "—"],
    ["Type",                config.label],
    ["Description",         transaction.description || "—"],
    ["Recipient / Address", transaction.recipient || "—"],
    ["Currency",            transaction.currency || "USD"],
    ["Fee",                 `$${(transaction.fee || 0).toFixed(2)}`],
    ["Total",               `$${((transaction.amount || 0) + (transaction.fee || 0)).toFixed(2)}`],
    ["Date",                moment(transaction.created_date).format("MMM DD, YYYY h:mm A")],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Transaction Details</DialogTitle>
        </DialogHeader>

        {/* Amount hero */}
        <div className="flex flex-col items-center py-4 gap-2">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", config.bg)}>
            <Icon className={cn("h-7 w-7", config.color)} />
          </div>
          <p className={cn("text-4xl font-heading font-bold mt-1", isCredit ? "text-emerald-500" : "text-foreground")}>
            {isCredit ? "+" : "-"}${(transaction.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", statusColors[transaction.status] || statusColors.pending)}>
            {transaction.status}
          </span>
        </div>

        {/* Detail rows */}
        <div className="rounded-xl border border-border overflow-hidden text-sm">
          {rows.map(([label, value], i) => (
            <div key={label} className={cn("flex justify-between gap-4 px-4 py-3", i % 2 === 0 ? "bg-muted/40" : "")}>
              <span className="text-muted-foreground shrink-0">{label}</span>
              <span className="font-medium text-right break-all">{value}</span>
            </div>
          ))}
        </div>

        {/* Download button — only for completed */}
        {transaction.status === "completed" && (
          <Button
            onClick={() => generateReceiptPDF(transaction)}
            className="w-full rounded-xl gap-2 mt-1"
          >
            <Download className="h-4 w-4" />
            Download Receipt (PDF)
          </Button>
        )}
        {transaction.status !== "completed" && (
          <p className="text-xs text-center text-muted-foreground">
            Receipt available once transaction is completed.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}