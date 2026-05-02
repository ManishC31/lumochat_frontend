import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  sender: string;
  isOwn?: boolean;
  delay?: string;
}

const ChatBubble = ({ message, sender, isOwn = false, delay = "0s" }: ChatBubbleProps) => (
  <div
    className={cn(
      "flex gap-2.5 opacity-0 animate-slide-up",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}
    style={{ animationDelay: delay }}
  >
    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold text-white/80 shrink-0">
      {sender[0]}
    </div>
    <div
      className={cn(
        "px-4 py-2.5 rounded-2xl max-w-[220px] text-sm leading-relaxed",
        isOwn
          ? "bg-accent text-accent-foreground rounded-br-md"
          : "bg-white/10 text-white/90 rounded-bl-md"
      )}
    >
      {message}
    </div>
  </div>
);

export default ChatBubble;
