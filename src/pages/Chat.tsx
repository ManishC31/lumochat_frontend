import { useState } from "react";
import ChatSidebar, { type ChatContact } from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import ContactDetailPanel from "@/components/chat/ContactDetailPanel";
import { useIsMobile } from "@/hooks/use-mobile";

const Chat = () => {
  const [selected, setSelected] = useState<ChatContact | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  const handleContactClick = (contact: ChatContact) => {
    setSelected(contact);
    setDetailOpen(true);
  };

  const handleSelect = (contact: ChatContact) => {
    setSelected(contact);
    if (isMobile) setSidebarOpen(false);
  };

  const handleBack = () => {
    setSidebarOpen(true);
  };

  return (
    <div className="flex h-screen font-display relative overflow-hidden bg-background p-2 gap-2">
      {/* Sidebar */}
      <div
        className={
          isMobile
            ? `absolute inset-2 z-30 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-[110%]"}`
            : "shrink-0"
        }
      >
        <div className="h-full rounded-3xl overflow-hidden border border-border/60 bg-card shadow-soft">
          <ChatSidebar
            selectedId={selected?.id ?? ""}
            onSelect={handleSelect}
            onContactClick={handleContactClick}
            fullWidth={isMobile}
          />
        </div>
      </div>

      {/* Chat area */}
      <div
        className={
          isMobile
            ? `absolute inset-2 z-20 transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-[110%]" : "translate-x-0"}`
            : "flex-1 min-w-0"
        }
      >
        <div className="h-full rounded-3xl overflow-hidden border border-border/60 bg-card shadow-soft">
          <ChatArea
            contact={selected}
            onContactClick={handleContactClick}
            onBack={isMobile ? handleBack : undefined}
          />
        </div>
      </div>

      {/* Right detail panel */}
      <ContactDetailPanel
        contact={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
};

export default Chat;
