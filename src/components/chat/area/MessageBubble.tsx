import { MoreVertical, Reply, Forward, Trash2, Copy, ZoomIn, Download, File as FileIcon } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import AudioPlayer from "./AudioPlayer";
import StatusIcon from "./StatusIcon";
import type { Message } from "../types";

interface MessageBubbleProps {
  msg: Message;
  index: number;
  contactColor: string;
  onReply: (msg: Message) => void;
  onLightbox: (url: string) => void;
}

const MessageBubble = ({ msg, index, contactColor, onReply, onLightbox }: MessageBubbleProps) => {
  const senderColor = msg.isOwn
    ? "from-amber-400 to-orange-500"
    : msg.sender === "Harry Maguire"
      ? "from-violet-500 to-purple-600"
      : msg.sender === "Bruno Fernandes"
        ? "from-sky-400 to-blue-500"
        : contactColor;
  const initials = msg.sender.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn("flex gap-3 opacity-0 animate-fade-in group", msg.isOwn ? "flex-row-reverse" : "flex-row")}
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
        >
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0 bg-gradient-to-br",
              senderColor,
            )}
          >
            {msg.isOwn ? "YO" : initials}
          </div>

          <div className={cn("max-w-[75%] flex flex-col gap-1.5 min-w-0", msg.isOwn && "items-end")}>
            <div className={cn("flex items-center gap-1.5 px-1", msg.isOwn && "flex-row-reverse")}>
              <span className="text-[12.5px] font-semibold text-foreground">{msg.isOwn ? "You" : msg.sender}</span>
              <span className="text-muted-foreground/60 text-[10px]">•</span>
              <span className="text-[11.5px] text-muted-foreground font-medium">{msg.time}</span>
              {msg.isOwn && msg.status && <StatusIcon status={msg.status} className="ml-0.5" />}
            </div>

            {msg.replyTo && (
              <div className="px-3 py-2 rounded-2xl border-l-[3px] border-primary bg-primary/5 text-xs">
                <p className="font-semibold text-primary text-[11px]">{msg.replyTo.sender}</p>
                <p className="text-muted-foreground truncate mt-0.5">{msg.replyTo.text}</p>
              </div>
            )}

            {msg.attachments?.map((att) => (
              <div key={att.name}>
                {att.type === "image" && (
                  <div
                    className="relative group/img rounded-2xl overflow-hidden border border-border bg-card cursor-zoom-in"
                    onClick={() => onLightbox(att.url)}
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="max-w-full w-72 object-cover transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-between p-3">
                      <span className="text-[11px] text-white font-medium truncate max-w-[70%]">{att.name}</span>
                      <div className="flex gap-1.5">
                        <span className="w-7 h-7 rounded-full bg-background/30 backdrop-blur flex items-center justify-center text-white">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </span>
                        <a
                          href={att.url}
                          download
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 rounded-full bg-background/30 backdrop-blur flex items-center justify-center text-white"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                {att.type === "video" && (
                  <video src={att.url} controls className="w-72 max-h-52 rounded-2xl border border-border object-cover bg-black" />
                )}
                {att.type === "audio" && <AudioPlayer url={att.url} isOwn={msg.isOwn} />}
                {att.type === "file" && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card cursor-pointer hover:bg-muted/40 transition-all border border-border group/f">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{att.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{att.size || "Document"}</p>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover/f:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            ))}

            {msg.text && (
              <div
                className={cn(
                  "px-4 py-3 text-[13.5px] leading-relaxed",
                  msg.isOwn
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                    : "bg-card text-foreground rounded-2xl rounded-tl-md border border-border",
                )}
              >
                {msg.text}
              </div>
            )}
          </div>

          <button className="self-center opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="rounded-2xl shadow-elevated p-1.5">
        <ContextMenuItem onClick={() => onReply(msg)} className="rounded-xl py-2.5 px-3">
          <Reply className="w-4 h-4 mr-2.5" /> Reply
        </ContextMenuItem>
        <ContextMenuItem className="rounded-xl py-2.5 px-3">
          <Forward className="w-4 h-4 mr-2.5" /> Forward
        </ContextMenuItem>
        <ContextMenuItem className="rounded-xl py-2.5 px-3">
          <Copy className="w-4 h-4 mr-2.5" /> Copy
        </ContextMenuItem>
        <ContextMenuSeparator className="my-1" />
        <ContextMenuItem className="text-destructive rounded-xl py-2.5 px-3">
          <Trash2 className="w-4 h-4 mr-2.5" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessageBubble;
