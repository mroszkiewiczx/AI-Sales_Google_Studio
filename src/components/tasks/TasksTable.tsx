import { useI18n } from "@/contexts/I18nContext";
import { Task, useSaveTask, TASK_TYPE_COLORS } from "@/hooks/useTasks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Edit2, Phone, Mail, Calendar, Linkedin, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  tasks: Task[];
  isLoading: boolean;
  onEdit: (id: string) => void;
}

export function TasksTable({ tasks, isLoading, onEdit }: Props) {
  const { t } = useI18n();
  const saveTask = useSaveTask();

  const handleStatusChange = async (id: string, status: string) => {
    await saveTask.mutateAsync({ task_id: id, status: status as any });
  };

  const toggleComplete = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    await saveTask.mutateAsync({ task_id: task.id, status: newStatus });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />;
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'MEETING': case 'MEETING_GCAL': return <Calendar className="h-4 w-4" />;
      case 'LINKED_IN': case 'LINKED_IN_CONNECT': case 'LINKED_IN_MESSAGE': return <Linkedin className="h-4 w-4" />;
      default: return <CheckSquare className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
        <CheckSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium">{t("tasks.empty")}</h3>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead>Tytuł</TableHead>
            <TableHead>Klient</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead>Termin</TableHead>
            <TableHead>Priorytet</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow key={task.id} className="group relative">
              <TableCell className="relative">
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${TASK_TYPE_COLORS[task.task_type]}-500`} />
                <Checkbox 
                  checked={task.status === 'COMPLETED'} 
                  onCheckedChange={() => toggleComplete(task)} 
                />
              </TableCell>
              <TableCell className={`text-${TASK_TYPE_COLORS[task.task_type]}-500`}>
                {getIcon(task.task_type)}
              </TableCell>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{task.account?.name || "-"}</TableCell>
              <TableCell>{task.contact?.name || "-"}</TableCell>
              <TableCell>
                {task.due_date ? format(new Date(task.due_date), "d MMM yyyy", { locale: pl }) : "-"}
                {task.due_time ? ` ${task.due_time}` : ""}
              </TableCell>
              <TableCell>
                <Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                  {t(`tasks.prio${task.priority.toLowerCase()}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v)}>
                  <SelectTrigger className="h-8 w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['NOT_STARTED','IN_PROGRESS','COMPLETED','WAITING','DEFERRED'].map(s => (
                      <SelectItem key={s} value={s}>{t(`tasks.status${s.replace(/_/g, '').toLowerCase()}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(task.id)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
