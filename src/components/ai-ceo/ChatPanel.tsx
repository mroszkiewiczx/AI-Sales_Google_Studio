import React, { useState, useRef, useEffect } from "react";
import { useAiCeoChat } from "@/hooks/useAiCeoChat";
import { ContextToggle } from "./ContextToggle";
import { EngineSelector } from "./EngineSelector";
import { QuickQuestions } from "./QuickQuestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Trash2, Save, Loader2, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function ChatPanel() {
  const { currentWorkspace } = useWorkspace();
  const { messages, sendMessage, isLoading, error, clearHistory } = useAiCeoChat();
  const [input, setInput] = useState("");
  const [model, setModel] = useState("openrouter:google/gemini-2.5-flash");
  const [contextFlags, setContextFlags] = useState<Record<string, boolean>>({
    pipeline: true,
    tasks_today: true,
    transcripts: false,
    briefs: false,
    hubspot: false,
    notion: false,
    knowledge: false,
    emails: false,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const msg = input;
    setInput("");
    await sendMessage(msg, model, contextFlags);
  };

  const handleQuickQuestion = (q: string) => {
    setInput(q);
    // setTimeout to allow state update before sending
    setTimeout(() => {
      sendMessage(q, model, contextFlags);
    }, 0);
  };

  const toggleContext = (key: string) => {
    setContextFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveToNotion = async () => {
    if (messages.length === 0) return;
    
    try {
      const { data: cred } = await supabase
        .from("integration_credentials")
        .select("status")
        .eq("workspace_id", currentWorkspace!.id)
        .eq("provider", "notion")
        .single();

      if (cred?.status !== "active") {
        toast.error("Integracja z Notion nie jest aktywna.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("ai-ceo-save-notion", {
        body: {
          workspace_id: currentWorkspace!.id,
          messages,
        },
      });

      if (error) throw error;
      toast.success(data.message || "Zapisano rozmowę do Notion");
    } catch (e: any) {
      toast.error(e.message || "Błąd podczas zapisywania do Notion");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] border rounded-lg bg-card">
      <div className="p-4 border-b flex items-center justify-between bg-muted/10">
        <div className="flex items-center gap-4">
          <EngineSelector value={model} onChange={setModel} />
          <Button variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Wyczyść
          </Button>
          <Button variant="outline" size="sm" onClick={saveToNotion}>
            <Save className="h-4 w-4 mr-2" />
            Zapisz do Notion
          </Button>
        </div>
      </div>

      <div className="p-4 border-b">
        <ContextToggle activeContexts={contextFlags} onToggle={toggleContext} />
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">W czym mogę pomóc?</h3>
            <p className="max-w-md mt-2">
              Jestem Twoim asystentem AI. Mam dostęp do danych z CRM, zadań, transkrypcji i maili.
            </p>
            <QuickQuestions onSelect={handleQuickQuestion} />
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-muted rounded-tl-sm whitespace-pre-wrap'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-muted rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizuję dane...
                </div>
              </div>
            )}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-muted/10">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Zapytaj o klienta, deal lub zadania..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
