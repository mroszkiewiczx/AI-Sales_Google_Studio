import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";

interface Props {
  onSelect: (q: string) => void;
}

export function QuickQuestions({ onSelect }: Props) {
  const { currentWorkspace } = useWorkspace();

  const { data: questions } = useQuery({
    queryKey: ["quick-questions", currentWorkspace?.id],
    queryFn: async () => {
      // Pobieramy pytania z quiz_questions lub używamy domyślnych
      const { data } = await supabase
        .from("quiz_questions")
        .select("question")
        .eq("workspace_id", currentWorkspace!.id)
        .limit(4);
      
      if (data && data.length > 0) {
        return data.map(d => d.question);
      }

      return [
        "Co wiem o firmie Alfatex?",
        "Jakie mam zadania na dziś?",
        "Podsumuj mój pipeline",
        "Kto jest najlepszym handlowcem w tym miesiącu?"
      ];
    },
    enabled: !!currentWorkspace?.id,
  });

  if (!questions) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {questions.map((q, i) => (
        <Button
          key={i}
          variant="outline"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onSelect(q)}
        >
          <MessageSquarePlus className="h-3 w-3 mr-1.5" />
          {q}
        </Button>
      ))}
    </div>
  );
}
