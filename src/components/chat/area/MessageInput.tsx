import { Send, Plus } from "lucide-react";

interface MessageInputProps {
  message: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onAttachClick: () => void;
  fileRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MessageInput = ({ message, onChange, onSend, onAttachClick, fileRef, onFileSelect }: MessageInputProps) => (
  <div className="px-4 sm:px-6 py-4 border-t border-border/60 bg-card">
    <div className="flex items-center gap-2 max-w-3xl mx-auto">
      <div className="flex-1 flex items-center bg-muted/60 rounded-full px-4 py-2">
        <textarea
          value={message}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Write a message…"
          rows={1}
          className="flex-1 bg-transparent border-0 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none max-h-32"
        />
      </div>
      <button
        onClick={onAttachClick}
        className="w-11 h-11 rounded-full border-2 border-border hover:border-primary hover:text-primary text-muted-foreground flex items-center justify-center transition-all shrink-0"
        title="Attach"
      >
        <Plus className="w-5 h-5" />
      </button>
      <button
        onClick={onSend}
        className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-glow shrink-0"
        title="Send"
      >
        <Send className="w-[18px] h-[18px]" />
      </button>
    </div>
    <input ref={fileRef} type="file" multiple accept="image/*,audio/*,video/*" className="hidden" onChange={onFileSelect} />
  </div>
);

export default MessageInput;
