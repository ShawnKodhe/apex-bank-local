import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/api/client";
import { Send, Check, AlertTriangle, Search, UserCheck, Smartphone, Bitcoin, CreditCard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import TransferConfirmDialog from "../components/transfer/TransferConfirmDialog";

const SEND_METHODS = [
  { id: "user",   label: "Apex Bank User",  icon: Users,       desc: "Send to another Apex Bank user by email" },
  { id: "mpesa",  label: "M-Pesa",        icon: Smartphone,  desc: "Send to an M-Pesa phone number" },
  { id: "crypto", label: "Crypto",        icon: Bitcoin,     desc: "Send to a crypto wallet address" },
  { id: "visa",   label: "Visa / Card",   icon: CreditCard,  desc: "Send to a Visa card number" },
];

export default function SendMoney() {
  const { user } = useOutletContext();
  const { toast } = useToast();
  const [method, setMethod] = useState("user");
  const [wallets, setWallets] = useState([]);
  const [walletId, setWalletId] = useState("");

  // Apex Bank user (P2P) fields
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientUser, setRecipientUser] = useState(null);
  const [recipientStatus, setRecipientStatus] = useState("idle"); // idle | searching | found | not_found | self

  // External method fields
  const [externalRecipient, setExternalRecipient] = useState(""); // phone / wallet / card
  const [cryptoNetwork, setCryptoNetwork] = useState("BTC");

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    api.entities.Wallet.filter({ user_email: user.email, status: "active" }).then(setWallets);
  }, [user?.email]);

  // Debounced Apex Bank user lookup by email
  useEffect(() => {
    if (method !== "user") return;
    if (!recipientEmail || !recipientEmail.includes("@")) {
      setRecipientUser(null);
      setRecipientStatus("idle");
      return;
    }
    if (recipientEmail.toLowerCase() === user?.email?.toLowerCase()) {
      setRecipientUser(null);
      setRecipientStatus("self");
      return;
    }

    setRecipientStatus("searching");
    const timer = setTimeout(async () => {
      try {
        const result = await api.users.lookup(recipientEmail);
        if (result.found) {
          setRecipientUser({
            email: result.user.email,
            full_name: result.user.full_name || recipientEmail.split("@")[0],
          });
          setRecipientStatus("found");
        } else {
          setRecipientUser(null);
          setRecipientStatus("not_found");
        }
      } catch {
        setRecipientUser(null);
        setRecipientStatus("not_found");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [recipientEmail, user?.email, method]);

  const selectedWallet = wallets.find(w => w.id === walletId);
  const parsedAmount = parseFloat(amount) || 0;
  const insufficientFunds = selectedWallet && parsedAmount > (selectedWallet.balance || 0);

  const externalRecipientValid = externalRecipient.trim().length >= 6;

  const canSend =
    walletId &&
    parsedAmount > 0 &&
    !insufficientFunds &&
    (method === "user" ? recipientStatus === "found" : externalRecipientValid);

  // Build a unified recipientLabel for non-user methods
  const externalLabel = method === "mpesa"
    ? `M-Pesa: ${externalRecipient}`
    : method === "crypto"
    ? `${cryptoNetwork}: ${externalRecipient}`
    : `Visa: **** ${externalRecipient.slice(-4)}`;

  async function handleConfirm() {
    const fee = parseFloat((parsedAmount * 0.005).toFixed(2));
    const total = parsedAmount + fee;

    await api.entities.Wallet.update(walletId, {
      balance: (selectedWallet.balance || 0) - total,
    });

    const recipientIdentifier = method === "user" ? recipientEmail : externalRecipient;
    const description = note || (method === "user"
      ? `Sent to ${recipientEmail}`
      : `${method.toUpperCase()} transfer to ${externalLabel}`);

    await api.entities.Transaction.create({
      user_email: user.email,
      wallet_id: walletId,
      type: "transfer_out",
      amount: parsedAmount,
      currency: selectedWallet?.currency || "USD",
      status: "completed",
      description,
      recipient: recipientIdentifier,
      reference_id: `P2P-${Date.now()}`,
      fee,
    });

    // If sending to an Apex Bank user — credit their wallet too
    if (method === "user") {
      const recipientWallets = await api.entities.Wallet.filter({
        user_email: recipientEmail,
        status: "active",
      });
      if (recipientWallets.length > 0) {
        const rWallet = recipientWallets[0];
        await api.entities.Wallet.update(rWallet.id, {
          balance: (rWallet.balance || 0) + parsedAmount,
        });
        await api.entities.Transaction.create({
          user_email: recipientEmail,
          wallet_id: rWallet.id,
          type: "transfer_in",
          amount: parsedAmount,
          currency: rWallet.currency || "USD",
          status: "completed",
          description: note || `Received from ${user.email}`,
          recipient: user.email,
          reference_id: `P2P-${Date.now()}-IN`,
          fee: 0,
        });

        // Send email notification to recipient
        await api.integrations.Core.SendEmail({
          to: recipientEmail,
          subject: `You received $${parsedAmount.toFixed(2)} on Apex Bank`,
          body: `Hi,\n\nYou have received a payment of $${parsedAmount.toFixed(2)} USD from ${user.full_name || user.email} on Apex Bank.\n\n${note ? `Message: "${note}"\n\n` : ""}The funds have been credited to your ${rWallet.wallet_name} wallet.\n\nLog in to your Apex Bank account to view the transaction.\n\n— The Apex Bank Team`,
        });
      }
    }

    setConfirmOpen(false);
    setSuccess({ amount: parsedAmount, fee, recipient: method === "user" ? recipientEmail : externalLabel });
    toast({ title: "Transfer successful", description: `$${parsedAmount.toFixed(2)} sent successfully` });
  }

  function resetForm() {
    setSuccess(null); setAmount(""); setNote("");
    setRecipientEmail(""); setExternalRecipient(""); setWalletId("");
    setRecipientUser(null); setRecipientStatus("idle");
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Send Money</h1>
        </div>
        <div className="bg-card rounded-2xl border border-border p-10 text-center animate-fade-in space-y-4">
          <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-heading font-bold">Transfer Complete!</h2>
          <div className="bg-muted rounded-xl p-4 text-left max-w-xs mx-auto space-y-2">
            {[
              ["Amount", `$${success.amount.toFixed(2)}`],
              ["Fee", `$${success.fee.toFixed(2)}`],
              ["Total deducted", `$${(success.amount + success.fee).toFixed(2)}`],
              ["Recipient", success.recipient],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-semibold truncate max-w-[160px]">{v}</span>
              </div>
            ))}
          </div>
          <Button onClick={resetForm} className="rounded-xl mt-2">Send Another</Button>
        </div>
      </div>
    );
  }

  const activeMethod = SEND_METHODS.find(m => m.id === method);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Send Money</h1>
        <p className="text-muted-foreground mt-1">Transfer funds instantly via multiple methods</p>
      </div>

      {/* Method selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SEND_METHODS.map(m => (
          <button
            key={m.id}
            onClick={() => { setMethod(m.id); setExternalRecipient(""); setRecipientEmail(""); setRecipientStatus("idle"); setRecipientUser(null); }}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
              method === m.id
                ? "border-accent bg-accent/5 shadow-sm"
                : "border-border hover:border-border/80 bg-card"
            )}
          >
            <m.icon className={cn("h-6 w-6", method === m.id ? "text-accent" : "text-muted-foreground")} />
            <span className={cn("text-xs font-semibold", method === m.id ? "text-accent" : "text-muted-foreground")}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center">
            <activeMethod.icon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-heading font-semibold">Send via {activeMethod.label}</h2>
            <p className="text-xs text-muted-foreground">{activeMethod.desc} • 0.5% fee</p>
          </div>
        </div>

        {/* Recipient field — varies by method */}
        {method === "user" && (
          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter recipient's email address"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            {recipientStatus === "searching" && <p className="text-xs text-muted-foreground">Looking up user...</p>}
            {recipientStatus === "found" && recipientUser && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-emerald-700">
                    {(recipientUser.full_name || recipientEmail).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700">{recipientUser.full_name}</p>
                  <p className="text-xs text-emerald-600">{recipientEmail}</p>
                </div>
                <UserCheck className="h-4 w-4 text-emerald-500 ml-auto" />
              </div>
            )}
            {recipientStatus === "not_found" && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="h-3.5 w-3.5" /> No Apex Bank user found with this email
              </div>
            )}
            {recipientStatus === "self" && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="h-3.5 w-3.5" /> You cannot send money to yourself
              </div>
            )}
          </div>
        )}

        {method === "mpesa" && (
          <div className="space-y-2">
            <Label>M-Pesa Phone Number</Label>
            <Input
              placeholder="+254712345678"
              value={externalRecipient}
              onChange={(e) => setExternalRecipient(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">Include country code (e.g. +254 for Kenya)</p>
          </div>
        )}

        {method === "crypto" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Network</Label>
              <Select value={cryptoNetwork} onValueChange={setCryptoNetwork}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["BTC", "ETH", "USDT", "BNB", "SOL", "XRP"].map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input
                placeholder={cryptoNetwork === "BTC" ? "bc1q..." : "0x..."}
                value={externalRecipient}
                onChange={(e) => setExternalRecipient(e.target.value)}
                className="rounded-xl font-mono text-sm"
              />
            </div>
          </div>
        )}

        {method === "visa" && (
          <div className="space-y-2">
            <Label>Visa Card Number</Label>
            <Input
              placeholder="4242 4242 4242 4242"
              value={externalRecipient}
              onChange={(e) => setExternalRecipient(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())}
              className="rounded-xl font-mono tracking-widest"
              maxLength={19}
            />
            <p className="text-xs text-muted-foreground">Funds will be sent to the card's linked account</p>
          </div>
        )}

        {/* Source Wallet */}
        <div className="space-y-2">
          <Label>From Wallet</Label>
          <Select value={walletId} onValueChange={setWalletId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select source wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map(w => (
                <SelectItem key={w.id} value={w.id}>
                  {w.wallet_name} — ${(w.balance || 0).toFixed(2)} available
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {wallets.length === 0 && <p className="text-xs text-muted-foreground">No active wallets found.</p>}
        </div>

        {/* Amount */}
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
          <div className="flex flex-wrap gap-2">
            {[10, 25, 50, 100, 250, 500].map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a.toString())}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                ${a}
              </button>
            ))}
          </div>
          {selectedWallet && (
            <p className="text-xs text-muted-foreground">Available: ${(selectedWallet.balance || 0).toFixed(2)}</p>
          )}
          {insufficientFunds && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertTriangle className="h-3.5 w-3.5" /> Insufficient funds
            </div>
          )}
        </div>

        {/* Fee breakdown */}
        {parsedAmount > 0 && (
          <div className="bg-muted rounded-xl p-4 space-y-2 text-sm animate-fade-in">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer amount</span>
              <span className="font-medium">${parsedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee (0.5%)</span>
              <span className="font-medium">${(parsedAmount * 0.005).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total deducted</span>
              <span>${(parsedAmount * 1.005).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="space-y-2">
          <Label>Note (Optional)</Label>
          <Textarea
            placeholder="What's this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl resize-none"
            rows={2}
          />
        </div>

        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!canSend}
          className="w-full h-12 rounded-xl text-base gap-2"
        >
          <Send className="h-4 w-4" />
          Send ${parsedAmount.toFixed(2)}
        </Button>
      </div>

      <TransferConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        amount={parsedAmount}
        fee={parseFloat((parsedAmount * 0.005).toFixed(2))}
        recipient={method === "user" ? recipientUser : { full_name: externalLabel, email: externalRecipient }}
        recipientEmail={method === "user" ? recipientEmail : externalLabel}
        wallet={selectedWallet}
        note={note}
        onConfirm={handleConfirm}
      />
    </div>
  );
}