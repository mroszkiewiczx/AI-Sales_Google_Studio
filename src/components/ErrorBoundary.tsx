import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isSupabaseError = this.state.error?.message.includes("VITE_SUPABASE_URL");

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6">
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Wystąpił błąd</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {isSupabaseError 
                ? "Brak konfiguracji Supabase. Upewnij się, że zmienne VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY są ustawione w panelu Secrets."
                : this.state.error?.message || "Coś poszło nie tak podczas renderowania aplikacji."}
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Odśwież stronę
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
