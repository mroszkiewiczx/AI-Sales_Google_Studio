// src/components/gen-content/PostResults.tsx
import { useI18n } from "@/contexts/I18nContext";
import { ContentPost } from "@/hooks/useGenContent";
import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";

interface PostResultsProps {
  posts: ContentPost[];
  generationId: string;
  selectedIndices: Set<number>;
  onToggleSelect: (idx: number) => void;
  onSaveToNotion: () => void;
  isSavingToNotion: boolean;
}

export function PostResults({
  posts, generationId, selectedIndices, onToggleSelect, onSaveToNotion, isSavingToNotion
}: PostResultsProps) {
  const { t } = useI18n();

  if (!posts.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Wyniki generowania
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 h-8 text-xs"
          onClick={onSaveToNotion}
          disabled={isSavingToNotion || selectedIndices.size === 0}
        >
          {isSavingToNotion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
          {t("gen_content.save_to_notion")} ({selectedIndices.size})
        </Button>
      </div>

      <div className="grid gap-6">
        {posts.map((post, idx) => (
          <PostCard
            key={idx}
            post={post}
            generationId={generationId}
            isSelected={selectedIndices.has(idx)}
            onToggleSelect={() => onToggleSelect(idx)}
          />
        ))}
      </div>
    </div>
  );
}
