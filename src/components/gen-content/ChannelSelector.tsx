// src/components/gen-content/ChannelSelector.tsx
import { useI18n } from "@/contexts/I18nContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Share2, Linkedin, Instagram, Facebook, Globe, Music, MessageCircle, Send, Hash, Camera, Twitter, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { id: 'LinkedIn Osobisty', label: 'LinkedIn Osobisty', color: '#0077B5', icon: Linkedin },
  { id: 'LinkedIn Firmowy', label: 'LinkedIn Firmowy', color: '#0077B5', icon: Linkedin },
  { id: 'Instagram', label: 'Instagram', color: '#E1306C', icon: Instagram },
  { id: 'Facebook Osobisty', label: 'Facebook Osobisty', color: '#1877F2', icon: Facebook },
  { id: 'Facebook Firmowy', label: 'Facebook Firmowy', color: '#1877F2', icon: Facebook },
  { id: 'Google Firma', label: 'Google Firma', color: '#4285F4', icon: Globe },
  { id: 'TikTok', label: 'TikTok', color: '#000000', icon: Music },
  { id: 'Platforma X', label: 'Platforma X', color: '#000000', icon: Twitter },
  { id: 'YouTube', label: 'YouTube', color: '#FF0000', icon: Youtube },
  { id: 'Spotify', label: 'Spotify', color: '#1DB954', icon: Music },
  { id: 'WhatsApp Business', label: 'WhatsApp Business', color: '#25D366', icon: MessageCircle },
  { id: 'Telegram', label: 'Telegram', color: '#26A5E4', icon: Send },
  { id: 'Slack', label: 'Slack', color: '#4A154B', icon: Hash },
  { id: 'Snapchat', label: 'Snapchat', color: '#FFFC00', icon: Camera },
] as const;

interface ChannelSelectorProps {
  selected: string[];
  onToggle: (id: string) => void;
}

export function ChannelSelector({ selected, onToggle }: ChannelSelectorProps) {
  const { t } = useI18n();

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          {t("gen_content.channels")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-2">
          {CHANNELS.map((ch) => (
            <div
              key={ch.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer",
                selected.includes(ch.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              )}
              onClick={() => onToggle(ch.id)}
            >
              <Checkbox
                id={ch.id}
                checked={selected.includes(ch.id)}
                onCheckedChange={() => onToggle(ch.id)}
                className="h-4 w-4"
              />
              <Label
                htmlFor={ch.id}
                className="flex items-center gap-2 text-[11px] font-medium cursor-pointer flex-1"
              >
                <ch.icon className="h-3.5 w-3.5" style={{ color: ch.color }} />
                {ch.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
