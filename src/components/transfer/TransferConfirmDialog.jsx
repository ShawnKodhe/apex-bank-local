import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, Shield } from "lucide-react";

export default function TransferConfirmDialog({
  open, onOpenChange, amount, fee, recipient, recipientEmail, wallet, note, onConfirm
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Confirm Transfer</DialogTitle>
          <DialogDescription>Please review the details before confirming</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Amount hero */}
          <div className="bg-muted rounded-2xl p-6 text-center">
            <p className="text-muted-foreground text-sm mb-1">You're sending</p>
            <p className="text-4xl font-heading font-bold">${amount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">+${fee.toFixed(2)} fee</p>
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground text-sm font-bold">
                  {recipient?.full_name?.charAt(0) || recipientEmail?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{recipient?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{recipientEmail}</p>
              </div>
            </div>

            <div className="flex justify-between px-1">
              <span className="text-muted-foreground">From wallet</span>
              <span className="font-medium">{wallet?.wallet_name}</span>
            </div>

            {note && (
              <div className="flex justify-between px-1">
                <span className="text-muted-foreground">Note</span>
                <span className="font-medium max-w-[160px] text-right">{note}</span>
              </div>
            )}

            <div className="flex justify-between px-1 font-semibold border-t border-border pt-2">
              <span>Total deducted</span>
              <span>${(amount + fee).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
            <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            Transfers are instant and cannot be reversed once confirmed.
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 rounded-xl gap-2"
            >
              <Send className="h-4 w-4" />
              {loading ? "Sending..." : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}