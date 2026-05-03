import { Search, Settings, LogOut, Edit2, Moon, Sun, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type Tab = "personal" | "requests";

export interface CurrentUser {
  name: string;
  email: string;
  image?: string;
  status: string;
  online: boolean;
}

interface UserProfileHeaderProps {
  currentUser: CurrentUser;
  search: string;
  onSearchChange: (v: string) => void;
  tab: Tab;
  onTabSwitch: (tab: Tab) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  onOpenConnection: () => void;
  onLogout: () => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "requests", label: "Requests" },
];

const UserProfileHeader = ({
  currentUser,
  search,
  onSearchChange,
  tab,
  onTabSwitch,
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  onOpenConnection,
  onLogout,
}: UserProfileHeaderProps) => (
  <div className="px-5 pt-5 pb-3">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative shrink-0">
          {currentUser.image ? (
            <img src={currentUser.image} alt={currentUser.name} className="w-11 h-11 rounded-full object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
              {currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
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
          <DropdownMenuItem onClick={onOpenConnection} className="rounded-xl py-2.5 px-3">
            <UserCircle className="w-4 h-4 mr-2.5" />
            Add Connection
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenSettings} className="rounded-xl py-2.5 px-3">
            <Edit2 className="w-4 h-4 mr-2.5" />
            Update Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleDarkMode} className="rounded-xl py-2.5 px-3">
            {darkMode ? <Sun className="w-4 h-4 mr-2.5" /> : <Moon className="w-4 h-4 mr-2.5" />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1.5" />
          <DropdownMenuItem onClick={onLogout} className="text-destructive rounded-xl py-2.5 px-3">
            <LogOut className="w-4 h-4 mr-2.5" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div className="relative mt-4">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full h-11 pl-11 pr-4 rounded-full bg-muted/70 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
      />
    </div>

    <div className="mt-4 bg-muted/70 rounded-full p-1 flex gap-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabSwitch(t.id)}
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
);

export default UserProfileHeader;
