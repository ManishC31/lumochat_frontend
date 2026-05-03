import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default AudioPlayer;
