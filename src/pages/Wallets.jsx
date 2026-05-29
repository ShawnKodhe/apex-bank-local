import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Wallet } from "lucide-react";
import WalletCard from "../components/wallets/WalletCard";
import AddWalletDialog from "../components/wallets/AddWalletDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";

export default function Wallets() {
  const { user } = useOutletContext();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function loadWallets() {
    if (!user?.email) return;
    const data = await base44.entities.Wallet.filter({ user_email: user.email }, "-created_date", 50);
    setWallets(data);
    setLoading(false);
  }

  useEffect(() => { loadWallets(); }, [user?.email]);

  async function handleDelete(id) {
    await base44.entities.Wallet.delete(id);
    setWallets(prev => prev.filter(w => w.id !== id));
    toast({ title: "Wallet removed", description: "The wallet has been removed from your account." });
  }

  async function handleAdd(walletData) {
    const created = await base44.entities.Wallet.create({
      ...walletData,
      user_email: user.email,
      balance: 0,
      status: "active",
    });
    setWallets(prev => [created, ...prev]);
    setDialogOpen(false);
    toast({ title: "Wallet added", description: "Your new wallet has been connected." });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Wallets</h1>
          <p className="text-muted-foreground mt-1">Manage your connected wallets</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Add Wallet
        </Button>
      </div>

      {wallets.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-16 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-heading font-semibold mb-2">No wallets yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Connect your first wallet to start transacting</p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Add Wallet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map(w => (
            <WalletCard key={w.id} wallet={w} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AddWalletDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={handleAdd} />
    </div>
  );
}