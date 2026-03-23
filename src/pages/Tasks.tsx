import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useTasks, useGCalSync, TaskFilters } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Download, Phone } from "lucide-react";
import { toast } from "sonner";
import { TaskFilters as TaskFiltersComponent } from "@/components/tasks/TaskFilters";
import { TasksTable } from "@/components/tasks/TasksTable";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { CallRegistrationDrawer } from "@/components/tasks/CallRegistrationDrawer";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";

export default function TasksPage() {
  const { t } = useI18n();
  const { currentWorkspace } = useWorkspace();
  const [filters, setFilters] = useState<TaskFilters>({});
  const { data, isLoading, error } = useTasks(filters);
  const gcalSync = useGCalSync();
  
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isCallDrawerOpen, setIsCallDrawerOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const handleGCalSync = async () => {
    try {
      const res = await gcalSync.mutateAsync();
      toast.success(t("tasks.synced").replace("{count}", String(res.synced_count)));
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    }
  };

  const handleExportCsv = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("tasks-export-csv", {
        body: { workspace_id: currentWorkspace!.id, ...filters },
      });
      if (error) throw error;
      
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "tasks.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    }
  };

  if (error) return (
    <div className="p-6 text-destructive">
      {t("common.error")}: {(error as Error).message}
    </div>
  );

  return (
    <div className="p-6 space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("tasks.title")}</h1>
          <p className="text-muted-foreground">{t("tasks.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            {t("tasks.exportCsv")}
          </Button>
          <Button variant="outline" onClick={handleGCalSync} disabled={gcalSync.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${gcalSync.isPending ? 'animate-spin' : ''}`} />
            {t("tasks.gcalSync")}
          </Button>
          <Button variant="outline" onClick={() => setIsCallDrawerOpen(true)}>
            <Phone className="mr-2 h-4 w-4" />
            {t("tasks.registerCall")}
          </Button>
          <Button onClick={() => { setEditingTaskId(null); setIsTaskDrawerOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {t("tasks.newTask")}
          </Button>
        </div>
      </div>

      <TaskFiltersComponent filters={filters} onChange={setFilters} />

      <Tabs defaultValue="list" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="list">{t("tasks.viewList")}</TabsTrigger>
          <TabsTrigger value="calendar">{t("tasks.viewCalendar")}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="flex-1 min-h-0 mt-4">
          <TasksTable 
            tasks={data?.tasks || []} 
            isLoading={isLoading} 
            onEdit={(id) => { setEditingTaskId(id); setIsTaskDrawerOpen(true); }} 
          />
        </TabsContent>
        <TabsContent value="calendar" className="flex-1 min-h-0 mt-4">
          <TaskCalendar 
            tasks={data?.tasks || []} 
            onEdit={(id) => { setEditingTaskId(id); setIsTaskDrawerOpen(true); }} 
          />
        </TabsContent>
      </Tabs>

      <TaskDrawer 
        open={isTaskDrawerOpen} 
        onOpenChange={setIsTaskDrawerOpen} 
        taskId={editingTaskId} 
      />
      
      <CallRegistrationDrawer 
        open={isCallDrawerOpen} 
        onOpenChange={setIsCallDrawerOpen} 
      />
    </div>
  );
}
