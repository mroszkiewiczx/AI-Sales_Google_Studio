// src/components/gen-content/PostCard.tsx
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useGenContentImage, ContentPost } from "@/hooks/useGenContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Copy, ImageIcon, Loader2, ExternalLink, Linkedin, Instagram, Facebook, Globe, Music, MessageCircle, Send, Hash, Camera, Twitter, Youtube, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICON_MAP: Record<string, any> = {
  'LinkedIn Osobisty': Linkedin,
  'LinkedIn Firmowy': Linkedin,
  'Instagram': Instagram,
  'Facebook Osobisty': Facebook,
  'Facebook Firmowy': Facebook,
  'Google Firma': Globe,
  'TikTok': Music,
  'Platforma X': Twitter,
  'YouTube': Youtube,
  'Spotify': Music,
  'WhatsApp Business': MessageCircle,
  'Telegram': Send,
  'Slack': Hash,
  'Snapchat': Camera,
};

interface PostCardProps {
  post: ContentPost;
  generationId: string;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function PostCard({ post, generationId, isSelected, onToggleSelect }: PostCardProps) {
  const { t } = useI18n();
  const [variant, setVariant] = useState<1 | 2>(1);
  const { mutate: generateImage, isPending: isGeneratingImage } = useGenContentImage();
  const Icon = ICON_MAP[post.channel] || Share2;

  const content = variant === 1 ? post.variant1 : post.variant2;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success(t("gen_content.copied"));
  };

  const handleGenerateImage = () => {
    generateImage({ 
      post_text: content, 
      channel: post.channel, 
      generation_id: generationId 
    });
  };

  return (
    <Card className="shadow-sm border-border overflow-hidden">
      <CardHeader className="p-4 bg-muted/30 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">{post.channel}</CardTitle>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {post.notion_page_url && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={post.notion_page_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button
            variant={variant === 1 ? "default" : "outline"}
            size="sm"
            className="h-7 text-[10px] px-3"
            onClick={() => setVariant(1)}
          >
            {t("gen_content.variant")} 1
          </Button>
          <Button
            variant={variant === 2 ? "default" : "outline"}
            size="sm"
            className="h-7 text-[10px] px-3"
            onClick={() => setVariant(2)}
          >
            {t("gen_content.variant")} 2
          </Button>
        </div>

        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-3 rounded-md border border-border/50">
          {content}
        </div>

        {post.image_url ? (
          <div className="relative aspect-video rounded-md overflow-hidden border border-border">
            <img src={post.image_url} alt="Generated content" className="object-cover w-full h-full" />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 gap-2 text-xs"
            onClick={handleGenerateImage}
            disabled={isGeneratingImage}
          >
            {isGeneratingImage ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            {t("gen_content.generate_image")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
