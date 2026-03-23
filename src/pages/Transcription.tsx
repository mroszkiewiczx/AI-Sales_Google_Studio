import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptConfig } from "@/components/transcription/TranscriptConfig";
import { FileUploadZone } from "@/components/transcription/FileUploadZone";
import { RecordingPanel } from "@/components/transcription/RecordingPanel";
import { ContactForm } from "@/components/transcription/ContactForm";
import { LiveQuestionPanel } from "@/components/transcription/LiveQuestionPanel";
import { TranscriptViewer } from "@/components/transcription/TranscriptViewer";
import { QuestionsList } from "@/components/transcription/QuestionsList";

export function TranscriptionPage() {
  const [mode, setMode] = useState<"upload" | "record">("upload");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Column: 380px */}
      <div className="w-[380px] border-r border-border bg-muted/30 flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "upload" | "record")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="record">Record</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {mode === "upload" ? (
            <>
              <TranscriptConfig />
              <FileUploadZone />
            </>
          ) : (
            <>
              <RecordingPanel />
              <ContactForm />
            </>
          )}

          <LiveQuestionPanel />
        </div>
      </div>

      {/* Right Column: flex-1 */}
      <div className="flex-1 flex flex-col h-full bg-background">
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <TranscriptViewer />
          <QuestionsList />
        </div>
      </div>
    </div>
  );
}
