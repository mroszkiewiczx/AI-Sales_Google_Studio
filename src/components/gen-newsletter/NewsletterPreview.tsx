// src/components/gen-newsletter/NewsletterPreview.tsx
import { useI18n } from "@/contexts/I18nContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Smartphone, Monitor } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NewsletterPreviewProps {
  html: string;
}

export function NewsletterPreview({ html }: NewsletterPreviewProps) {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          {t("gen_newsletter.preview")}
        </h2>
        <div className="flex bg-muted p-1 rounded-md">
          <button
            onClick={() => setViewMode("desktop")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              viewMode === "desktop" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={cn(
              "p-1.5 rounded-md transition-all",
              viewMode === "mobile" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-muted/30 flex justify-center">
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out bg-white shadow-xl rounded-lg overflow-hidden border border-border",
            viewMode === "desktop" ? "w-full max-w-[640px]" : "w-[375px]"
          )}
        >
          <iframe
            srcDoc={html}
            title="Newsletter Preview"
            className="w-full h-[calc(100vh-200px)] border-none"
          />
        </div>
      </div>
    </div>
  );
}
