import { useI18n } from "@/contexts/I18nContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/ai-ceo/ChatPanel";
import { IntelPanel } from "@/components/ai-ceo/IntelPanel";
import { Brain, Search } from "lucide-react";

export default function AiCeoPage() {
  const { t } = useI18n();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.aiCeo")}</h1>
        <p className="text-muted-foreground mt-1">
          Twój strategiczny asystent sprzedażowy i wywiad o leadach
        </p>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Czat z AI CEO
          </TabsTrigger>
          <TabsTrigger value="intel" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Lead Intel
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 min-h-0 mt-4">
          <ChatPanel />
        </TabsContent>
        
        <TabsContent value="intel" className="flex-1 min-h-0 mt-4">
          <IntelPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
