import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Image as ImageIcon,
  File as FileIcon,
  X,
  Play,
  Pause,
  Users,
  Check,
  CheckCheck,
  Reply,
  Forward,
  Trash2,
  Copy,
  Mic,
  Download,
  Search,
  Plus,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import type { ChatContact } from "./ChatSidebar";
import { avatarColors } from "./ChatSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getMessageOfConnection } from "@/services/message";
import { BACKEND_URL } from "@/config/backend";
import { toast } from "sonner";

interface Attachment {
  id: string;
  file: File;
  type: "image" | "video" | "audio" | "file";
  preview?: string;
}

interface Message {
  id: string;
  text?: string;
  sender: string;
  isOwn: boolean;
  time: string;
  status?: "sent" | "delivered" | "read";
  replyTo?: { sender: string; text: string };
  attachments?: { name: string; type: "image" | "video" | "audio" | "file"; url: string; size?: string }[];
}

const AudioPlayer = ({ url, isOwn }: { url: string; isOwn: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
    setPlaying(!playing);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl w-72 border", isOwn ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
      <button
        onClick={togglePlay}
        className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", isOwn ? "bg-primary-foreground/20" : "bg-primary")}
      >
        {playing
          ? <Pause className="w-4 h-4 text-primary-foreground" />
          : <Play className="w-4 h-4 text-primary-foreground ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className={cn("h-1.5 rounded-full overflow-hidden cursor-pointer", isOwn ? "bg-primary-foreground/20" : "bg-muted")}
          onClick={handleSeek}
        >
          <div className={cn("h-full rounded-full transition-[width]", isOwn ? "bg-primary-foreground" : "bg-primary")} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className={cn("text-[10px] font-medium", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}>{fmt(currentTime)}</span>
          <span className={cn("text-[10px] font-medium", isOwn ? "text-primary-foreground/80" : "text-muted-foreground")}>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const StatusIcon = ({ status, className }: { status?: string; className?: string }) => {
  if (!status) return null;
  if (status === "sent") return <Check className={cn("w-3.5 h-3.5 text-muted-foreground", className)} />;
  if (status === "delivered") return <CheckCheck className={cn("w-3.5 h-3.5 text-muted-foreground", className)} />;
  if (status === "read") return <CheckCheck className={cn("w-3.5 h-3.5 text-primary", className)} />;
  return null;
};

interface ChatAreaProps {
  contact: ChatContact | null;
  onContactClick: (contact: ChatContact) => void;
  onBack?: () => void;
}

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
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prependScrollSnapshotRef = useRef<{ prevHeight: number; prevTop: number } | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEmittingTypingRef = useRef(false);
  const MESSAGES_PAGE_SIZE = 15;
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxUrl(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

  const detectFileType = (url: string): "image" | "video" | "audio" | "file" => {
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
    if (["mp4", "mov", "webm", "avi", "mkv", "ogv"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"].includes(ext)) return "audio";
    // fallback: check Cloudinary resource path
    if (url.includes("/image/upload/")) return "image";
    if (url.includes("/video/upload/")) return "video";
    return "file";
  };

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
        ? [
            {
              name: msg.file.split("/").pop() || "Attachment",
              type: detectFileType(msg.file),
              url: msg.file,
            },
          ]
        : undefined,
    };
  };

  const fetchMessages = async (connectionId: string, offset: number, prepend = false) => {
    if (!connectionId) return;

    if (prepend) {
      setLoadingMore(true);
    } else {
      setLoadingMessages(true);
      setHasMoreMessages(true);
    }

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

      if (rows.length < MESSAGES_PAGE_SIZE) {
        setHasMoreMessages(false);
      }

      if (!prepend) {
        window.requestAnimationFrame(() => {
          scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight });
        });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      if (prepend) {
        setLoadingMore(false);
      } else {
        setLoadingMessages(false);
      }
    }
  };

  const loadMessagesForContact = async () => {
    if (!contact) return;

    setMessages([]);
    setMessageOffset(0);
    setHasMoreMessages(true);
    await fetchMessages(contact.id, 0, false);
  };

  useEffect(() => {
    loadMessagesForContact();
    setIsTyping(false);
    isEmittingTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [contact?.id]);

  const handleLoadMore = async () => {
    if (!contact || loadingMore || loadingMessages || !hasMoreMessages) return;

    const container = scrollContainerRef.current;
    if (container) {
      prependScrollSnapshotRef.current = {
        prevHeight: container.scrollHeight,
        prevTop: container.scrollTop,
      };
    }

    await fetchMessages(contact.id, messageOffset, true);
  };

  useEffect(() => {
    if (!prependScrollSnapshotRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const { prevHeight, prevTop } = prependScrollSnapshotRef.current;
    container.scrollTop = container.scrollHeight - prevHeight + prevTop;
    prependScrollSnapshotRef.current = null;
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop < 120) {
      handleLoadMore();
    }
  };

  // Listen for new messages and typing events from socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage: any) => {
      if (contact && newMessage.connection_id && String(newMessage.connection_id) !== String(contact.id)) {
        return;
      }

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

      // Receiver is actively viewing this chat — mark as read immediately
      const senderId = String(newMessage.sender?.id ?? newMessage.sender_id ?? "");
      if (senderId) {
        socket.emit("markRead", {
          connectionId: String(newMessage.connection_id),
          senderId,
        });
      }

      window.requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight });
      });
    };

    const handleMessagesRead = ({ connectionId }: { connectionId: string }) => {
      if (!contact || String(contact.id) !== String(connectionId)) return;
      setMessages((prev) =>
        prev.map((m) => (m.isOwn && m.status === "delivered" ? { ...m, status: "read" } : m)),
      );
    };

    const handleTyping = ({ senderId }: { senderId: string }) => {
      if (contact && String(senderId) === String(contact.userId)) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }: { senderId: string }) => {
      if (contact && String(senderId) === String(contact.userId)) {
        setIsTyping(false);
      }
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

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

      const attachment: Attachment = {
        id: crypto.randomUUID(),
        file,
        type,
        preview: type === "image" ? URL.createObjectURL(file) : undefined,
      };
      setAttachments((prev) => [...prev, attachment]);
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
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 2000);
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
      attachments:
        attachments.length > 0
          ? attachments.map((a) => ({
              name: a.file.name,
              type: a.type,
              url: a.preview || "",
              size: `${(a.file.size / 1024).toFixed(1)} KB`,
            }))
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

      if (currentAttachments.length > 0) {
        formData.append("file", currentAttachments[0].file);
      }

      const response = await fetch(`${BACKEND_URL}/message`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

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
  const contactSubtitle = contact.email;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
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
                  contact.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
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
                  <span>{contactSubtitle}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 chat-pattern overflow-y-auto">
        <div className="px-6 py-6 space-y-5 max-w-3xl mx-auto">
          {loadingMore && <div className="flex items-center justify-center text-[12px] text-muted-foreground pb-3">Loading older messages...</div>}

          {/* Date separator */}
          <div className="flex items-center justify-center">
            <span className="text-[12px] text-muted-foreground font-medium">Today</span>
          </div>

          {messages.map((msg, index) => {
            const senderColor = msg.isOwn
              ? "from-amber-400 to-orange-500"
              : msg.sender === "Harry Maguire"
                ? "from-violet-500 to-purple-600"
                : msg.sender === "Bruno Fernandes"
                  ? "from-sky-400 to-blue-500"
                  : contactColor;
            const initials = msg.sender
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2);

            return (
              <ContextMenu key={msg.id}>
                <ContextMenuTrigger>
                  <div
                    className={cn("flex gap-3 opacity-0 animate-fade-in group", msg.isOwn ? "flex-row-reverse" : "flex-row")}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0 bg-gradient-to-br",
                        senderColor,
                      )}
                    >
                      {msg.isOwn ? "YO" : initials}
                    </div>

                    <div className={cn("max-w-[75%] flex flex-col gap-1.5 min-w-0", msg.isOwn && "items-end")}>
                      {/* Sender + dot + time ABOVE bubble */}
                      <div className={cn("flex items-center gap-1.5 px-1", msg.isOwn && "flex-row-reverse")}>
                        <span className="text-[12.5px] font-semibold text-foreground">{msg.isOwn ? "You" : msg.sender}</span>
                        <span className="text-muted-foreground/60 text-[10px]">•</span>
                        <span className="text-[11.5px] text-muted-foreground font-medium">{msg.time}</span>
                        {msg.isOwn && msg.status && <StatusIcon status={msg.status} className="ml-0.5" />}
                      </div>

                      {/* Reply preview */}
                      {msg.replyTo && (
                        <div className="px-3 py-2 rounded-2xl border-l-[3px] border-primary bg-primary/5 text-xs">
                          <p className="font-semibold text-primary text-[11px]">{msg.replyTo.sender}</p>
                          <p className="text-muted-foreground truncate mt-0.5">{msg.replyTo.text}</p>
                        </div>
                      )}

                      {/* Attachments */}
                      {msg.attachments?.map((att) => (
                        <div key={att.name}>
                          {att.type === "image" && (
                            <div
                              className="relative group/img rounded-2xl overflow-hidden border border-border bg-card cursor-zoom-in"
                              onClick={() => setLightboxUrl(att.url)}
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
                            <video
                              src={att.url}
                              controls
                              className="w-72 max-h-52 rounded-2xl border border-border object-cover bg-black"
                            />
                          )}
                          {att.type === "audio" && (
                            <AudioPlayer url={att.url} isOwn={msg.isOwn} />
                          )}
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

                      {/* Text bubble */}
                      {msg.text && (
                        <div className="relative">
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
                        </div>
                      )}
                    </div>

                    {/* More dots that appear on hover */}
                    <button className="self-center opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="rounded-2xl shadow-elevated p-1.5">
                  <ContextMenuItem onClick={() => setReplyingTo(msg)} className="rounded-xl py-2.5 px-3">
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
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0 bg-gradient-to-br",
                  contactColor,
                )}
              >
                {contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="bg-card px-5 py-3.5 rounded-2xl rounded-tl-md border border-border">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-typing-bounce" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-typing-bounce" style={{ animationDelay: "200ms" }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-typing-bounce" style={{ animationDelay: "400ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply bar */}
      {replyingTo && (
        <div className="px-6 py-3 border-t border-border/60 flex items-center gap-3 bg-card/80 glass">
          <div className="w-1 h-10 rounded-full avatar-gradient" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary">{replyingTo.sender}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{replyingTo.text || "Attachment"}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment preview */}
      {attachments.length > 0 && (
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
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-soft"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 sm:px-6 py-4 border-t border-border/60 bg-card">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          {/* Pill input with emoji icon inside */}
          <div className="flex-1 flex items-center bg-muted/60 rounded-full px-4 py-2">
            <textarea
              value={message}
              onChange={handleMessageChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write a message…"
              rows={1}
              className="flex-1 bg-transparent border-0 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none max-h-32"
            />
          </div>

          {/* Attach button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-11 h-11 rounded-full border-2 border-border hover:border-primary hover:text-primary text-muted-foreground flex items-center justify-center transition-all shrink-0"
            title="Attach"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-glow shrink-0"
            title="Send"
          >
            <Send className="w-[18px] h-[18px]" />
          </button>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*,audio/*,video/*" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightboxUrl}
            download
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
