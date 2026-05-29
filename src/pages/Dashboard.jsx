import { useState, useEffect, useRef } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Wallet, ArrowLeftRight, ArrowDownToLine, TrendingUp, Plus, ChevronRight, Send, ArrowUpFromLine } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import TransactionRow from "../components/dashboard/TransactionRow";
import WalletCard from "../components/wallets/WalletCard";
import { Skeleton } from "@/components/ui/skeleton";
import WelcomeTypewriter from "../components/dashboard/WelcomeTypewriter";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const { user } = useOutletContext();
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const knownTxIds = useRef(new Set());

  useEffect(() => {
    async function load() {
      if (!user?.email) return;
      const [w, t] = await Promise.all([
        base44.entities.Wallet.filter({ user_email: user.email }, "-created_date", 10),
        base44.entities.Transaction.filter({ user_email: user.email }, "-created_date", 5),
      ]);
      setWallets(w);
      setTransactions(t);
      // Seed known IDs so we don't toast on initial load
      t.forEach(tx => knownTxIds.current.add(tx.id));
      setLoading(false);
    }
    load();
  }, [user?.email]);

  // Real-time subscription for incoming transfers
  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = base44.entities.Transaction.subscribe((event) => {
      if (
        event.type === "create" &&
        event.data?.type === "transfer_in" &&
        event.data?.user_email === user.email &&
        !knownTxIds.current.has(event.id)
      ) {
        knownTxIds.current.add(event.id);
        const amount = event.data.amount?.toFixed(2);
        const sender = event.data.recipient || "Someone";
        toast({
          title: "💰 Money Received!",
          description: `$${amount} has been sent to your account from ${sender}.`,
          duration: 6000,
        });
        // Refresh transactions and wallets
        base44.entities.Transaction.filter({ user_email: user.email }, "-created_date", 5).then(setTransactions);
        base44.entities.Wallet.filter({ user_email: user.email }, "-created_date", 10).then(setWallets);
      }
    });
    return () => unsubscribe();
  }, [user?.email]);

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  const activeWallets = wallets.filter(w => w.status === "active").length;
  const pendingTx = transactions.filter(t => t.status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const kycPending = !user?.kyc_status || user.kyc_status === "not_submitted" || user.kyc_status === "pending";

  return (
    <div className="space-y-8">
      {/* Header */}
      <WelcomeTypewriter firstName={user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User"} />

      {/* KYC Banner */}
      {kycPending && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4 animate-fade-in">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <span className="text-lg">🔐</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700">Complete your KYC verification</p>
            <p className="text-xs text-amber-600/80">Verify your identity to unlock all features</p>
          </div>
          <Link to="/profile" className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
            Verify Now <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: "/deposit", icon: ArrowDownToLine, label: "Deposit", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { to: "/withdraw", icon: ArrowUpFromLine, label: "Withdraw", color: "text-red-500", bg: "bg-red-500/10" },
          { to: "/send", icon: Send, label: "Send Money", color: "text-blue-500", bg: "bg-blue-500/10" },
          { to: "/transactions", icon: ArrowLeftRight, label: "History", color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map(action => (
          <Link key={action.to} to={action.to}
            className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5 text-center">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${action.bg}`}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Balance" value={`$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} trend={12.5} />
        <StatCard icon={Wallet} label="Active Wallets" value={activeWallets} subtitle={`${wallets.length} total`} />
        <StatCard icon={ArrowLeftRight} label="Transactions" value={transactions.length} subtitle="This month" />
        <StatCard icon={ArrowDownToLine} label="Pending" value={pendingTx} subtitle="Awaiting confirmation" />
      </div>

      {/* Wallets preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold">Your Wallets</h2>
          <Link to="/wallets" className="text-sm text-accent hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {wallets.length === 0 ? (
          <Link to="/wallets" className="block border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-accent transition-colors">
            <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Add your first wallet</p>
          </Link>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.slice(0, 3).map(w => (
              <WalletCard key={w.id} wallet={w} onDelete={() => {}} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold">Recent Transactions</h2>
          <Link to="/transactions" className="text-sm text-accent hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <ArrowLeftRight className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="p-2">
              {transactions.map(t => (
                <TransactionRow key={t.id} transaction={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}