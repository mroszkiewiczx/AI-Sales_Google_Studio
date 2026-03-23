import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  LayoutDashboard, Terminal, Mail, Bell, BarChart3,
  Settings, LogOut, ChevronDown, Brain, Headphones, Building2, Mic, CheckSquare, Users,
  Calculator, CreditCard, Wrench, Code2, Server, FileText, Sparkles, Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { path: "/command-center", icon: Terminal, labelKey: "nav.commandCenter" },
  { path: "/tasks", icon: CheckSquare, labelKey: "nav.tasks" },
  { path: "/mail", icon: Mail, labelKey: "nav.mail" },
  { path: "/notifications", icon: Bell, labelKey: "nav.notifications" },
  { path: "/analytics", icon: BarChart3, labelKey: "nav.analytics" },
  { path: "/ai-ceo", icon: Brain, labelKey: "nav.aiCeo" },
  { path: "/ai-sales-info", icon: Headphones, labelKey: "nav.aiSalesInfo" },
  { path: "/org-analysis", icon: Building2, labelKey: "nav.orgAnalysis" },
  { path: "/client360", icon: Users, labelKey: "nav.client360" },
  { path: "/transcription", icon: Mic, labelKey: "nav.transcription" },
  { path: "/gen-content", icon: Sparkles, labelKey: "nav.genContent" },
  { path: "/gen-newsletter", icon: Newspaper, labelKey: "nav.genNewsletter" },
  { path: "/roi", icon: Calculator, labelKey: "nav.roi" },
  { path: "/licencje", icon: CreditCard, labelKey: "nav.licencje" },
  { path: "/wdrozenie", icon: Wrench, labelKey: "nav.wdrozenie" },
  { path: "/programowanie", icon: Code2, labelKey: "nav.programowanie" },
  { path: "/sprzet", icon: Server, labelKey: "nav.sprzet" },
  { path: "/oferta-sum", icon: FileText, labelKey: "nav.ofertaSum" },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const { t } = useI18n();

  return (
    <aside className="flex h-screen w-[240px] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-sidebar-accent transition-colors">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {currentWorkspace?.name?.charAt(0) || "S"}
            </div>
            <span className="flex-1 truncate text-left">{currentWorkspace?.name || t("nav.selectWorkspace")}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[208px]">
            {workspaces.map(ws => (
              <DropdownMenuItem key={ws.id} onClick={() => setCurrentWorkspace(ws)}
                className={cn(ws.id === currentWorkspace?.id && "bg-accent")}>
                <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold mr-2">
                  {ws.name.charAt(0)}
                </div>
                {ws.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <Link key={item.labelKey} to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}>
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        <Link to="/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
          <Settings className="h-4 w-4" />
          {t("nav.settings")}
        </Link>
        <button onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors">
          <LogOut className="h-4 w-4" />
          {t("nav.signOut")}
        </button>
      </div>
    </aside>
  );
}
