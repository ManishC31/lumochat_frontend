import type { ChatContact } from "../ChatSidebar";
import type { Message } from "../types";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface MessageListProps {
  messages: Message[];
  loadingMore: boolean;
  isTyping: boolean;
  contact: ChatContact;
  contactColor: string;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onReply: (msg: Message) => void;
  onLightbox: (url: string) => void;
}

const MessageList = ({
  messages,
  loadingMore,
  isTyping,
  contact,
  contactColor,
  scrollContainerRef,
  onScroll,
  onReply,
  onLightbox,
}: MessageListProps) => (
  <div ref={scrollContainerRef} onScroll={onScroll} className="flex-1 chat-pattern overflow-y-auto">
    <div className="px-6 py-6 space-y-5 max-w-3xl mx-auto">
      {loadingMore && (
        <div className="flex items-center justify-center text-[12px] text-muted-foreground pb-3">
          Loading older messages...
        </div>
      )}

      <div className="flex items-center justify-center">
        <span className="text-[12px] text-muted-foreground font-medium">Today</span>
      </div>

      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.id}
          msg={msg}
          index={index}
          contactColor={contactColor}
          onReply={onReply}
          onLightbox={onLightbox}
        />
      ))}

      {isTyping && (
        <TypingIndicator contactName={contact.name} contactColor={contactColor} />
      )}
    </div>
  </div>
);

export default MessageList;
