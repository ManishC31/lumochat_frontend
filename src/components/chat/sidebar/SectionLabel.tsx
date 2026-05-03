const SectionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center justify-between px-4 pt-4 pb-2">
    <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">{label}</span>
    <span className="text-muted-foreground/60">{icon}</span>
  </div>
);

export default SectionLabel;
