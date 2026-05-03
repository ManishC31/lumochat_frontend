import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatContact } from "../ChatSidebar";

interface ChatHeaderProps {
  contact: ChatContact;
  isTyping: boolean;
  contactColor: string;
  isGroupContact: boolean;
  onContactClick: (contact: ChatContact) => void;
  onBack?: () => void;
}

const ChatHeader = ({ contact, isTyping, contactColor, isGroupContact, onContactClick, onBack }: ChatHeaderProps) => (
  <div className="h-[76px] border-b border-border/60 flex items-center justify-between px-4 sm:px-6 bg-card">
    <div className="flex items-center gap-2 min-w-0">
      {onBack && (
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all mr-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={() => onContactClick(contact)}>
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden bg-gradient-to-br",
              isGroupContact ? "from-rose-100 to-pink-200" : contactColor,
            )}
          >
            {contact.image ? (
              <img src={contact.image} alt={contact.name} className="w-full h-full object-cover" />
            ) : contact.emoji ? (
              <span className="text-2xl">{contact.emoji}</span>
            ) : (
              contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
            )}
          </div>
          {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-accent border-2 border-card" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-[15px] text-foreground truncate group-hover:text-primary transition-colors">{contact.name}</h3>
            {contact.emoji && <span className="text-base leading-none">📗</span>}
          </div>
          <p className="text-[12.5px] mt-0.5 text-muted-foreground truncate">
            {isTyping ? (
              <span className="text-accent font-medium">{contact.name.split(" ")[0]} is typing…</span>
            ) : contact.online ? (
              <span className="text-accent font-medium">Online</span>
            ) : (
              <span>{contact.email}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default ChatHeader;
