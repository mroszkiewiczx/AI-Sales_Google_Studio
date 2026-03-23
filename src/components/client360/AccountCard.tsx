// src/components/client360/AccountCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ExternalLink, Mail, Phone, User, MapPin, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AccountCardProps {
  account?: any;
  contact?: any;
}

export function AccountCard({ account, contact }: AccountCardProps) {
  if (!account) return null;

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            {account.logo_letter || account.name?.[0] || "C"}
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-sm font-bold truncate max-w-[180px]">{account.name}</CardTitle>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {account.city || "Brak lokalizacji"}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(account.website, "_blank")}>
          <Globe className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">NIP</p>
            <p className="text-xs font-medium">{account.nip || "—"}</p>
          </div>
          <div className="p-2 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Branża</p>
            <p className="text-xs font-medium truncate">{account.industry || "—"}</p>
          </div>
        </div>

        {contact && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Główny Kontakt</p>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted text-[10px]">{contact.first_name?.[0]}{contact.last_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold truncate">{contact.first_name} {contact.last_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{contact.position || "Brak stanowiska"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5" onClick={() => window.location.href = `mailto:${contact.email}`}>
                <Mail className="h-3 w-3" />
                Email
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5" onClick={() => window.location.href = `tel:${contact.phone}`}>
                <Phone className="h-3 w-3" />
                Zadzwoń
              </Button>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button variant="outline" className="w-full h-8 text-xs gap-2 border-dashed">
            <ExternalLink className="h-3.5 w-3.5" />
            Otwórz w Notion
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
