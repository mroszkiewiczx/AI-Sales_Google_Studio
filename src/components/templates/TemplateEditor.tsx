// src/components/templates/TemplateEditor.tsx
import { useState, useEffect, useRef } from "react";
import { Save, Copy, Trash, Sparkles, User, Building2, Calendar, Package, AlertCircle, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSaveTemplate, useTemplatePersonalize, useIncrementTemplateUse, Template } from "@/hooks/useTemplates";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TemplateEditorProps {
  template?: Template;
  onSave?: (template: Template) => void;
  onDelete?: (id: string) => void;
}

const variables = [
  { key: "imię", icon: User, label: "Imię klienta" },
  { key: "firma", icon: Building2, label: "Nazwa firmy" },
  { key: "branża", icon: AlertCircle, label: "Branża" },
  { key: "data", icon: Calendar, label: "Data" },
  { key: "produkt", icon: Package, label: "Produkt" }
];

export function TemplateEditor({ template, onSave, onDelete }: TemplateEditorProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Template["category"]>("email");
  const [body, setBody] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  const saveMutation = useSaveTemplate();
  const personalizeMutation = useTemplatePersonalize();
  const incrementMutation = useIncrementTemplateUse();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setCategory(template.category);
      setBody(template.body);
    } else {
      setTitle("");
      setCategory("email");
      setBody("");
    }
  }, [template]);

  const handleSave = async () => {
    if (!title || !body) return;
    try {
      const result = await saveMutation.mutateAsync({
        id: template?.id,
        title,
        category,
        body
      });
      if (onSave) onSave(result as Template);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleInsertVariable = (key: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = body;
    const newBody = text.substring(0, start) + `{${key}}` + text.substring(end);
    setBody(newBody);
    
    // Reset focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + key.length + 2, start + key.length + 2);
    }, 0);
  };

  const handlePersonalize = async () => {
    if (!template?.id) return;
    try {
      const result = await personalizeMutation.mutateAsync({
        template_id: template.id,
        // For demo, we'll just personalize without account_id initially
      });
      setBody(result.personalized_body);
      toast.success("Szablon spersonalizowany przez AI");
    } catch (error) {
      console.error("Personalization failed:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    setIsCopied(true);
    if (template?.id) {
      incrementMutation.mutate(template.id);
    }
    toast.success("Skopiowano do schowka");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{template ? "Edytuj szablon" : "Nowy szablon"}</h2>
        <div className="flex items-center gap-2">
          {template && (
            <Button variant="outline" size="sm" onClick={handlePersonalize} disabled={personalizeMutation.isPending} className="gap-2">
              {personalizeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
              Personalizuj AI
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            Kopiuj
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
            <Save className="h-4 w-4" /> Zapisz
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className="col-span-2 flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Tytuł szablonu</label>
              <Input
                placeholder="np. Pierwszy kontakt po targach"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategoria</label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="offer">Oferta</SelectItem>
                  <SelectItem value="other">Inne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            <label className="text-sm font-medium">Treść szablonu</label>
            <Textarea
              ref={textareaRef}
              placeholder="Wpisz treść szablonu. Używaj {zmienna} do personalizacji..."
              className="flex-1 resize-none font-mono text-sm leading-relaxed p-4"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dostępne zmienne</label>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <button
                  key={v.key}
                  onClick={() => handleInsertVariable(v.key)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-xs font-medium border border-transparent hover:border-primary/20"
                >
                  <v.icon className="h-3 w-3" />
                  {`{${v.key}}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-4 overflow-hidden">
          <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Podgląd
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 bg-muted/20">
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {body.split(/({[^}]+})/).map((part, i) => {
                  if (part.startsWith("{") && part.endsWith("}")) {
                    return (
                      <span key={i} className="px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {part}
                      </span>
                    );
                  }
                  return part;
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}
