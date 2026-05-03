import { X } from "lucide-react";
import type { Message } from "../types";

interface ReplyBarProps {
  replyingTo: Message;
  onClose: () => void;
}

const ReplyBar = ({ replyingTo, onClose }: ReplyBarProps) => (
  <div className="px-6 py-3 border-t border-border/60 flex items-center gap-3 bg-card/80 glass">
    <div className="w-1 h-10 rounded-full avatar-gradient" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-primary">{replyingTo.sender}</p>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{replyingTo.text || "Attachment"}</p>
    </div>
    <button
      onClick={onClose}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

export default ReplyBar;
