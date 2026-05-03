import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  requestEmail: string;
  setRequestEmail: (v: string) => void;
  onSend: () => void;
}

const AddConnectionDialog = ({ open, onOpenChange, requestEmail, setRequestEmail, onSend }: AddConnectionDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm rounded-3xl shadow-elevated">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">Add New Connection</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 pt-2">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Email Address</label>
          <input
            type="text"
            value={requestEmail}
            onChange={(e) => setRequestEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-2xl bg-muted/70 border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <button
          onClick={onSend}
          className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-glow"
        >
          Send Request
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

export default AddConnectionDialog;
