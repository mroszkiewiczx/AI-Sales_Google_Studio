import { TrendingUp, CheckSquare, Mic, Calendar, Link as LinkIcon, FileText, BookOpen, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export const CONTEXT_OPTIONS: { key: string; label: string; icon: any; integration?: string }[] = [
  { key: "pipeline",     label: "Pipeline & Deale",    icon: TrendingUp },
  { key: "tasks_today",  label: "Zadania na dziś",      icon: CheckSquare },
  { key: "transcripts",  label: "Transkrypcje",         icon: Mic },
  { key: "briefs",       label: "Briefingi",            icon: Calendar },
  { key: "hubspot",      label: "HubSpot CRM",          icon: LinkIcon, integration: "hubspot" },
  { key: "notion",       label: "Notion",               icon: FileText, integration: "notion" },
  { key: "knowledge",    label: "Baza Wiedzy",          icon: BookOpen },
  { key: "emails",       label: "Historia emaili",      icon: Mail },
];

interface Props {
  activeContexts: Record<string, boolean>;
  onToggle: (key: string) => void;
}

export function ContextToggle({ activeContexts, onToggle }: Props) {
  const { currentWorkspace } = useWorkspace();

  const { data: activeCreds } = useQuery({
    queryKey: ["active-creds", currentWorkspace?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_credentials")
        .select("provider, status")
        .eq("workspace_id", currentWorkspace!.id)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  const activeProviders = activeCreds?.map(c => c.provider) || [];

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border">
      <span className="text-sm font-medium mr-2 flex items-center">Kontekst:</span>
      {CONTEXT_OPTIONS.map(opt => {
        const isDisabled = opt.integration && !activeProviders.includes(opt.integration);
        const isActive = activeContexts[opt.key] && !isDisabled;

        return (
          <Badge
            key={opt.key}
            variant={isActive ? "default" : "outline"}
            className={`cursor-pointer flex items-center gap-1.5 py-1 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => {
              if (!isDisabled) onToggle(opt.key);
            }}
          >
            <opt.icon className="h-3 w-3" />
            {opt.label}
          </Badge>
        );
      })}
    </div>
  );
}
