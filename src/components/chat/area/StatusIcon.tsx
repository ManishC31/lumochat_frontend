import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const StatusIcon = ({ status, className }: { status?: string; className?: string }) => {
  if (!status) return null;
  if (status === "sent") return <Check className={cn("w-3.5 h-3.5 text-muted-foreground", className)} />;
  if (status === "delivered") return <CheckCheck className={cn("w-3.5 h-3.5 text-muted-foreground", className)} />;
  if (status === "read") return <CheckCheck className={cn("w-3.5 h-3.5 text-primary", className)} />;
  return null;
};

export default StatusIcon;
