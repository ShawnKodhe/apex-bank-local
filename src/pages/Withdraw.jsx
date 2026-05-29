import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowUpFromLine, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export default function Withdraw() {
  const { user } = useOutletContext();
  const [wallets, setWallets] = useState([]);
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Wallet.filter({ user_email: user.email, status: "active" }).then(setWallets);
  }, [user?.email]);

  const selectedWallet = wallets.find(w => w.id === walletId);
  const insufficientFunds = selectedWallet && parseFloat(amount) > (selectedWallet.balance || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!walletId || !amount || parseFloat(amount) <= 0 || insufficientFunds) return;
    setLoading(true);

    await base44.entities.Transaction.create({
      user_email: user.email,
      wallet_id: walletId,
      type: "withdrawal",
      amount: parseFloat(amount),
      currency: selectedWallet?.currency || "USD",
      status: "pending",
      description: description || `Withdrawal from ${selectedWallet?.wallet_name}`,
      recipient: recipient,
      reference_id: `WDR-${Date.now()}`,
    });

    await base44.entities.Wallet.update(walletId, {
      balance: (selectedWallet?.balance || 0) - parseFloat(amount),
    });

    setLoading(false);
    setSuccess(true);
    toast({ title: "Withdrawal submitted", description: "Your withdrawal is being processed." });

    setTimeout(() => {
      setSuccess(false);
      setAmount("");
      setRecipient("");
      setDescription("");
      setWalletId("");
    }, 3000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Withdraw Funds</h1>
        <p className="text-muted-foreground mt-1">Send money from your wallet</p>
      </div>

      {success ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-heading font-bold text-emerald-700">Withdrawal Submitted!</h2>
          <p className="text-sm text-emerald-600 mt-2">Your withdrawal request is being processed</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-11 w-11 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ArrowUpFromLine className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-heading font-semibold">New Withdrawal</h2>
              <p className="text-xs text-muted-foreground">Select wallet, enter amount and recipient</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Source Wallet</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map(w => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.wallet_name} — ${(w.balance || 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount (USD)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              className="text-2xl font-heading font-bold h-14 rounded-xl"
            />
            {selectedWallet && (
              <p className="text-xs text-muted-foreground">
                Available: ${(selectedWallet.balance || 0).toFixed(2)}
              </p>
            )}
            {insufficientFunds && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="h-3 w-3" />
                Insufficient funds
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Recipient Address / Email</Label>
            <Input
              placeholder="Enter recipient details"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Add a note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !walletId || !amount || parseFloat(amount) <= 0 || insufficientFunds}
            className="w-full h-12 rounded-xl text-base"
          >
            {loading ? "Processing..." : `Withdraw $${parseFloat(amount || 0).toFixed(2)}`}
          </Button>
        </form>
      )}
    </div>
  );
}