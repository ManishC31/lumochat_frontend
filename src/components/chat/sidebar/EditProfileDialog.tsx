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
}: EditProfileDialogProps) => (
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
          {[
            { label: "Name", value: editName, set: setEditName },
            { label: "Status", value: editStatus, set: setEditStatus },
          ].map((field) => (
            <div key={field.label}>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">{field.label}</label>
              <input
                type="text"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-muted/70 border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          ))}
        </div>

        <button
          onClick={onSave}
          className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-glow"
        >
          Save Changes
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

export default EditProfileDialog;
