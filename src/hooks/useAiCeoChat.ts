import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function useAiCeoChat() {
  const { currentWorkspace } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    content: string,
    model: string,
    contextFlags: Record<string, boolean>
  ) => {
    if (!currentWorkspace) return;
    
    const newMessages = [...messages, { role: "user" as const, content }];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-ceo-chat", {
        body: {
          workspace_id: currentWorkspace.id,
          messages: newMessages,
          model,
          context_flags: contextFlags,
        },
      });

      if (error) throw error;

      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setError(err.message || "Błąd komunikacji z AI");
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  return { messages, sendMessage, isLoading, error, clearHistory };
}
