import { useState, useEffect } from "react";
import { X, Download, ImageIcon, Music, Video } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ChatContact } from "./ChatSidebar";
import { avatarColors } from "./ChatSidebar";
import { getMediaOfConnection } from "@/services/message";

interface MediaFile {
  id: string;
  url: string;
  type: "image" | "video" | "audio";
  created_at: string;
}

const detectFileType = (url: string): "image" | "video" | "audio" | "file" => {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (["mp4", "mov", "webm", "avi", "mkv", "ogv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"].includes(ext)) return "audio";
  if (url.includes("/image/upload/")) return "image";
  if (url.includes("/video/upload/")) return "video";
  return "audio";
};

interface ContactDetailPanelProps {
  contact: ChatContact | null;
  open: boolean;
  onClose: () => void;
}

const ContactDetailPanel = ({ contact, open, onClose }: ContactDetailPanelProps) => {
  const [mediaOpen, setMediaOpen] = useState(true);
  const [images, setImages] = useState<MediaFile[]>([]);
  const [audios, setAudios] = useState<MediaFile[]>([]);
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!contact?.id || !open) return;
    setImages([]);
    setAudios([]);
    setVideos([]);

    getMediaOfConnection(contact.id)
      .then((res) => {
        const allMedia = (res?.data ?? [])
          .map((m: any) => ({
            id: String(m.id),
            url: m.file,
            type: detectFileType(m.file),
            created_at: m.created_at,
          }))
          .filter((m: any) => m.type !== "file") as MediaFile[];

        setImages(allMedia.filter((m) => m.type === "image"));
        setAudios(allMedia.filter((m) => m.type === "audio"));
        setVideos(allMedia.filter((m) => m.type === "video"));
      })
      .catch(() => {});
  }, [contact?.id, open]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl]);

  if (!contact) return null;

  const contactColor = avatarColors[contact.id] || "from-primary to-primary-glow";
  const isGroupContact = Boolean(contact.emoji || contact.members);

  const handleDownload = (url: string) => {
    const filename = url.split("/").pop()?.split("?")[0] || "file";
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.click();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="lg:hidden fixed inset-0 bg-foreground/30 z-40 animate-fade-in" onClick={onClose} />}

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(lightboxUrl); }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLightboxUrl(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <aside
        className={cn(
          "fixed top-2 bottom-2 right-2 lg:relative lg:top-0 lg:bottom-0 lg:right-0 z-50 transition-all duration-300 ease-out flex-shrink-0",
          open ? "w-[340px] translate-x-0" : "translate-x-[110%] lg:translate-x-0 lg:w-0",
        )}
      >
        {open && (
          <ScrollArea className="h-full pr-1">
            <div className="space-y-2 pb-1">
              {/* Detail card */}
              <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4">
                  <h3 className="text-[15px] font-semibold text-foreground">
                    {isGroupContact ? "Group details" : "Contact details"}
                  </h3>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center px-5 pb-5 pt-2">
                  <div
                    className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl overflow-hidden bg-gradient-to-br",
                      isGroupContact ? "from-rose-100 to-pink-200" : contactColor,
                    )}
                  >
                    {contact.image ? (
                      <img src={contact.image} alt={contact.name} className="w-full h-full object-cover" />
                    ) : contact.emoji ? (
                      <span className="text-5xl">{contact.emoji}</span>
                    ) : (
                      contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                    )}
                  </div>
                  <h2 className="text-base font-bold text-foreground mt-3">
                    {contact.name}
                  </h2>
                  {contact.email && (
                    <p className="text-[13px] text-muted-foreground mt-0.5">{contact.email}</p>
                  )}
                </div>

                {/* Status */}
                <div className="border-t border-border/60 px-5 py-4">
                  <h4 className="text-[13px] font-semibold text-foreground mb-1.5">Status</h4>
                  <p className="text-[13px] text-muted-foreground leading-relaxed italic">
                    {contact.status ? `"${contact.status}"` : "No status set"}
                  </p>
                </div>
              </div>

              {/* Media card */}
              <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-4 pb-3">
                  <h3 className="text-[15px] font-semibold text-foreground">Media</h3>
                  <button
                    onClick={() => setMediaOpen((v) => !v)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className={cn("w-4 h-4 transition-transform", !mediaOpen && "rotate-45")} />
                  </button>
                </div>

                {mediaOpen && (
                  <div className="px-4 pb-4">
                    <Tabs defaultValue="images" className="w-full">
                      <TabsList className="w-full h-9 bg-muted/70 rounded-full p-1">
                        <TabsTrigger
                          value="images"
                          className="text-[12.5px] h-7 flex-1 rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary font-semibold"
                        >
                          Images
                        </TabsTrigger>
                        <TabsTrigger
                          value="audio"
                          className="text-[12.5px] h-7 flex-1 rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft font-semibold"
                        >
                          Audio
                        </TabsTrigger>
                        <TabsTrigger
                          value="videos"
                          className="text-[12.5px] h-7 flex-1 rounded-full data-[state=active]:bg-card data-[state=active]:shadow-soft font-semibold"
                        >
                          Videos
                        </TabsTrigger>
                      </TabsList>

                      {/* Images */}
                      <TabsContent value="images" className="mt-3">
                        {images.length === 0 ? (
                          <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
                            <ImageIcon className="w-8 h-8 opacity-40" />
                            <p className="text-[13px]">No images shared yet</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-1.5">
                            {images.map((img) => (
                              <div
                                key={img.id}
                                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                              >
                                <img
                                  src={img.url}
                                  alt=""
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  onClick={() => setLightboxUrl(img.url)}
                                />
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDownload(img.url); }}
                                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      {/* Audio */}
                      <TabsContent value="audio" className="mt-3 space-y-2">
                        {audios.length === 0 ? (
                          <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
                            <Music className="w-8 h-8 opacity-40" />
                            <p className="text-[13px]">No audio shared yet</p>
                          </div>
                        ) : (
                          audios.map((audio) => {
                            const filename = audio.url.split("/").pop()?.split("?")[0] || "audio";
                            return (
                              <div key={audio.id} className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Music className="w-4 h-4 text-primary" />
                                  </div>
                                  <p className="text-[12px] text-muted-foreground flex-1 truncate">{filename}</p>
                                  <button
                                    onClick={() => handleDownload(audio.url)}
                                    className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <audio controls src={audio.url} className="w-full" style={{ height: "32px" }} />
                              </div>
                            );
                          })
                        )}
                      </TabsContent>

                      {/* Videos */}
                      <TabsContent value="videos" className="mt-3 space-y-3">
                        {videos.length === 0 ? (
                          <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
                            <Video className="w-8 h-8 opacity-40" />
                            <p className="text-[13px]">No videos shared yet</p>
                          </div>
                        ) : (
                          videos.map((video) => {
                            const filename = video.url.split("/").pop()?.split("?")[0] || "video";
                            return (
                              <div key={video.id} className="rounded-xl overflow-hidden border border-border/60">
                                <video controls src={video.url} className="w-full" />
                                <div className="flex items-center justify-between px-3 py-2 bg-muted/20">
                                  <p className="text-[12px] text-muted-foreground truncate flex-1">{filename}</p>
                                  <button
                                    onClick={() => handleDownload(video.url)}
                                    className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </aside>
    </>
  );
};

export default ContactDetailPanel;
