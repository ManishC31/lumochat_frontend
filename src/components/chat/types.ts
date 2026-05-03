export interface Attachment {
  id: string;
  file: File;
  type: "image" | "video" | "audio" | "file";
  preview?: string;
}

export interface Message {
  id: string;
  text?: string;
  sender: string;
  isOwn: boolean;
  time: string;
  status?: "sent" | "delivered" | "read";
  replyTo?: { sender: string; text: string };
  attachments?: { name: string; type: "image" | "video" | "audio" | "file"; url: string; size?: string }[];
}
