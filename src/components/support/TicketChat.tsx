import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useTicketMessages,
  useAddTicketMessage,
  TicketMessage,
} from "@/hooks/useSupportTickets";
import { useAuth } from "@/hooks/useAuth";
import { Send, Loader2, Lock, User, Headphones, Building2 } from "lucide-react";

interface TicketChatProps {
  ticketId: string;
  ticketStatus: string;
}

export function TicketChat({ ticketId, ticketStatus }: TicketChatProps) {
  const { user, role } = useAuth();
  const { data: messages, isLoading } = useTicketMessages(ticketId);
  const addMessage = useAddTicketMessage();
  
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = role === "SUPER_ADMIN";
  const isPartner = role === "PARTENAIRE";
  const canWriteInternal = isAdmin || isPartner;
  const isClosed = ticketStatus === "closed";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await addMessage.mutateAsync({
      ticket_id: ticketId,
      content: content.trim(),
      is_internal: isInternal,
    });

    setContent("");
    setIsInternal(false);
  };

  const getAuthorIcon = (authorRole: string) => {
    switch (authorRole) {
      case "agent":
        return <Headphones className="w-4 h-4" />;
      case "partner":
        return <Building2 className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getAuthorColor = (authorRole: string) => {
    switch (authorRole) {
      case "agent":
        return "bg-primary text-primary-foreground";
      case "partner":
        return "bg-blue-600 text-white";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Conversation</CardTitle>
      </CardHeader>

      <Separator />

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.author_id === user?.id ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className={`w-8 h-8 ${getAuthorColor(message.author_role)}`}>
                <AvatarFallback className="text-xs">
                  {getAuthorIcon(message.author_role)}
                </AvatarFallback>
              </Avatar>

              <div
                className={`flex-1 max-w-[80%] ${
                  message.author_id === user?.id ? "text-right" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {message.author?.full_name || "Utilisateur"}
                  </span>
                  {message.is_internal && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      Interne
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), "d MMM HH:mm", { locale: fr })}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-lg ${
                    message.author_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : message.is_internal
                      ? "bg-amber-50 dark:bg-amber-950 border border-amber-200"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {messages?.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Aucun message pour le moment
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Input */}
      {!isClosed ? (
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <Textarea
            placeholder="Écrivez votre message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-none"
          />

          <div className="flex items-center justify-between">
            {canWriteInternal && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="internal"
                  checked={isInternal}
                  onCheckedChange={(checked) => setIsInternal(!!checked)}
                />
                <Label htmlFor="internal" className="text-sm text-muted-foreground cursor-pointer">
                  Note interne (invisible pour l'utilisateur)
                </Label>
              </div>
            )}

            <Button
              type="submit"
              disabled={!content.trim() || addMessage.isPending}
              className="ml-auto"
            >
              {addMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 text-center text-muted-foreground bg-muted/50">
          Ce ticket est fermé. Créez un nouveau ticket si besoin.
        </div>
      )}
    </Card>
  );
}
