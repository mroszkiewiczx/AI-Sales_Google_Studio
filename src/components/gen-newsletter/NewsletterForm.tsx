// src/components/gen-newsletter/NewsletterForm.tsx
import { useRef } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useGenNewsletterGenerate, useGenNewsletterSubject, useGenNewsletterImage, useNewsletterTemplates } from "@/hooks/useGenNewsletter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Copy, ImageIcon, Upload, Save, Palette, Mail } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewsletterFormProps {
  fields: {
    subject: string; h1: string; content: string; cta_text: string; cta_url: string;
    logo_url: string; primary_color: string; footer_text: string; header_image_url?: string;
  };
  setFields: (fields: any) => void;
  onCopyHtml: () => void;
}

export function NewsletterForm({ fields, setFields, onCopyHtml }: NewsletterFormProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: generateContent, isPending: isGeneratingContent } = useGenNewsletterGenerate();
  const { mutate: generateSubject, isPending: isGeneratingSubject } = useGenNewsletterSubject();
  const { mutate: generateImage, isPending: isGeneratingImage } = useGenNewsletterImage();
  const { saveTemplate, isPending: isSavingTemplate } = useNewsletterTemplates();

  const handleGenerateContent = () => {
    generateContent({ subject: fields.subject }, {
      onSuccess: (data) => {
        setFields((prev: any) => ({
          ...prev,
          subject: data.subject,
          h1: data.h1,
          content: data.content_html,
          cta_text: data.cta_text
        }));
        toast.success("Treść newslettera została wygenerowana!");
      }
    });
  };

  const handleGenerateSubject = () => {
    if (!fields.content) return;
    generateSubject(fields.content, {
      onSuccess: (data) => {
        setFields((prev: any) => ({ ...prev, subject: data.subjects[0] }));
      }
    });
  };

  const handleGenerateImage = () => {
    if (!fields.content) return;
    generateImage({ content: fields.content, subject: fields.subject }, {
      onSuccess: (data) => {
        setFields((prev: any) => ({ ...prev, header_image_url: data.image_url }));
        toast.success("Grafika nagłówka została wygenerowana!");
      }
    });
  };

  const handleImportHtml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const html = ev.target?.result as string;
      setFields((prev: any) => ({ ...prev, content: html }));
    };
    reader.readAsText(file);
  };

  const handleSaveTemplate = () => {
    saveTemplate.mutate({
      name: fields.subject || "Bez tytułu",
      ...fields
    }, {
      onSuccess: () => toast.success(t("gen_newsletter.saved"))
    });
  };

  return (
    <div className="flex flex-col h-full bg-muted/20 border-r border-border w-full md:w-[420px]">
      <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          {t("gen_newsletter.title")}
        </h1>
        <Button 
          size="sm" 
          className="h-8 gap-2" 
          onClick={handleGenerateContent}
          disabled={isGeneratingContent}
        >
          {isGeneratingContent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {t("gen_newsletter.generate_content")}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-24">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">{t("gen_newsletter.subject")}</Label>
              <div className="flex gap-2">
                <Input 
                  value={fields.subject} 
                  onChange={(e) => setFields((prev: any) => ({ ...prev, subject: e.target.value }))}
                  className="h-9 text-sm"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1"
                  onClick={handleGenerateSubject}
                  disabled={isGeneratingSubject || !fields.content}
                >
                  {isGeneratingSubject ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {t("gen_newsletter.generate_subject")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t("gen_newsletter.h1")}</Label>
              <Input 
                value={fields.h1} 
                onChange={(e) => setFields((prev: any) => ({ ...prev, h1: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t("gen_newsletter.content")}</Label>
              <Textarea 
                value={fields.content} 
                onChange={(e) => setFields((prev: any) => ({ ...prev, content: e.target.value }))}
                className="min-h-[200px] text-sm font-mono leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">{t("gen_newsletter.cta_text")}</Label>
                <Input 
                  value={fields.cta_text} 
                  onChange={(e) => setFields((prev: any) => ({ ...prev, cta_text: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">{t("gen_newsletter.cta_url")}</Label>
                <Input 
                  value={fields.cta_url} 
                  onChange={(e) => setFields((prev: any) => ({ ...prev, cta_url: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t("gen_newsletter.logo_url")}</Label>
              <Input 
                value={fields.logo_url} 
                onChange={(e) => setFields((prev: any) => ({ ...prev, logo_url: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t("gen_newsletter.primary_color")}</Label>
              <div className="flex gap-2">
                <Input 
                  type="color"
                  value={fields.primary_color} 
                  onChange={(e) => setFields((prev: any) => ({ ...prev, primary_color: e.target.value }))}
                  className="h-9 w-12 p-1"
                />
                <Input 
                  value={fields.primary_color} 
                  onChange={(e) => setFields((prev: any) => ({ ...prev, primary_color: e.target.value }))}
                  className="h-9 flex-1 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t("gen_newsletter.footer_text")}</Label>
              <Textarea 
                value={fields.footer_text} 
                onChange={(e) => setFields((prev: any) => ({ ...prev, footer_text: e.target.value }))}
                className="min-h-[60px] text-xs resize-none"
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="gap-2 h-9" onClick={onCopyHtml}>
          <Copy className="h-3.5 w-3.5" />
          {t("gen_newsletter.copy_html")}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 h-9" 
          onClick={handleGenerateImage}
          disabled={isGeneratingImage || !fields.content}
        >
          {isGeneratingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          {t("gen_newsletter.generate_image")}
        </Button>
        <Button variant="outline" size="sm" className="gap-2 h-9" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          {t("gen_newsletter.import_html")}
          <input type="file" accept=".html" hidden ref={fileInputRef} onChange={handleImportHtml} />
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          className="gap-2 h-9" 
          onClick={handleSaveTemplate}
          disabled={isSavingTemplate}
        >
          {isSavingTemplate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {t("gen_newsletter.save_template")}
        </Button>
      </div>
    </div>
  );
}
