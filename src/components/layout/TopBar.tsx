import { Search } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export function TopBar({ onOpenCommandPalette }: { onOpenCommandPalette: () => void }) {
  const { t } = useI18n();
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <button onClick={onOpenCommandPalette} className="flex items-center gap-2 text-sm text-muted-foreground w-full max-w-sm rounded-md border px-3 py-1.5 hover:bg-accent transition-colors">
        <Search className="h-4 w-4" />
        <span>Szukaj (Ctrl+K)</span>
      </button>
    </header>
  );
}
