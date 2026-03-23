// src/components/gen-docs/FileUploadZone.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUploadSourceFile } from '@/hooks/useGenDocs';
import { toast } from 'sonner';

interface UploadedFile {
  path: string;
  publicUrl: string;
  fileName: string;
  fileType: string;
}

interface FileUploadZoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
  files: UploadedFile[];
}

export function FileUploadZone({ onFilesChange, files }: FileUploadZoneProps) {
  const uploadMutation = useUploadSourceFile();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    const newFiles: UploadedFile[] = [...files];

    for (const file of acceptedFiles) {
      try {
        const result = await uploadMutation.mutateAsync(file);
        newFiles.push(result);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Błąd przesyłania pliku ${file.name}`);
      }
    }

    onFilesChange(newFiles);
    setIsUploading(false);
  }, [files, onFilesChange, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    }
  });

  const removeFile = (path: string) => {
    onFilesChange(files.filter(f => f.path !== path));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {isDragActive ? "Upuść pliki tutaj" : "Przeciągnij i upuść pliki lub kliknij, aby wybrać"}
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOCX, XLSX, PPTX, Obrazy
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <File className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs truncate">{file.fileName}</span>
              </div>
              <button
                onClick={() => removeFile(file.path)}
                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
