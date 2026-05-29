import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Wallet, ArrowLeftRight, ArrowDownToLine,
  ArrowUpFromLine, Shield, User, LogOut, Menu, X, ChevronRight, Send
} from "lucide-react";
import { useState } from "react";
import { api } from "@/api/client";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/wallets", icon: Wallet, label: "Wallets" },
  { path: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { path: "/deposit", icon: ArrowDownToLine, label: "Deposit" },
  { path: "/withdraw", icon: ArrowUpFromLine, label: "Withdraw" },
  { path: "/send", icon: Send, label: "Send Money" },
  { path: "/profile", icon: User, label: "Profile" },
];

const adminItems = [
  { path: "/admin", icon: Shield, label: "Admin Panel" },
];

export default function Sidebar({ user }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-lg border border-border"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 w-72 bg-sidebar border-r border-sidebar-border
        flex flex-col transition-transform duration-300
        lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-heading font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-white tracking-tight">Apex Bank</h1>
              <p className="text-xs text-sidebar-foreground/60">Digital Banking</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {allItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sidebar-accent-foreground text-sm font-semibold">
                {user?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email || ""}</p>
            </div>
            <button
              onClick={() => api.auth.logout()}
              className="text-sidebar-foreground/60 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}