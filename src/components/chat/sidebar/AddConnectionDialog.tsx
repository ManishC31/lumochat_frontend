import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  requestEmail: string;
  setRequestEmail: (v: string) => void;
  onSend: () => void;
  error?: string;
}

const AddConnectionDialog = ({ open, onOpenChange, requestEmail, setRequestEmail, onSend, error }: AddConnectionDialogProps) => {
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) setValidationError("");
  }, [open]);

  const handleSend = () => {
    if (!requestEmail.trim()) {
      setValidationError("Email is required.");
      return;
    }
    if (!EMAIL_RE.test(requestEmail.trim())) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    setValidationError("");
    onSend();
  };

  const displayError = validationError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-3xl shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add New Connection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Email Address</label>
            <input
              type="text"
              value={requestEmail}
              onChange={(e) => { setRequestEmail(e.target.value); setValidationError(""); }}
              placeholder="friend@example.com"
              className={`w-full h-11 px-4 rounded-2xl bg-muted/70 border-0 text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${displayError ? "ring-2 ring-destructive/50" : "focus:ring-primary/30"}`}
            />
            {displayError && <p className="text-xs text-destructive mt-1 ml-1">{displayError}</p>}
          </div>
          <button
            onClick={handleSend}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-glow"
          >
            Send Request
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddConnectionDialog;
