import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatContact } from "./ChatSidebar";
import { avatarColors } from "./ChatSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getMessageOfConnection } from "@/services/message";
import { BACKEND_URL } from "@/config/backend";
import { toast } from "sonner";
import type { Message, Attachment } from "./types";
import ChatHeader from "./area/ChatHeader";
import MessageList from "./area/MessageList";
import ReplyBar from "./area/ReplyBar";
import AttachmentPreviewBar from "./area/AttachmentPreviewBar";
import MessageInput from "./area/MessageInput";
import ImageLightbox from "./area/ImageLightbox";

interface ChatAreaProps {
  contact: ChatContact | null;
  onContactClick: (contact: ChatContact) => void;
  onBack?: () => void;
}

const detectFileType = (url: string): "image" | "video" | "audio" | "file" => {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (["mp4", "mov", "webm", "avi", "mkv", "ogv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"].includes(ext)) return "audio";
  if (url.includes("/image/upload/")) return "image";
  if (url.includes("/video/upload/")) return "video";
  return "file";
};

const ChatArea = ({ contact, onContactClick, onBack }: ChatAreaProps) => {
  const { socket, user } = useAuth();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageOffset, setMessageOffset] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prependScrollSnapshotRef = useRef<{ prevHeight: number; prevTop: number } | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEmittingTypingRef = useRef(false);
  const MESSAGES_PAGE_SIZE = 15;

  const mapServerMessage = (msg: any): Message => {
    const isOwn = String(msg.sender_id) === String(user?.id) || msg.sender === "You";
    const senderName = msg.sender?.name || (isOwn ? "You" : msg.sender_name || contact?.name || "Unknown");
    const time = msg.created_at
      ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
      id: String(msg.id),
      text: msg.text,
      sender: senderName,
      isOwn,
      time,
      status: isOwn ? (msg.is_read ? "read" : "delivered") : undefined,
      attachments: msg.file
        ? [{ name: msg.file.split("/").pop() || "Attachment", type: detectFileType(msg.file), url: msg.file }]
        : undefined,
    };
  };

  const fetchMessages = async (connectionId: string, offset: number, prepend = false) => {
    if (!connectionId) return;
    if (prepend) { setLoadingMore(true); } else { setLoadingMessages(true); setHasMoreMessages(true); }

    try {
      const response = await getMessageOfConnection(Number(connectionId), offset, MESSAGES_PAGE_SIZE);
      const rows = Array.isArray(response.data) ? response.data : [];
      const fetchedMessages = rows.map(mapServerMessage).reverse();

      if (prepend) {
        setMessages((prev) => [...fetchedMessages, ...prev]);
        setMessageOffset((prev) => prev + fetchedMessages.length);
      } else {
        setMessages(fetchedMessages);
        setMessageOffset(fetchedMessages.length);
      }

      if (rows.length < MESSAGES_PAGE_SIZE) setHasMoreMessages(false);

      if (!prepend) {
        window.requestAnimationFrame(() => {
          scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight });
        });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      if (prepend) { setLoadingMore(false); } else { setLoadingMessages(false); }
    }
  };

  useEffect(() => {
    if (!contact) return;
    setMessages([]);
    setMessageOffset(0);
    setHasMoreMessages(true);
    fetchMessages(contact.id, 0, false);
    setIsTyping(false);
    isEmittingTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [contact?.id]);

  useEffect(() => {
    if (!prependScrollSnapshotRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const { prevHeight, prevTop } = prependScrollSnapshotRef.current;
    container.scrollTop = container.scrollHeight - prevHeight + prevTop;
    prependScrollSnapshotRef.current = null;
  }, [messages]);

  const handleLoadMore = async () => {
    if (!contact || loadingMore || loadingMessages || !hasMoreMessages) return;
    const container = scrollContainerRef.current;
    if (container) {
      prependScrollSnapshotRef.current = { prevHeight: container.scrollHeight, prevTop: container.scrollTop };
    }
    await fetchMessages(contact.id, messageOffset, true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 120) handleLoadMore();
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage: any) => {
      if (contact && newMessage.connection_id && String(newMessage.connection_id) !== String(contact.id)) return;

      const formattedMessage: Message = {
        id: String(newMessage.id),
        text: newMessage.text,
        sender: newMessage.sender?.name || contact?.name || "Unknown",
        isOwn: false,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        attachments: newMessage.file
          ? [{ name: newMessage.file.split("/").pop() || "attachment", type: detectFileType(newMessage.file), url: newMessage.file }]
          : undefined,
      };
      setMessages((prev) => [...prev, formattedMessage]);
      setIsTyping(false);

      const senderId = String(newMessage.sender?.id ?? newMessage.sender_id ?? "");
      if (senderId) {
        socket.emit("markRead", { connectionId: String(newMessage.connection_id), senderId });
      }

      window.requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight });
      });
    };

    const handleMessagesRead = ({ connectionId }: { connectionId: string }) => {
      if (!contact || String(contact.id) !== String(connectionId)) return;
      setMessages((prev) => prev.map((m) => (m.isOwn && m.status === "delivered" ? { ...m, status: "read" } : m)));
    };

    const handleTyping = ({ senderId }: { senderId: string }) => {
      if (contact && String(senderId) === String(contact.userId)) setIsTyping(true);
    };

    const handleStopTyping = ({ senderId }: { senderId: string }) => {
      if (contact && String(senderId) === String(contact.userId)) setIsTyping(false);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
    };
  }, [socket, contact]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
        toast.error(`"${file.name}" is not allowed. Only images, audio, and video files are supported.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 10 MB limit.`);
        return;
      }

      let type: Attachment["type"] = "file";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type.startsWith("audio/")) type = "audio";

      setAttachments((prev) => [
        ...prev,
        { id: crypto.randomUUID(), file, type, preview: type === "image" ? URL.createObjectURL(file) : undefined },
      ]);
    });

    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((a) => a.id !== id);
    });
  };

  const emitStopTyping = () => {
    if (!socket || !contact || !isEmittingTypingRef.current) return;
    isEmittingTypingRef.current = false;
    socket.emit("stop_typing", { receiverId: String(contact.userId ?? contact.id) });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (!socket || !contact) return;
    const receiverId = String(contact.userId ?? contact.id);
    if (!isEmittingTypingRef.current) {
      isEmittingTypingRef.current = true;
      socket.emit("typing", { receiverId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(emitStopTyping, 2000);
  };

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (!contact) return;

    emitStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const receiverId = contact.userId ?? contact.id;
    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      text: message.trim(),
      sender: "You",
      isOwn: true,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      attachments: attachments.length > 0
        ? attachments.map((a) => ({ name: a.file.name, type: a.type, url: a.preview || "", size: `${(a.file.size / 1024).toFixed(1)} KB` }))
        : undefined,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    const currentMessage = message.trim();
    const currentAttachments = [...attachments];
    setMessage("");
    setAttachments([]);
    setReplyingTo(null);

    window.requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight });
    });

    try {
      const formData = new FormData();
      formData.append("connectionId", String(contact.id));
      formData.append("receiverId", String(receiverId));
      formData.append("text", currentMessage || "");
      if (currentAttachments.length > 0) formData.append("file", currentAttachments[0].file);

      const response = await fetch(`${BACKEND_URL}/message`, { method: "POST", credentials: "include", body: formData });
      if (!response.ok) throw new Error("Failed to send message");

      setMessages((prev) => prev.map((m) => (m.id === optimisticMessage.id ? { ...m, status: "delivered" } : m)));
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
    }
  };

  if (!contact) {
    return (
      <div className="h-full flex items-center justify-center chat-pattern">
        <div className="text-center space-y-4 opacity-0 animate-scale-in" style={{ animationFillMode: "forwards" }}>
          <div className="w-20 h-20 rounded-3xl avatar-gradient flex items-center justify-center mx-auto shadow-glow">
            <Send className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Welcome to LumoChat</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Select a conversation to start messaging or create a new one</p>
          </div>
        </div>
      </div>
    );
  }

  const contactColor = avatarColors[contact.id] || "from-primary to-primary-glow";
  const isGroupContact = Boolean(contact.emoji || contact.members);

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader
        contact={contact}
        isTyping={isTyping}
        contactColor={contactColor}
        isGroupContact={isGroupContact}
        onContactClick={onContactClick}
        onBack={onBack}
      />

      <MessageList
        messages={messages}
        loadingMore={loadingMore}
        isTyping={isTyping}
        contact={contact}
        contactColor={contactColor}
        scrollContainerRef={scrollContainerRef}
        onScroll={handleScroll}
        onReply={setReplyingTo}
        onLightbox={setLightboxUrl}
      />

      {replyingTo && <ReplyBar replyingTo={replyingTo} onClose={() => setReplyingTo(null)} />}

      {attachments.length > 0 && (
        <AttachmentPreviewBar attachments={attachments} onRemove={removeAttachment} />
      )}

      <MessageInput
        message={message}
        onChange={handleMessageChange}
        onSend={handleSend}
        onAttachClick={() => fileRef.current?.click()}
        fileRef={fileRef}
        onFileSelect={handleFileSelect}
      />

      <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
};

export default ChatArea;
