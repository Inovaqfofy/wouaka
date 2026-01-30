import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTicketTags, useAddTicketTag, useRemoveTicketTag } from "@/hooks/useTicketEnhanced";
import { X, Plus, Bot, Tag } from "lucide-react";
import { toast } from "sonner";

interface TicketTagsEditorProps {
  ticketId: string;
  readonly?: boolean;
}

const SUGGESTED_TAGS = [
  '#ScoringIssue',
  '#KycProblem',
  '#PaymentIssue',
  '#TechnicalBug',
  '#AccessIssue',
  '#Urgent',
  '#VIP',
  '#Escalated'
];

export function TicketTagsEditor({ ticketId, readonly = false }: TicketTagsEditorProps) {
  const { data: tags, isLoading } = useTicketTags(ticketId);
  const addTag = useAddTicketTag();
  const removeTag = useRemoveTicketTag();
  const [newTag, setNewTag] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddTag = async (tag: string) => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    
    if (tags?.some(t => t.tag === cleanTag)) {
      toast.error("Ce tag existe déjà");
      return;
    }

    try {
      await addTag.mutateAsync({ ticketId, tag: cleanTag });
      setNewTag("");
      setShowSuggestions(false);
    } catch (error) {
      toast.error("Erreur lors de l'ajout du tag");
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await removeTag.mutateAsync({ ticketId, tag });
    } catch (error) {
      toast.error("Erreur lors de la suppression du tag");
    }
  };

  const existingTagNames = tags?.map(t => t.tag) || [];
  const availableSuggestions = SUGGESTED_TAGS.filter(t => !existingTagNames.includes(t));

  if (isLoading) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse h-6 w-20 bg-muted rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tags</span>
      </div>

      {/* Current Tags */}
      <div className="flex flex-wrap gap-2">
        {(tags || []).map((tag) => (
          <Badge 
            key={tag.id} 
            variant={tag.source === 'ai' ? 'secondary' : 'default'}
            className="gap-1 pr-1"
          >
            {tag.source === 'ai' && <Bot className="w-3 h-3" />}
            {tag.tag}
            {tag.confidence < 1 && (
              <span className="text-xs opacity-70">
                ({Math.round(tag.confidence * 100)}%)
              </span>
            )}
            {!readonly && (
              <button
                onClick={() => handleRemoveTag(tag.tag)}
                className="ml-1 p-0.5 hover:bg-primary-foreground/20 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}

        {tags?.length === 0 && (
          <span className="text-sm text-muted-foreground">Aucun tag</span>
        )}
      </div>

      {/* Add New Tag */}
      {!readonly && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Ajouter un tag..."
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag) {
                  handleAddTag(newTag);
                }
              }}
              className="h-8 text-sm"
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleAddTag(newTag)}
              disabled={!newTag || addTag.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions */}
          {showSuggestions && availableSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {availableSuggestions.slice(0, 5).map(suggestion => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleAddTag(suggestion)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
