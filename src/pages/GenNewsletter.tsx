// src/pages/GenNewsletter.tsx
import { useState, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useNewsletterPreview, useNewsletterTemplates } from "@/hooks/useGenNewsletter";
import { NewsletterForm } from "@/components/gen-newsletter/NewsletterForm";
import { NewsletterPreview } from "@/components/gen-newsletter/NewsletterPreview";
import { TemplatePicker } from "@/components/gen-newsletter/TemplatePicker";
import { Button } from "@/components/ui/button";
import { Settings, History, Mail } from "lucide-react";
import { toast } from "sonner";

export default function GenNewsletterPage() {
  const { t } = useI18n();
  
  // Form State
  const [fields, setFields] = useState({
    subject: "",
    h1: "",
    content: "",
    cta_text: "",
    cta_url: "",
    logo_url: "",
    primary_color: "#6366f1",
    footer_text: "Wiadomość wygenerowana automatycznie",
    header_image_url: ""
  });

  const { previewHtml } = useNewsletterPreview(fields);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(previewHtml);
    toast.success(t("gen_newsletter.copied"));
  };

  const handleSelectTemplate = (template: any) => {
    setFields({
      subject: template.subject || "",
      h1: template.h1 || "",
      content: template.content || "",
      cta_text: template.cta_text || "",
      cta_url: template.cta_url || "",
      logo_url: template.logo_url || "",
      primary_color: template.primary_color || "#6366f1",
      footer_text: template.footer_text || "Wiadomość wygenerowana automatycznie",
      header_image_url: template.header_image_url || ""
    });
    toast.success("Szablon wczytany!");
  };

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Left Column: Configuration */}
      <NewsletterForm 
        fields={fields} 
        setFields={setFields} 
        onCopyHtml={handleCopyHtml} 
      />

      {/* Right Column: Preview */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <TemplatePicker onSelect={handleSelectTemplate} />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <NewsletterPreview html={previewHtml} />
      </div>
    </div>
  );
}
