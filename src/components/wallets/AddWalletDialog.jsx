import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const walletTypes = [
  { value: "paypal", label: "PayPal", placeholder: "PayPal email address" },
  { value: "stripe", label: "Stripe", placeholder: "Stripe account ID" },
  { value: "mpesa", label: "M-Pesa", placeholder: "M-Pesa phone number" },
  { value: "crypto_btc", label: "Bitcoin", placeholder: "BTC wallet address" },
  { value: "crypto_eth", label: "Ethereum", placeholder: "ETH wallet address" },
  { value: "crypto_usdt", label: "USDT", placeholder: "USDT wallet address" },
];

export default function AddWalletDialog({ open, onOpenChange, onAdd }) {
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedType = walletTypes.find(t => t.value === type);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!type || !name || !address) return;
    setLoading(true);
    await onAdd({
      wallet_type: type,
      wallet_name: name,
      wallet_address: address,
      currency: type.startsWith("crypto") ? type.split("_")[1]?.toUpperCase() || "USD" : "USD",
    });
    setType("");
    setName("");
    setAddress("");
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add New Wallet</DialogTitle>
          <DialogDescription>Connect a new payment method or crypto wallet</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Wallet Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Select wallet type" /></SelectTrigger>
              <SelectContent>
                {walletTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Wallet Name</Label>
            <Input
              placeholder="e.g., My PayPal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Wallet Address / ID</Label>
            <Input
              placeholder={selectedType?.placeholder || "Enter wallet address"}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading || !type || !name || !address} className="w-full rounded-xl">
            {loading ? "Adding..." : "Add Wallet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}