import { cn } from "@/lib/utils";
import { MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const walletStyles = {
  paypal: { gradient: "from-blue-600 to-blue-800", icon: "💳", label: "PayPal" },
  stripe: { gradient: "from-purple-600 to-indigo-800", icon: "⚡", label: "Stripe" },
  mpesa: { gradient: "from-green-600 to-emerald-800", icon: "📱", label: "M-Pesa" },
  crypto_btc: { gradient: "from-amber-500 to-orange-700", icon: "₿", label: "Bitcoin" },
  crypto_eth: { gradient: "from-slate-600 to-slate-800", icon: "Ξ", label: "Ethereum" },
  crypto_usdt: { gradient: "from-teal-500 to-cyan-700", icon: "₮", label: "USDT" },
};

export default function WalletCard({ wallet, onDelete }) {
  const style = walletStyles[wallet.wallet_type] || walletStyles.paypal;

  return (
    <div className={cn(
      "relative rounded-2xl p-6 text-white overflow-hidden bg-gradient-to-br animate-fade-in",
      style.gradient
    )}>
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="text-3xl">{style.icon}</div>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-white/70 hover:text-white transition-colors">
              <MoreVertical className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(wallet.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Wallet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-6">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{style.label}</p>
          <p className="text-2xl font-heading font-bold mt-1">
            ${wallet.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
          </p>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-white/60 text-xs">{wallet.wallet_name}</p>
            <p className="text-white/80 text-sm font-mono mt-0.5">
              {wallet.wallet_address?.replace(/(.{4}).*(.{4})/, "$1 •••• $2") || "••••"}
            </p>
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            wallet.status === "active" ? "bg-white/20 text-white" : "bg-red-500/30 text-red-200"
          )}>
            {wallet.status}
          </span>
        </div>
      </div>
    </div>
  );
}