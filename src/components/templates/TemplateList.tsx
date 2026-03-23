// src/components/templates/TemplateList.tsx
import { useState } from "react";
import { Search, Plus, Mail, MessageSquare, Clock, FileText, MoreVertical, Copy, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplates, Template } from "@/hooks/useTemplates";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TemplateListProps {
  onSelect: (template: Template) => void;
  onNew: () => void;
  selectedId?: string;
}

const categoryIcons = {
  email: Mail,
  sms: MessageSquare,
  followup: Clock,
  offer: FileText,
  other: MoreVertical
};

export function TemplateList({ onSelect, onNew, selectedId }: TemplateListProps) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const { data: templates, isLoading } = useTemplates(category);

  const filteredTemplates = templates?.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Szablony</h2>
        <Button size="sm" onClick={onNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nowy
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj szablonu..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={category} onValueChange={setCategory} className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="all" className="text-xs">Wszystkie</TabsTrigger>
          <TabsTrigger value="email" className="text-xs">Email</TabsTrigger>
          <TabsTrigger value="sms" className="text-xs">SMS</TabsTrigger>
          <TabsTrigger value="followup" className="text-xs">Follow-up</TabsTrigger>
          <TabsTrigger value="offer" className="text-xs">Oferty</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredTemplates?.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground">Brak szablonów</p>
        ) : (
          filteredTemplates?.map((template) => {
            const Icon = categoryIcons[template.category] || categoryIcons.other;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all hover:bg-accent group",
                  selectedId === template.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm truncate">{template.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {template.use_count} użyć
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {template.body.replace(/{[^}]+}/g, "...")}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
