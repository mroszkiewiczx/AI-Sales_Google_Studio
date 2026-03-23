// src/components/gen-docs/DocPreview.tsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, Download, FileText, FileCode, Presentation, FilePieChart, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PageContent, useGenDocsExport } from '@/hooks/useGenDocs';
import { toast } from 'sonner';

interface DocPreviewProps {
  pages: PageContent[];
  documentId?: string;
  isGenerating?: boolean;
}

export function DocPreview({ pages, documentId, isGenerating }: DocPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const exportMutation = useGenDocsExport();

  useEffect(() => {
    if (pages.length > 0) {
      setCurrentPage(1);
    }
  }, [pages]);

  const totalPages = pages.length;
  const currentPageContent = pages.find(p => p.page_num === currentPage)?.content_md || "";

  const handleDownloadHtml = () => {
    const fullHtml = pages.map(p => `<div>${p.content_md}</div>`).join('<hr/>');
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${documentId || 'new'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Dokument HTML został pobrany");
  };

  const handleExport = (format: 'docx' | 'pdf' | 'pptx') => {
    if (!documentId) {
      toast.error("Zapisz dokument przed eksportem");
      return;
    }
    exportMutation.mutate({ document_id: documentId, format });
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4 bg-muted/20 rounded-xl border-2 border-dashed border-muted-foreground/20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Generowanie dokumentu...</h3>
          <p className="text-sm text-muted-foreground">AI analizuje dane i tworzy treść</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4 bg-muted/20 rounded-xl border-2 border-dashed border-muted-foreground/20">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">Brak podglądu</h3>
          <p className="text-sm text-muted-foreground">Skonfiguruj dokument i kliknij "Generuj"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Strona {currentPage} z {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
            <Download className="h-4 w-4 mr-2" /> HTML
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('docx')}
            disabled={exportMutation.isPending}
          >
            <FileCode className="h-4 w-4 mr-2" /> DOCX
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('pdf')}
            disabled={exportMutation.isPending}
          >
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('pptx')}
            disabled={exportMutation.isPending}
          >
            <Presentation className="h-4 w-4 mr-2" /> PPTX
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-y-auto p-8 prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-zinc-950 shadow-lg border-zinc-200 dark:border-zinc-800 rounded-none min-h-[800px]">
        <ReactMarkdown>{currentPageContent}</ReactMarkdown>
      </Card>
    </div>
  );
}
