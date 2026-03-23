import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { Task, TASK_TYPE_COLORS } from "@/hooks/useTasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  tasks: Task[];
  onEdit: (id: string) => void;
}

export function TaskCalendar({ tasks, onEdit }: Props) {
  const { t } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
  };

  const renderMonth = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 border-l border-t h-[600px]">
        {['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'].map(d => (
          <div key={d} className="p-2 border-r border-b text-center font-medium text-sm bg-muted/30">{d}</div>
        ))}
        {days.map(day => {
          const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day));
          return (
            <div key={day.toISOString()} className={`p-2 border-r border-b min-h-[100px] ${!isSameMonth(day, currentDate) ? 'bg-muted/10 text-muted-foreground' : ''}`}>
              <div className="text-right text-sm mb-1">{format(day, 'd')}</div>
              <div className="space-y-1">
                {dayTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => onEdit(task.id)}
                    className={`text-xs p-1 rounded cursor-pointer truncate bg-${TASK_TYPE_COLORS[task.task_type]}-100 text-${TASK_TYPE_COLORS[task.task_type]}-800 border border-${TASK_TYPE_COLORS[task.task_type]}-200`}
                  >
                    {task.due_time?.substring(0,5)} {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeek = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="grid grid-cols-7 border-l border-t h-[600px]">
        {days.map(day => {
          const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day));
          return (
            <div key={day.toISOString()} className="p-2 border-r border-b min-h-[100px]">
              <div className="text-center text-sm font-medium mb-2 pb-2 border-b">
                {format(day, 'EEE', { locale: pl })}<br/>
                <span className="text-2xl">{format(day, 'd')}</span>
              </div>
              <div className="space-y-1">
                {dayTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => onEdit(task.id)}
                    className={`text-xs p-1.5 rounded cursor-pointer truncate bg-${TASK_TYPE_COLORS[task.task_type]}-100 text-${TASK_TYPE_COLORS[task.task_type]}-800`}
                  >
                    {task.due_time?.substring(0,5)} {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDay = () => {
    const dayTasks = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), currentDate));
    return (
      <div className="border rounded-lg p-4 h-[600px] overflow-y-auto">
        <div className="text-xl font-bold mb-6">{format(currentDate, 'EEEE, d MMMM yyyy', { locale: pl })}</div>
        <div className="space-y-3">
          {dayTasks.length === 0 ? (
            <div className="text-muted-foreground text-center p-8">Brak zadań na ten dzień.</div>
          ) : (
            dayTasks.sort((a,b) => (a.due_time || "24:00").localeCompare(b.due_time || "24:00")).map(task => (
              <div 
                key={task.id} 
                onClick={() => onEdit(task.id)}
                className={`p-3 rounded-lg cursor-pointer flex items-center gap-4 bg-${TASK_TYPE_COLORS[task.task_type]}-50 border border-${TASK_TYPE_COLORS[task.task_type]}-200`}
              >
                <div className="font-mono font-medium w-16 text-muted-foreground">{task.due_time?.substring(0,5) || "Cały d."}</div>
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-muted-foreground">{task.account?.name} {task.contact?.name}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg border p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-semibold w-48 text-center">
            {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: pl })}
            {view === 'week' && `Tydzień ${format(currentDate, 'w', { locale: pl })}`}
            {view === 'day' && format(currentDate, 'd MMM yyyy', { locale: pl })}
          </h2>
          <Button variant="outline" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" onClick={() => setCurrentDate(new Date())}>Dziś</Button>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="month">{t("tasks.calMonth")}</TabsTrigger>
            <TabsTrigger value="week">{t("tasks.calWeek")}</TabsTrigger>
            <TabsTrigger value="day">{t("tasks.calDay")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-auto">
        {view === 'month' && renderMonth()}
        {view === 'week' && renderWeek()}
        {view === 'day' && renderDay()}
      </div>
    </div>
  );
}
