import { useState, useCallback, useRef } from "react";

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      // 1. Request microphone access explicitly BEFORE initializing SpeechRecognition
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately, we just needed the permission
      stream.getTracks().forEach(track => track.stop());

      // 2. Initialize SpeechRecognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser.");
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "pl-PL";

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        
        // Map specific errors to user-friendly messages
        if (event.error === 'not-allowed') {
          setError("Brak dostępu do mikrofonu. Sprawdź ustawienia przeglądarki.");
        } else if (event.error === 'no-speech') {
          setError("Nie wykryto mowy. Spróbuj ponownie.");
        } else {
          setError(`Błąd rozpoznawania mowy: ${event.error}`);
        }
        
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      
      if (err.name === 'NotAllowedError') {
        setError("Brak dostępu do mikrofonu. Sprawdź ustawienia przeglądarki.");
      } else if (err.name === 'NotFoundError') {
        setError("Nie znaleziono mikrofonu.");
      } else {
        setError(err.message || "Błąd podczas uruchamiania nagrywania.");
      }
      
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
    transcript
  };
}
