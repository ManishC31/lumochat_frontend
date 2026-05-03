import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import type { CurrentUser } from "./UserProfileHeader";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentUser: CurrentUser;
  editName: string;
  setEditName: (v: string) => void;
  editStatus: string;
  setEditStatus: (v: string) => void;
  avatarPreview: string | null;
  avatarUploading: boolean;
  avatarFileRef: React.RefObject<HTMLInputElement>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  error?: string;
}

const EditProfileDialog = ({
  open,
  onOpenChange,
  currentUser,
  editName,
  setEditName,
  editStatus,
  setEditStatus,
  avatarPreview,
  avatarUploading,
  avatarFileRef,
  onAvatarChange,
  onSave,
  error,
}: EditProfileDialogProps) => {
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) setValidationError("");
  }, [open]);

  const handleSave = () => {
    if (!editName.trim()) {
      setValidationError("Name is required.");
      return;
    }
    setValidationError("");
    onSave();
  };

  const displayError = validationError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-3xl shadow-elevated">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <div className="flex justify-center">
            <div
              className="relative group cursor-pointer"
              onClick={() => !avatarUploading && avatarFileRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-3xl shadow-medium">
                {avatarPreview || currentUser.image ? (
                  <img src={avatarPreview ?? currentUser.image} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-foreground/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all gap-1">
                <Camera className="w-6 h-6 text-background" />
                <span className="text-[10px] text-background font-semibold">
                  {avatarUploading ? "Uploading…" : "Change"}
                </span>
              </div>
            </div>
            <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setValidationError(""); }}
                className={`w-full h-11 px-4 rounded-2xl bg-muted/70 border-0 text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${validationError ? "ring-2 ring-destructive/50" : "focus:ring-primary/30"}`}
              />
              {validationError && <p className="text-xs text-destructive mt-1 ml-1">{validationError}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Status</label>
              <input
                type="text"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-muted/70 border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {error && !validationError && <p className="text-xs text-destructive ml-1">{error}</p>}

          <button
            onClick={handleSave}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-glow"
          >
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
