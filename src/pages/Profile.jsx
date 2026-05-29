import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { User, Shield, Upload, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const kycStatusConfig = {
  not_submitted: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Not Submitted" },
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Under Review" },
  approved: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Verified" },
  rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Rejected" },
};

export default function Profile() {
  const { user } = useOutletContext();
  const [kycStatus, setKycStatus] = useState(user?.kyc_status || "not_submitted");
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    nationality: "",
    id_type: "",
    id_number: "",
    address: "",
    phone_number: "",
  });
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [existingKyc, setExistingKyc] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    setKycStatus(user?.kyc_status || "not_submitted");
    base44.entities.KYCRequest.filter({ user_email: user.email }, "-created_date", 1).then(data => {
      if (data.length > 0) {
        setExistingKyc(data[0]);
        setKycStatus(data[0].status);
      }
    });
  }, [user?.email, user?.kyc_status]);

  async function handleKYCSubmit(e) {
    e.preventDefault();
    setLoading(true);

    let id_document_url = "";
    let selfie_url = "";

    if (idFile) {
      const res = await base44.integrations.Core.UploadFile({ file: idFile });
      id_document_url = res.file_url;
    }
    if (selfieFile) {
      const res = await base44.integrations.Core.UploadFile({ file: selfieFile });
      selfie_url = res.file_url;
    }

    await base44.entities.KYCRequest.create({
      ...form,
      user_email: user.email,
      id_document_url,
      selfie_url,
      status: "pending",
    });

    await base44.auth.updateMe({ kyc_status: "pending" });

    setKycStatus("pending");
    setLoading(false);
    toast({ title: "KYC submitted", description: "Your verification request is being reviewed." });
  }

  const status = kycStatusConfig[kycStatus] || kycStatusConfig.not_submitted;
  const StatusIcon = status.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Your account and verification details</p>
      </div>

      {/* Account Info */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <User className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold">{user?.full_name || "User"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="ml-auto">
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", status.bg, status.color)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* KYC Form */}
      {(kycStatus === "not_submitted" || kycStatus === "rejected") && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-heading font-semibold">Identity Verification (KYC)</h2>
              <p className="text-xs text-muted-foreground">Submit your documents to verify your identity</p>
            </div>
          </div>

          {kycStatus === "rejected" && existingKyc?.review_notes && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-600 font-medium">Rejection reason:</p>
              <p className="text-sm text-red-500 mt-1">{existingKyc.review_notes}</p>
            </div>
          )}

          <form onSubmit={handleKYCSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Legal Name</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm(p => ({...p, full_name: e.target.value}))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={form.date_of_birth}
                onChange={e => setForm(p => ({...p, date_of_birth: e.target.value}))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input
                value={form.nationality}
                onChange={e => setForm(p => ({...p, nationality: e.target.value}))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={form.phone_number}
                onChange={e => setForm(p => ({...p, phone_number: e.target.value}))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>ID Type</Label>
              <Select value={form.id_type} onValueChange={v => setForm(p => ({...p, id_type: v}))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select ID type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input
                value={form.id_number}
                onChange={e => setForm(p => ({...p, id_number: e.target.value}))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Residential Address</Label>
              <Input
                value={form.address}
                onChange={e => setForm(p => ({...p, address: e.target.value}))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>ID Document</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-accent transition-colors cursor-pointer relative">
                <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">{idFile ? idFile.name : "Upload ID document"}</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setIdFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Selfie Photo</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-accent transition-colors cursor-pointer relative">
                <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">{selfieFile ? selfieFile.name : "Upload selfie"}</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setSelfieFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="sm:col-span-2 mt-2">
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl">
                {loading ? "Submitting..." : "Submit KYC Verification"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {kycStatus === "pending" && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 text-center animate-fade-in">
          <Clock className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-heading font-bold">Verification In Progress</h2>
          <p className="text-sm text-muted-foreground mt-2">Your documents are being reviewed. This usually takes 1-2 business days.</p>
        </div>
      )}

      {kycStatus === "approved" && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center animate-fade-in">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-heading font-bold text-emerald-700">Identity Verified</h2>
          <p className="text-sm text-emerald-600 mt-2">Your account is fully verified. You have access to all features.</p>
        </div>
      )}
    </div>
  );
}