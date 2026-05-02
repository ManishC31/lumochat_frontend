import { useState, useEffect } from "react";
import { Search, Users, Settings, LogOut, Edit2, Camera, Bell, Moon, Sun, Pin, MessageSquare, CheckCheck, Check, X, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { getRequestsOfUser, updateUserData } from "@/services/user";
import { acceptRequestConnection, getAllConnections, sendNewConnectionRequest } from "@/services/connections";
import { toast } from "sonner";

export interface ChatContact {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  image?: string;
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

const avatarColors: Record<string, string> = {
  "1": "from-violet-500 to-purple-600",
  "2": "from-rose-500 to-red-500",
  "3": "from-pink-400 to-rose-500",
  "4": "from-blue-500 to-indigo-600",
  "5": "from-amber-400 to-orange-500",
  "6": "from-emerald-500 to-teal-500",
  "7": "from-fuchsia-500 to-pink-500",
  "8": "from-sky-400 to-blue-500",
};

interface CurrentUser {
  name: string;
  email: string;
  image?: string;
  status: string;
  online: boolean;
}

interface ChatSidebarProps {
  selectedId: string;
  onSelect: (contact: ChatContact) => void;
  onContactClick: (contact: ChatContact) => void;
  fullWidth?: boolean;
}

interface IRequests {
  connection_id: string;
  first_user: string;
  second_user: string;
  is_accepted: boolean;
  name: string;
  email: string;
  image?: string | null;
}

export { avatarColors };

type Tab = "personal" | "groups" | "requests";

const ChatSidebar = ({ selectedId, onSelect, onContactClick, fullWidth }: ChatSidebarProps) => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("personal");
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [connectionOpen, setConnectionOpen] = useState<boolean>(false);
  const [contacts, setContacts] = useState<ChatContact[] | null>(null);
  const [requests, setRequests] = useState<IRequests[] | null>(null);

  const { logout, user, socket } = useAuth();

  const currentUser: CurrentUser = {
    name: user?.name ?? "Guest User",
    email: user?.email ?? "guest@example.com",
    image: user?.image,
    status: user?.status ?? "",
    online: true,
  };

  const [editName, setEditName] = useState(currentUser.name);
  const [editStatus, setEditStatus] = useState(currentUser.status);
  const [requestEmail, setRequestEmail] = useState<string>("");
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    fetchAllContacts();
  }, []);

  // Update online status when socket reports online users
  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (onlineUserIds: string[]) => {
      setContacts((prev) =>
        prev
          ? prev.map((c) => ({ ...c, online: onlineUserIds.includes(String(c.userId)) }))
          : prev,
      );
    };

    // Update last message preview and unread badge when a new message arrives
    const handleNewMessage = (msg: any) => {
      const connectionId = String(msg.connection_id);
      const preview = msg.text || (msg.file ? "📎 Attachment" : "");
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setContacts((prev) => {
        if (!prev) return prev;
        const updated = prev.map((c) => {
          if (String(c.id) !== connectionId) return c;
          // Only increment unread when this conversation is not currently open
          const isOpen = String(c.id) === String(selectedId);
          return {
            ...c,
            lastMessage: preview,
            time,
            unread: isOpen ? c.unread : (c.unread ?? 0) + 1,
          };
        });
        // bubble to top
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
          const rawTime: string | undefined = item.last_message_time
            ? new Date(item.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : undefined;
          return {
            id: String(item.connection_id ?? item.id ?? item.user_id),
            userId: item.user_id ? String(item.user_id) : undefined,
            name: item.name || item.email || "Unknown",
            email: item.email,
            image: item.image,
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
    // Clear unread badge for the conversation being opened
    setContacts((prev) =>
      prev ? prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c)) : prev,
    );
    onSelect(contact);
  };

  const filtered =
    contacts?.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }) ?? [];

  const pinned = filtered.filter((c) => c.pinned);
  const others = filtered.filter((c) => !c.pinned);

  const tabs: { id: Tab; label: string }[] = [
    { id: "personal", label: "Personal" },
    { id: "groups", label: "Groups" },
    { id: "requests", label: "Requests" },
  ];

  const handleTabSwitch = async (tabId: Tab) => {
    setTab(tabId);
    if (tabId === "requests") {
      try {
        const response = await getRequestsOfUser();
        setRequests(response.data || []);
      } catch (error) {
        setRequests([]);
      }
    }
  };

  const handleNewRequest = async () => {
    try {
      const response = await sendNewConnectionRequest({ email: requestEmail });

      if (response.success) {
        toast.success(response.message || "Connection request sent successfully.");
        setConnectionOpen(false);
      } else {
        toast.error(response.message || "Failed to send connection request.");
      }
    } catch (error) {
      toast.error((error as Error)?.message || "Unexpected error while sending connection request.");
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

  const handleUserDataUpdate = async () => {
    const response = await updateUserData({ name: editName, status: editStatus });

    if (response.success) {
      toast.success(response.message);
      logout();
    } else {
      toast.error(response.message);
    }
    // setSettingsOpen(false);
  };

  return (
    <div className={cn("flex flex-col bg-card h-full border-r border-border/60", fullWidth ? "w-full" : "w-[340px]")}>
      {/* Header — current user top like reference */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              {currentUser.image ? (
                <img src={currentUser.image} alt={currentUser.name} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              )}
              {currentUser.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-accent border-2 border-card" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-foreground truncate leading-tight">{currentUser.name}</h2>
              <p className="text-[12px] text-muted-foreground truncate mt-0.5">{currentUser.email}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0">
                <Settings className="w-[18px] h-[18px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-elevated p-1.5">
              <DropdownMenuItem onClick={() => setConnectionOpen(true)} className="rounded-xl py-2.5 px-3">
                <UserCircle className="w-4 h-4 mr-2.5" />
                Add Connection
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="rounded-xl py-2.5 px-3">
                <Edit2 className="w-4 h-4 mr-2.5" />
                Update Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDarkMode(!darkMode)} className="rounded-xl py-2.5 px-3">
                {darkMode ? <Sun className="w-4 h-4 mr-2.5" /> : <Moon className="w-4 h-4 mr-2.5" />}
                {darkMode ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5" />
              <DropdownMenuItem onClick={logout} className="text-destructive rounded-xl py-2.5 px-3">
                <LogOut className="w-4 h-4 mr-2.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-full bg-muted/70 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Pill tabs */}
        <div className="mt-4 bg-muted/70 rounded-full p-1 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabSwitch(t.id)}
              className={cn(
                "flex-1 h-8 rounded-full text-[12.5px] font-semibold transition-all duration-200",
                tab === t.id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lists */}
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

      {/* Settings/Profile Edit Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl shadow-elevated">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="flex justify-center">
              <div className="relative group cursor-pointer">
                {/* <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-3xl shadow-medium">
                  ET
                </div> */}
                <div className="absolute inset-0 rounded-full bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <Camera className="w-6 h-6 text-background" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: "Name", value: editName, set: setEditName },
                { label: "Status", value: editStatus, set: setEditStatus },
              ].map((field) => (
                <div key={field.label}>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">{field.label}</label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-muted/70 border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleUserDataUpdate}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-glow"
            >
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Connection Request */}
      <Dialog open={connectionOpen} onOpenChange={setConnectionOpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl shadow-elevated">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add New Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="space-y-4">
              {[{ label: "Email Address", value: requestEmail, set: setRequestEmail }].map((field) => (
                <div key={field.label}>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">{field.label}</label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-muted/70 border-0 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleNewRequest}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-glow"
            >
              Send Request
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SectionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center justify-between px-4 pt-4 pb-2">
    <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">{label}</span>
    <span className="text-muted-foreground/60">{icon}</span>
  </div>
);

interface RequestRowProps {
  request: IRequests;
  onAccept: (request: IRequests) => void;
  onReject: (request: IRequests) => void;
  index: number;
}

const RequestRow = ({ request, onAccept, onReject, index }: RequestRowProps) => (
  <div
    className="group w-full rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-muted/20 p-3.5 shadow-soft hover:shadow-medium hover:border-border/60 transition-all duration-300 opacity-0 animate-fade-in overflow-hidden relative"
    style={{ animationDelay: `${index * 30}ms` }}
  >
    {/* Gradient background effect on hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

    <div className="relative z-10">
      {/* User info section */}
      <div className="flex items-start gap-3 mb-3.5">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-base font-semibold text-white shadow-soft ring-2 ring-card group-hover:ring-primary/30 transition-all">
            {request.image ? (
              <img src={request.image} alt={request.name} className="w-full h-full object-cover" />
            ) : (
              <span>
                {request.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent border-2 border-card flex items-center justify-center shadow-soft">
            <Users className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors">{request.name}</p>
          <p className="text-xs text-muted-foreground truncate mt-1">{request.email}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAccept(request)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-glow px-3.5 py-2.5 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:shadow-glow hover:scale-105 active:scale-95 group/accept"
        >
          <Check className="w-4 h-4 group-hover/accept:scale-110 transition-transform" />
          <span>Accept</span>
        </button>
        <button
          type="button"
          onClick={() => onReject(request)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-1.5 border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs font-semibold text-destructive transition-all duration-200 hover:border-destructive/60 hover:bg-destructive/10 hover:shadow-soft active:scale-95 group/reject"
        >
          <X className="w-4 h-4 group-hover/reject:scale-110 transition-transform" />
          <span>Reject</span>
        </button>
      </div>
    </div>
  </div>
);

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
      {/* Avatar — circular like reference */}
      <div
        className="relative shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick(contact);
        }}
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
            <span className="text-sm">
              {contact.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          )}
        </div>
        {!isGroupContact && contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-accent border-2 border-card" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[14px] truncate text-foreground">
            {contact.name}
            {/* {contact.type === "group" && contact.emoji && <span className="ml-1.5 text-emerald-500">📗</span>} */}
          </span>
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

export default ChatSidebar;
