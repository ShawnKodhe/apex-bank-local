import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, FileText, Camera } from "lucide-react";
import moment from "moment";

export default function KYCReviewDialog({ kyc, open, onOpenChange, onAction }) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAction(action) {
    setLoading(true);
    await onAction(kyc.id, action, notes);
    setLoading(false);
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">KYC Review — {kyc.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Full Name</p>
              <p className="font-medium">{kyc.full_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p className="font-medium">{kyc.user_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Date of Birth</p>
              <p className="font-medium">{kyc.date_of_birth ? moment(kyc.date_of_birth).format("MMM DD, YYYY") : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Nationality</p>
              <p className="font-medium">{kyc.nationality || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">ID Type</p>
              <p className="font-medium capitalize">{kyc.id_type?.replace("_", " ") || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">ID Number</p>
              <p className="font-medium">{kyc.id_number || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Address</p>
              <p className="font-medium">{kyc.address || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Phone</p>
              <p className="font-medium">{kyc.phone_number || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Submitted</p>
              <p className="font-medium">{moment(kyc.created_date).format("MMM DD, YYYY h:mm A")}</p>
            </div>
          </div>

          {/* Documents */}
          <div className="grid grid-cols-2 gap-3">
            {kyc.id_document_url && (
              <a href={kyc.id_document_url} target="_blank" rel="noopener noreferrer"
                className="border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs font-medium">View ID Document</span>
              </a>
            )}
            {kyc.selfie_url && (
              <a href={kyc.selfie_url} target="_blank" rel="noopener noreferrer"
                className="border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs font-medium">View Selfie</span>
              </a>
            )}
          </div>

          {/* Review Notes */}
          {kyc.status === "pending" && (
            <>
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  placeholder="Add notes about this review..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAction("approved")}
                  disabled={loading}
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </Button>
                <Button
                  onClick={() => handleAction("rejected")}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1 gap-2 rounded-xl"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </div>
            </>
          )}

          {kyc.status !== "pending" && kyc.review_notes && (
            <div className="bg-muted rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Review Notes</p>
              <p className="text-sm">{kyc.review_notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}