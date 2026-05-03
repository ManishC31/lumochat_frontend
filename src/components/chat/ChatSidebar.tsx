import { useState, useEffect, useRef } from "react";
import { Pin, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { getRequestsOfUser, updateUserData, updateUserAvatar } from "@/services/user";
import { acceptRequestConnection, getAllConnections, sendNewConnectionRequest } from "@/services/connections";
import { toast } from "sonner";
import UserProfileHeader, { type Tab, type CurrentUser } from "./sidebar/UserProfileHeader";
import ContactRow from "./sidebar/ContactRow";
import RequestRow, { type IRequests } from "./sidebar/RequestRow";
import SectionLabel from "./sidebar/SectionLabel";
import EditProfileDialog from "./sidebar/EditProfileDialog";
import AddConnectionDialog from "./sidebar/AddConnectionDialog";

export interface ChatContact {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  image?: string;
  status?: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  online?: boolean;
  members?: number;
  pinned?: boolean;
  typing?: boolean;
  emoji?: string;
  read?: boolean;
}

export const avatarColors: Record<string, string> = {
  "1": "from-violet-500 to-purple-600",
  "2": "from-rose-500 to-red-500",
  "3": "from-pink-400 to-rose-500",
  "4": "from-blue-500 to-indigo-600",
  "5": "from-amber-400 to-orange-500",
  "6": "from-emerald-500 to-teal-500",
  "7": "from-fuchsia-500 to-pink-500",
  "8": "from-sky-400 to-blue-500",
};

interface ChatSidebarProps {
  selectedId: string;
  onSelect: (contact: ChatContact) => void;
  onContactClick: (contact: ChatContact) => void;
  fullWidth?: boolean;
}

const ChatSidebar = ({ selectedId, onSelect, onContactClick, fullWidth }: ChatSidebarProps) => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("personal");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [contacts, setContacts] = useState<ChatContact[] | null>(null);
  const [requests, setRequests] = useState<IRequests[] | null>(null);

  const { logout, user, socket, refreshUser } = useAuth();

  const currentUser: CurrentUser = {
    name: user?.name ?? "Guest User",
    email: user?.email ?? "guest@example.com",
    image: user?.image,
    status: user?.status ?? "",
    online: true,
  };

  const [editName, setEditName] = useState(currentUser.name);
  const [editStatus, setEditStatus] = useState(currentUser.status);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [requestEmail, setRequestEmail] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => { fetchAllContacts(); }, []);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (onlineUserIds: string[]) => {
      setContacts((prev) =>
        prev ? prev.map((c) => ({ ...c, online: onlineUserIds.includes(String(c.userId)) })) : prev,
      );
    };

    const handleNewMessage = (msg: any) => {
      const connectionId = String(msg.connection_id);
      const preview = msg.text || (msg.file ? "📎 Attachment" : "");
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setContacts((prev) => {
        if (!prev) return prev;
        const updated = prev.map((c) => {
          if (String(c.id) !== connectionId) return c;
          const isOpen = String(c.id) === String(selectedId);
          return { ...c, lastMessage: preview, time, unread: isOpen ? c.unread : (c.unread ?? 0) + 1 };
        });
        const idx = updated.findIndex((c) => String(c.id) === connectionId);
        if (idx > 0) {
          const [moved] = updated.splice(idx, 1);
          updated.unshift(moved);
        }
        return updated;
      });
    };

    socket.on("getOnlineUsers", handleOnlineUsers);
    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("getOnlineUsers", handleOnlineUsers);
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedId]);

  const fetchAllContacts = async () => {
    try {
      const response = await getAllConnections();
      if (response.success && Array.isArray(response.data)) {
        const mappedContacts: ChatContact[] = response.data.map((item: any) => {
          const rawTime = item.last_message_time
            ? new Date(item.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : undefined;
          return {
            id: String(item.connection_id ?? item.id ?? item.user_id),
            userId: item.user_id ? String(item.user_id) : undefined,
            name: item.name || item.email || "Unknown",
            email: item.email,
            image: item.image,
            status: item.status ?? undefined,
            lastMessage: item.last_message ?? undefined,
            time: rawTime,
            unread: item.unread,
            online: item.online,
            members: item.members,
            pinned: item.pinned,
            typing: item.typing,
            emoji: item.emoji,
            read: item.read,
          };
        });
        setContacts(mappedContacts);
      } else {
        setContacts([]);
        toast.error("Unexpected error in fetching connections");
      }
    } catch (err) {
      console.error("fetchAllContacts error:", err);
      setContacts([]);
      toast.error("Failed to load contacts. Check the console for details.");
    }
  };

  const handleSelectContact = (contact: ChatContact) => {
    setContacts((prev) => prev ? prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c)) : prev);
    onSelect(contact);
  };

  const filtered = contacts?.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase())) ?? [];
  const pinned = filtered.filter((c) => c.pinned);
  const others = filtered.filter((c) => !c.pinned);

  const handleTabSwitch = async (tabId: Tab) => {
    setTab(tabId);
    if (tabId === "requests") {
      try {
        const response = await getRequestsOfUser();
        setRequests(response.data || []);
      } catch {
        setRequests([]);
      }
    }
  };

  const handleNewRequest = async () => {
    setConnectionError("");
    try {
      const response = await sendNewConnectionRequest({ email: requestEmail });
      if (response.success) {
        toast.success(response.message || "Connection request sent successfully.");
        setConnectionOpen(false);
        setRequestEmail("");
      } else {
        setConnectionError(response.error || response.message || "Failed to send connection request.");
      }
    } catch (error) {
      setConnectionError((error as Error)?.message || "Unexpected error while sending connection request.");
    }
  };

  const handleAcceptRequest = async (request: IRequests) => {
    try {
      const response = await acceptRequestConnection(request.connection_id);
      if (response.success) {
        toast.success(response.message || "Request accepted.");
      } else {
        toast.error(response.message || "Failed to accept request.");
      }
    } catch (error) {
      toast.error((error as Error)?.message || "Unexpected error while accepting request.");
    }
    setRequests((prev) => prev?.filter((item) => item.first_user !== request.first_user || item.second_user !== request.second_user) ?? null);
  };

  const handleRejectRequest = (request: IRequests) => {
    setRequests((prev) => prev?.filter((item) => item.first_user !== request.first_user || item.second_user !== request.second_user) ?? null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed."); return; }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarUploading(true);

    try {
      const response = await updateUserAvatar(file);
      if (response.success) {
        toast.success("Avatar updated.");
        await refreshUser();
      } else {
        toast.error(response.message || "Failed to update avatar.");
        setAvatarPreview(null);
      }
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to update avatar.");
      setAvatarPreview(null);
    } finally {
      URL.revokeObjectURL(previewUrl);
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleUserDataUpdate = async () => {
    setProfileError("");
    try {
      const response = await updateUserData({ name: editName, status: editStatus });
      if (response.success) {
        toast.success(response.message || "Profile updated.");
        await refreshUser();
        setSettingsOpen(false);
      } else {
        setProfileError(response.error || response.message || "Failed to update profile.");
      }
    } catch (err) {
      setProfileError((err as Error)?.message || "Failed to update profile.");
    }
  };

  return (
    <div className={cn("flex flex-col bg-card h-full border-r border-border/60", fullWidth ? "w-full" : "w-[340px]")}>
      <UserProfileHeader
        currentUser={currentUser}
        search={search}
        onSearchChange={setSearch}
        tab={tab}
        onTabSwitch={handleTabSwitch}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenConnection={() => setConnectionOpen(true)}
        onLogout={logout}
      />

      <ScrollArea className="flex-1 px-2">
        {tab === "requests" ? (
          <div className="space-y-3 py-3">
            <SectionLabel icon={<Users className="w-3 h-3" />} label="Requests" />
            {requests === null ? (
              <p className="px-4 text-sm text-muted-foreground">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="px-4 text-sm text-muted-foreground">No pending requests.</p>
            ) : (
              <div className="space-y-2 pb-4">
                {requests.map((request, index) => (
                  <RequestRow
                    key={`${request.first_user}-${request.second_user}-${request.email}-${index}`}
                    request={request}
                    onAccept={handleAcceptRequest}
                    onReject={handleRejectRequest}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <SectionLabel icon={<Pin className="w-3 h-3" />} label="Pinned Message" />
                <div className="space-y-0.5 pb-2">
                  {pinned.map((contact, i) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      selected={selectedId === contact.id}
                      onSelect={handleSelectContact}
                      onAvatarClick={onContactClick}
                      index={i}
                      pinned
                    />
                  ))}
                </div>
              </>
            )}

            {others.length > 0 && (
              <>
                <SectionLabel icon={<MessageSquare className="w-3 h-3" />} label="Messages" />
                <div className="space-y-0.5 pb-4">
                  {others.map((contact, i) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      selected={selectedId === contact.id}
                      onSelect={handleSelectContact}
                      onAvatarClick={onContactClick}
                      index={i}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </ScrollArea>

      <EditProfileDialog
        open={settingsOpen}
        onOpenChange={(v) => { setSettingsOpen(v); if (!v) setProfileError(""); }}
        currentUser={currentUser}
        editName={editName}
        setEditName={setEditName}
        editStatus={editStatus}
        setEditStatus={setEditStatus}
        avatarPreview={avatarPreview}
        avatarUploading={avatarUploading}
        avatarFileRef={avatarFileRef}
        onAvatarChange={handleAvatarChange}
        onSave={handleUserDataUpdate}
        error={profileError}
      />

      <AddConnectionDialog
        open={connectionOpen}
        onOpenChange={(v) => { setConnectionOpen(v); if (!v) { setConnectionError(""); setRequestEmail(""); } }}
        requestEmail={requestEmail}
        setRequestEmail={setRequestEmail}
        onSend={handleNewRequest}
        error={connectionError}
      />
    </div>
  );
};

export default ChatSidebar;
