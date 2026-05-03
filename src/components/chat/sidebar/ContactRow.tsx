import { Pin, Users, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatarColors } from "../ChatSidebar";
import type { ChatContact } from "../ChatSidebar";

interface ContactRowProps {
  contact: ChatContact;
  selected: boolean;
  onSelect: (c: ChatContact) => void;
  onAvatarClick: (c: ChatContact) => void;
  index: number;
  pinned?: boolean;
}

const ContactRow = ({ contact, selected, onSelect, onAvatarClick, index, pinned }: ContactRowProps) => {
  const isGroupContact = Boolean(contact.emoji || contact.members);

  return (
    <button
      onClick={() => onSelect(contact)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-150 opacity-0 animate-fade-in",
        selected ? "bg-card shadow-medium ring-1 ring-border" : "hover:bg-muted/60",
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div
        className="relative shrink-0"
        onClick={(e) => { e.stopPropagation(); onAvatarClick(contact); }}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm text-white bg-gradient-to-br relative overflow-hidden",
            isGroupContact ? "bg-gradient-to-br from-rose-100 to-pink-200" : avatarColors[contact.id] || "from-primary to-primary-glow",
          )}
        >
          {contact.image ? (
            <img src={contact.image} alt={contact.name} className="w-full h-full object-cover" />
          ) : contact.emoji ? (
            <span className="text-2xl">{contact.emoji}</span>
          ) : isGroupContact ? (
            <Users className="w-5 h-5" />
          ) : (
            <span className="text-sm">{contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
          )}
        </div>
        {!isGroupContact && contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-accent border-2 border-card" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[14px] truncate text-foreground">{contact.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            {pinned && <Pin className="w-3 h-3 text-muted-foreground/70" />}
            <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">{contact.time}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn("text-[12.5px] truncate leading-snug", contact.typing ? "text-accent font-medium" : "text-muted-foreground")}>
            {contact.lastMessage}
          </p>
          {contact.unread && contact.unread > 0 ? (
            <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {contact.unread}
            </span>
          ) : contact.read ? (
            <CheckCheck className="w-4 h-4 text-primary shrink-0" />
          ) : null}
        </div>
      </div>
    </button>
  );
};

export default ContactRow;
