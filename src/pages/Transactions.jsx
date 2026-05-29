import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeftRight, Search } from "lucide-react";
import TransactionRow from "../components/dashboard/TransactionRow";
import TransactionDetailDialog from "../components/transactions/TransactionDetailDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Transactions() {
  const { user } = useOutletContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      if (!user?.email) return;
      const data = await base44.entities.Transaction.filter(
        { user_email: user.email }, "-created_date", 200
      );
      setTransactions(data);
      setLoading(false);
    }
    load();
  }, [user?.email]);

  const filtered = transactions.filter(t => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !(t.description || "").toLowerCase().includes(search.toLowerCase()) &&
        !(t.reference_id || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-1">Click any transaction to view details or download a receipt</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
            <SelectItem value="transfer_in">Transfer In</SelectItem>
            <SelectItem value="transfer_out">Transfer Out</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <div className="bg-card rounded-2xl border border-border">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowLeftRight className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-heading font-semibold mb-1">No transactions found</h3>
            <p className="text-sm text-muted-foreground">
              {transactions.length === 0 ? "You haven't made any transactions yet" : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filtered.map(t => (
              <div key={t.id} onClick={() => setSelected(t)} className="cursor-pointer">
                <TransactionRow transaction={t} />
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionDetailDialog
        transaction={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}