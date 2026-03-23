import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Send, Eraser, FileText, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export function TranscriptViewer() {
  const [content, setContent] = useState(`
    PROWADZĄCY: Dzień dobry, dziękuję za spotkanie. Chciałbym porozmawiać o Państwa potrzebach w zakresie CRM.
    KLIENT: Dzień dobry. Tak, obecnie korzystamy z Excela, ale przy tej skali to już nie wystarcza.
    PROWADZĄCY: Rozumiem. Ile osób w zespole będzie korzystać z systemu?
    KLIENT: Około 15 handlowców i 3 osoby z marketingu.
  `);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Skopiowano do schowka");
  };

  const handleClean = async () => {
    toast.info("Czyszczenie transkrypcji...");
    // Mocking the EF call
    setTimeout(() => {
      setContent(content.replace(/um|yyy|eee|rozumiem|tak/gi, ""));
      toast.success("Transkrypcja wyczyszczona");
    }, 1500);
  };

  return (
    <Card className="shadow-sm border-border h-full flex flex-col">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Transkrypcja Spotkania
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleClean}>
            <Eraser className="h-3.5 w-3.5" />
            Czyść Treść
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
            Kopiuj
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Download className="h-3.5 w-3.5" />
            Pobierz
          </Button>
          <Button variant="default" size="sm" className="h-8 gap-2">
            <Send className="h-3.5 w-3.5" />
            Wyślij do OA
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[500px] p-6">
          <div className="space-y-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
