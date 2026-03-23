// src/pages/Templates.tsx
import React, { useState } from 'react';
import { useI18n } from "@/contexts/I18nContext";
import { TemplateList } from "@/components/templates/TemplateList";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { Template } from "@/hooks/useTemplates";
import { BookOpen, Search, Filter, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TemplatesPage() {
  const { t } = useI18n();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | undefined>();

  const handleNewTemplate = () => {
    setSelectedTemplate(undefined);
  };

  const handleTemplateSaved = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleTemplateDeleted = () => {
    setSelectedTemplate(undefined);
  };

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Left Column - List */}
      <div className="w-96 border-r border-border flex flex-col p-6 gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Biblioteka Szablonów
          </h1>
        </div>

        <div className="flex-1 overflow-hidden">
          <TemplateList 
            onSelect={setSelectedTemplate} 
            selectedId={selectedTemplate?.id}
            onNew={handleNewTemplate}
          />
        </div>
      </div>

      {/* Right Column - Editor */}
      <div className="flex-1 overflow-hidden p-8">
        <TemplateEditor 
          template={selectedTemplate} 
          onSaved={handleTemplateSaved}
          onDeleted={handleTemplateDeleted}
        />
      </div>
    </div>
  );
}
