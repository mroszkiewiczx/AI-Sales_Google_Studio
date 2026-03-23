import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRecording } from "@/hooks/useRecording";

export function RecordingPanel() {
  const { isRecording, startRecording, stopRecording, error, transcript } = useRecording();
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Nagrywanie Live
        </CardTitle>
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono">{formatTime(timer)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-xs">Błąd mikrofonu</AlertTitle>
            <AlertDescription className="text-[10px]">
              {(error === "NotAllowedError" || error === "not-allowed")
                ? "Brak uprawnień do mikrofonu. - uruchom mikrofon lub sprawdź ustawienia prywatności w przeglądarce." 
                : `Wystąpił błąd: ${error}. Spróbuj odświeżyć stronę.`}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!isRecording ? (
            <Button className="flex-1 gap-2" onClick={startRecording}>
              <Mic className="h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button variant="destructive" className="flex-1 gap-2" onClick={stopRecording}>
              <Square className="h-4 w-4" />
              Stop
            </Button>
          )}
          <Button variant="outline" className="flex-1 gap-2" disabled={isRecording || !transcript}>
            <Send className="h-4 w-4" />
            Wyślij do OA
          </Button>
        </div>

        {isRecording && transcript && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs italic text-muted-foreground line-clamp-3">
              {transcript}...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
