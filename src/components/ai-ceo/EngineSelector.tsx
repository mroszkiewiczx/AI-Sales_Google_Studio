import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

const ENGINE_MODEL_MAP: Record<string, string[]> = {
  openrouter: ["google/gemini-2.5-flash", "google/gemini-pro-1.5", "anthropic/claude-3.5-sonnet",
               "openai/gpt-4o", "openai/gpt-4o-mini", "deepseek/deepseek-r1",
               "x-ai/grok-2", "meta-llama/llama-3.1-405b"],
  openai:     ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  anthropic:  ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229"],
  google:     ["gemini-2.5-flash", "gemini-pro-1.5"],
};

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function EngineSelector({ value, onChange }: Props) {
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

  const activeProviders = (activeCreds as any[])?.map(c => c.provider) || [];
  
  // Zawsze pokazujemy openrouter
  const availableProviders = ["openrouter", ...activeProviders.filter(p => ENGINE_MODEL_MAP[p])];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Wybierz model AI" />
      </SelectTrigger>
      <SelectContent>
        {availableProviders.map(provider => (
          <SelectGroup key={provider}>
            <SelectLabel>{provider.toUpperCase()}</SelectLabel>
            {ENGINE_MODEL_MAP[provider].map(model => (
              <SelectItem key={`${provider}:${model}`} value={`${provider}:${model}`}>
                {model}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
