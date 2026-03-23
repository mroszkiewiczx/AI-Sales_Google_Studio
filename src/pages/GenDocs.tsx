// src/pages/GenDocs.tsx
import React, { useState } from 'react';
import { useI18n } from "@/contexts/I18nContext";
import { useGenDocsGenerate, useGenDocsHistory, PageContent } from "@/hooks/useGenDocs";
import { FileUploadZone } from "@/components/gen-docs/FileUploadZone";
import { DocPreview } from "@/components/gen-docs/DocPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, History, FileText, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GenDocsPage() {
  const { t } = useI18n();
  const [docType, setDocType] = useState('oferta');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('profesjonalny');
  const [model, setModel] = useState('google/gemini-2.5-flash');
  const [useBrand, setUseBrand] = useState(true);
  const [sourceFiles, setSourceFiles] = useState<any[]>([]);
  const [generatedPages, setGeneratedPages] = useState<PageContent[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | undefined>();

  const generateMutation = useGenDocsGenerate();
  const { data: history } = useGenDocsHistory();

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error("Wpisz prompt dla AI");
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        doc_type: docType,
        prompt,
        tone,
        model,
        source_file_urls: sourceFiles.map(f => f.publicUrl),
        use_brand: useBrand
      });

      setGeneratedPages(result.pages_content);
      setCurrentDocId(result.document_id);
    } catch (error) {
      console.error("Generation error:", error);
    }
  };

  const loadFromHistory = (doc: any) => {
    setDocType(doc.doc_type);
    setPrompt(doc.prompt);
    setTone(doc.tone);
    setModel(doc.model_used);
    setGeneratedPages(doc.pages_content || []);
    setCurrentDocId(doc.id);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Column - Config */}
      <div className="w-96 border-r border-border bg-muted/10 overflow-y-auto p-6 space-y-8">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generator Dokumentów AI
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Twórz profesjonalne dokumenty w sekundę</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Źródła danych</Label>
            <FileUploadZone files={sourceFiles} onFilesChange={setSourceFiles} />
          </div>

          <div className="space-y-2">
            <Label>Typ dokumentu</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oferta">Oferta handlowa</SelectItem>
                <SelectItem value="raport">Raport</SelectItem>
                <SelectItem value="prezentacja">Prezentacja</SelectItem>
                <SelectItem value="analiza">Analiza</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="pptx">Prezentacja PPTX</SelectItem>
                <SelectItem value="pdf">Dokument PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Prompt dla AI</Label>
            <Textarea
              placeholder="Napisz dokument na podstawie..."
              className="h-32 resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ton</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz ton" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profesjonalny">Profesjonalny</SelectItem>
                  <SelectItem value="techniczny">Techniczny</SelectItem>
                  <SelectItem value="sprzedażowy">Sprzedażowy</SelectItem>
                  <SelectItem value="neutralny">Neutralny</SelectItem>
                  <SelectItem value="edukacyjny">Edukacyjny</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model AI</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="anthropic/claude-3-haiku">Claude 3 Haiku</SelectItem>
                  <SelectItem value="openai/gpt-4o-mini">GPT-4o Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
            <div className="space-y-0.5">
              <Label className="text-sm">Szablon marki</Label>
              <p className="text-xs text-muted-foreground">Użyj logo i kolorów firmy</p>
            </div>
            <Switch checked={useBrand} onCheckedChange={setUseBrand} />
          </div>

          <Button 
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 shadow-lg"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-5 w-5 mr-2" />
            )}
            ✦ Generuj Dokument
          </Button>
        </div>

        {history && history.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4" />
              Ostatnio wygenerowane
            </h3>
            <div className="space-y-2">
              {history.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => loadFromHistory(doc)}
                  className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border group"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium truncate flex-1">{doc.prompt}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(doc.created_at).toLocaleDateString()} • {doc.doc_type}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Preview */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden flex flex-col p-8">
        <DocPreview 
          pages={generatedPages} 
          documentId={currentDocId} 
          isGenerating={generateMutation.isPending} 
        />
      </div>
    </div>
  );
}
