import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Shield, Users, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import KYCReviewDialog from "../components/admin/KYCReviewDialog";
import AdminStatCard from "../components/admin/AdminStatCard";

export default function Admin() {
  const { user } = useOutletContext();
  const [kycRequests, setKycRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState(null);

  useEffect(() => {
    async function load() {
      const [kyc, allUsers] = await Promise.all([
        base44.entities.KYCRequest.list("-created_date", 100),
        base44.entities.User.list("-created_date", 100),
      ]);
      setKycRequests(kyc);
      setUsers(allUsers);
      setLoading(false);
    }
    load();
  }, []);

  async function handleKYCAction(kycId, action, notes) {
    const kyc = kycRequests.find(k => k.id === kycId);
    await base44.entities.KYCRequest.update(kycId, {
      status: action,
      review_notes: notes,
      reviewed_by: user.email,
    });

    // Update user's KYC status
    const targetUser = users.find(u => u.email === kyc.user_email);
    if (targetUser) {
      await base44.entities.User.update(targetUser.id, {
        kyc_status: action,
        account_status: action === "approved" ? "active" : targetUser.account_status,
      });
    }

    setKycRequests(prev => prev.map(k =>
      k.id === kycId ? { ...k, status: action, review_notes: notes } : k
    ));
    setSelectedKyc(null);
    toast({ title: `KYC ${action}`, description: `User verification has been ${action}.` });
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-2">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const pendingKyc = kycRequests.filter(k => k.status === "pending");
  const approvedKyc = kycRequests.filter(k => k.status === "approved");
  const rejectedKyc = kycRequests.filter(k => k.status === "rejected");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">Manage users and KYC verifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard icon={Users} label="Total Users" value={users.length} color="text-blue-500" bg="bg-blue-500/10" />
        <AdminStatCard icon={Clock} label="Pending KYC" value={pendingKyc.length} color="text-amber-500" bg="bg-amber-500/10" />
        <AdminStatCard icon={CheckCircle} label="Verified Users" value={approvedKyc.length} color="text-emerald-500" bg="bg-emerald-500/10" />
      </div>

      {/* KYC Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg gap-1.5">
            <Clock className="h-4 w-4" /> Pending ({pendingKyc.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg gap-1.5">
            <CheckCircle className="h-4 w-4" /> Approved ({approvedKyc.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg gap-1.5">
            <XCircle className="h-4 w-4" /> Rejected ({rejectedKyc.length})
          </TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {(tab === "pending" ? pendingKyc : tab === "approved" ? approvedKyc : rejectedKyc).length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-muted-foreground">No {tab} KYC requests</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {(tab === "pending" ? pendingKyc : tab === "approved" ? approvedKyc : rejectedKyc).map(kyc => (
                    <div key={kyc.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-semibold">{kyc.full_name?.charAt(0) || "?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{kyc.full_name}</p>
                        <p className="text-xs text-muted-foreground">{kyc.user_email}</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-xs text-muted-foreground">{kyc.id_type?.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{kyc.nationality}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedKyc(kyc)}
                        className="gap-1.5 rounded-lg"
                      >
                        <Eye className="h-3.5 w-3.5" /> Review
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {selectedKyc && (
        <KYCReviewDialog
          kyc={selectedKyc}
          open={!!selectedKyc}
          onOpenChange={(v) => !v && setSelectedKyc(null)}
          onAction={handleKYCAction}
        />
      )}
    </div>
  );
}