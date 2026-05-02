import { MessageCircle, Shield, Zap, Users, CheckCheck } from "lucide-react";

const features = [
  { icon: Zap, text: "Real-time messaging" },
  { icon: Shield, text: "End-to-end encrypted" },
  { icon: Users, text: "Group conversations" },
];

const PreviewSection = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-muted/40 border-r border-border/60">
      {/* Soft decorative orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/15 blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: "3s" }} />

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">LumoChat</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-2 ml-[52px]">Connect through conversations</p>
      </div>

      {/* Mock chat preview card */}
      <div className="relative z-10 bg-card rounded-3xl border border-border/60 shadow-elevated p-5 max-w-sm mx-auto w-full">
        {/* Header row */}
        <div className="flex items-center gap-3 pb-4 border-b border-border/60">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center text-2xl">😈</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              United Family <span>📗</span>
            </h3>
            <p className="text-[12px] text-accent font-medium mt-0.5">Rashford is typing…</p>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3 pt-4">
          <div className="flex gap-2.5 opacity-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-foreground">Harry M.</span>
                <span className="text-[10px] text-muted-foreground">• 08:34</span>
              </div>
              <div className="mt-1 px-3 py-2 rounded-2xl rounded-tl-sm border border-border bg-card text-[12px] text-foreground">
                Tough game yesterday lads.
              </div>
            </div>
          </div>

          <div className="flex flex-row-reverse gap-2.5 opacity-0 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-foreground">You</span>
                <span className="text-[10px] text-muted-foreground">• 08:34</span>
                <CheckCheck className="w-3 h-3 text-primary" />
              </div>
              <div className="mt-1 px-3 py-2 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-[12px] max-w-[85%]">
                We'll fix it on Saturday 🔥
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 flex flex-wrap gap-x-6 gap-y-3">
        {features.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-medium text-foreground/80">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewSection;
