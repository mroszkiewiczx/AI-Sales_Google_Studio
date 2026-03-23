import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileAudio, FileVideo, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ACCEPTED_MIME = [
  "audio/*", "video/*", ".mp3", ".wav", ".m4a", ".mp4", ".mov"
];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function FileUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.size <= MAX_FILE_SIZE) {
      setFile(droppedFile);
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.size <= MAX_FILE_SIZE) {
      setFile(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <Card className={cn(
      "border-2 border-dashed transition-colors",
      isDragging ? "border-primary bg-primary/5" : "border-border",
      file ? "border-solid" : ""
    )}>
      <CardContent className="p-6">
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center text-center space-y-4 cursor-pointer"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Przeciągnij plik lub kliknij</p>
              <p className="text-xs text-muted-foreground">Audio/Video do 500MB</p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={ACCEPTED_MIME.join(",")}
              onChange={onFileSelect}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {file.type.startsWith("audio") ? (
                  <FileAudio className="h-8 w-8 text-primary" />
                ) : (
                  <FileVideo className="h-8 w-8 text-primary" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-[10px] text-center text-muted-foreground">Przesyłanie... {uploadProgress}%</p>
              </div>
            )}

            <Button className="w-full" onClick={() => setUploadProgress(45)}>
              Rozpocznij Transkrypcję
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
