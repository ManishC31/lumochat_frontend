import { X, Video, Mic, File as FileIcon } from "lucide-react";
import type { Attachment } from "../types";

interface AttachmentPreviewBarProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

const AttachmentPreviewBar = ({ attachments, onRemove }: AttachmentPreviewBarProps) => (
  <div className="px-6 py-3 flex gap-2.5 flex-wrap border-t border-border/60 bg-card/80 glass">
    {attachments.map((att) => (
      <div key={att.id} className="relative group">
        {att.type === "image" && att.preview ? (
          <img src={att.preview} alt="" className="w-16 h-16 rounded-xl object-cover shadow-soft" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-muted/60 border border-border/40 flex flex-col items-center justify-center gap-1">
            {att.type === "video" && <Video className="w-4 h-4 text-primary" />}
            {att.type === "audio" && <Mic className="w-4 h-4 text-primary" />}
            {att.type === "file" && <FileIcon className="w-4 h-4 text-primary" />}
            <span className="text-[9px] text-muted-foreground font-medium truncate max-w-[56px]">
              {att.file.name.split(".").pop()?.toUpperCase()}
            </span>
          </div>
        )}
        <button
          onClick={() => onRemove(att.id)}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-soft"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    ))}
  </div>
);

export default AttachmentPreviewBar;
