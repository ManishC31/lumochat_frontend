import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  contactName: string;
  contactColor: string;
}

const TypingIndicator = ({ contactName, contactColor }: TypingIndicatorProps) => (
  <div className="flex gap-3">
    <div
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0 bg-gradient-to-br",
        contactColor,
      )}
    >
      {contactName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
    <div className="bg-card px-5 py-3.5 rounded-2xl rounded-tl-md border border-border">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-typing-bounce" />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-typing-bounce" style={{ animationDelay: "200ms" }} />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-typing-bounce" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  </div>
);

export default TypingIndicator;
