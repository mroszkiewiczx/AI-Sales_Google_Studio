import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, Users, Mail, Phone, ExternalLink, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function AccountCard({ account, contacts }: { account: any, contacts: any[] }) {
  if (!account) return null;

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Karta Klienta
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={account.website} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 rounded-lg border border-border">
            <AvatarImage src={account.logo_url} />
            <AvatarFallback className="rounded-lg">{account.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold truncate">{account.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              {account.domain}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Branża</p>
            <p className="text-xs font-medium">{account.industry}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Wielkość</p>
            <p className="text-xs font-medium">{account.size}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kontakty ({contacts.length})</p>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">Zarządzaj</Button>
          </div>
          <div className="space-y-2">
            {contacts.map((contact: any) => (
              <div key={contact.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                    {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{contact.firstName} {contact.lastName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{contact.jobTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a href={`mailto:${contact.email}`}><Mail className="h-3 w-3" /></a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer"><Linkedin className="h-3 w-3" /></a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
