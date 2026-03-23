import { Button } from "@/components/ui/button";
import { Phone, CheckSquare, PlusCircle, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";

export function QuickActions() {
  const { currentWorkspace } = useWorkspace();
  const { t } = useI18n();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!currentWorkspace) return;
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dashboard-export`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ workspace_id: currentWorkspace.id, export_type: "dashboard_deals" }),
        }
      );
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      toast.success(t("quickActions.exportStarted"),
        { description: `Job: ${data.job_id?.substring(0, 8)}…` });
    } catch (err: any) {
      toast.error(t("quickActions.exportFailed"), { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 opacity-0 animate-fade-in-up"
      style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
      {/* Przyszłe akcje — disabled do czasu implementacji CRM modułów */}
      <Button variant="outline" size="sm" className="h-8 text-xs active:scale-[0.97]" disabled>
        <Phone className="mr-1.5 h-3.5 w-3.5" /> {t("quickActions.logCall")}
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs active:scale-[0.97]" disabled>
        <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> {t("quickActions.createTask")}
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs active:scale-[0.97]" disabled>
        <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> {t("quickActions.newDeal")}
      </Button>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-8 text-xs active:scale-[0.97]"
        onClick={handleExport} disabled={exporting}>
        {exporting
          ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          : <Download className="mr-1.5 h-3.5 w-3.5" />}
        {t("quickActions.export")}
      </Button>
    </div>
  );
}
