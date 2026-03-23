// src/components/gen-content/BaseContentEditor.tsx
import { useI18n } from "@/contexts/I18nContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface BaseContentEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BaseContentEditor({ value, onChange }: BaseContentEditorProps) {
  const { t } = useI18n();

  return (
    <Card className="shadow-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          {t("gen_content.base_content")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Textarea
          placeholder={t("gen_content.context_placeholder")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[150px] text-sm resize-none"
        />
      </CardContent>
    </Card>
  );
}
