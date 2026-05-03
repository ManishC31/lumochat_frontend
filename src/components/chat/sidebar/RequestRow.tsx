import { Check, X, Users } from "lucide-react";

export interface IRequests {
  connection_id: string;
  first_user: string;
  second_user: string;
  is_accepted: boolean;
  name: string;
  email: string;
  image?: string | null;
}

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
    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

    <div className="relative z-10">
      <div className="flex items-start gap-3 mb-3.5">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-base font-semibold text-white shadow-soft ring-2 ring-card group-hover:ring-primary/30 transition-all">
            {request.image ? (
              <img src={request.image} alt={request.name} className="w-full h-full object-cover" />
            ) : (
              <span>{request.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
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

export default RequestRow;
