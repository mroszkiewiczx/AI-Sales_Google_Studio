import { Card, CardContent } from "@/components/ui/card";
import { Mail, Calendar, Clock, Paperclip, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailHistory({ history }: { history: any[] }) {
  const mockEmails = [
    { id: 1, date: "2024-03-22", time: "09:15", subject: "Re: Oferta wdrożenia CRM", preview: "Dziękujemy za ofertę. Przesyłamy uwagi do punktu 4...", attachments: 2 },
    { id: 2, date: "2024-03-18", time: "16:45", subject: "Zaproszenie na demo", preview: "Zapraszam na prezentację systemu w czwartek o 11:00...", attachments: 0 }
  ];

  const emails = history.length > 0 ? history : mockEmails;

  return (
    <div className="space-y-4">
      {emails.map((email: any) => (
        <Card key={email.id} className="shadow-none border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{email.subject}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {email.date}
                    <Clock className="h-3 w-3 ml-1" />
                    {email.time}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {email.attachments > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    {email.attachments}
                  </div>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed truncate">{email.preview}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
