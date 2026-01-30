import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSubmitCSAT, useTicketCSAT } from "@/hooks/useTicketEnhanced";
import { Star, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CSATSurveyProps {
  ticketId: string;
  onComplete?: () => void;
}

export function CSATSurvey({ ticketId, onComplete }: CSATSurveyProps) {
  const { data: existingCSAT, isLoading } = useTicketCSAT(ticketId);
  const submitCSAT = useSubmitCSAT();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [resolutionQuality, setResolutionQuality] = useState(0);
  const [responseSpeed, setResponseSpeed] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Veuillez donner une note");
      return;
    }

    try {
      await submitCSAT.mutateAsync({
        ticketId,
        rating,
        feedback: feedback || undefined,
        resolutionQuality: resolutionQuality || undefined,
        responseSpeed: responseSpeed || undefined
      });
      toast.success("Merci pour votre avis!");
      onComplete?.();
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/2 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (existingCSAT) {
    return (
      <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-medium">Merci pour votre avis!</p>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={cn(
                      "w-4 h-4",
                      star <= existingCSAT.rating 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-muted"
                    )} 
                  />
                ))}
              </div>
              {existingCSAT.feedback && (
                <p className="text-sm text-muted-foreground mt-2">
                  "{existingCSAT.feedback}"
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star 
              className={cn(
                "w-6 h-6 transition-colors",
                star <= value 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-muted-foreground hover:text-yellow-300"
              )} 
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Comment s'est passée la résolution?
        </CardTitle>
        <CardDescription>
          Votre avis nous aide à améliorer notre service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Rating */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Note globale *</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-125"
              >
                <Star 
                  className={cn(
                    "w-10 h-10 transition-colors",
                    star <= (hoverRating || rating) 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-muted-foreground"
                  )} 
                />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {rating === 1 && "Très insatisfait"}
            {rating === 2 && "Insatisfait"}
            {rating === 3 && "Neutre"}
            {rating === 4 && "Satisfait"}
            {rating === 5 && "Très satisfait"}
          </p>
        </div>

        {/* Additional ratings */}
        <div className="grid grid-cols-2 gap-4">
          <StarRating 
            value={resolutionQuality} 
            onChange={setResolutionQuality}
            label="Qualité de la résolution"
          />
          <StarRating 
            value={responseSpeed} 
            onChange={setResponseSpeed}
            label="Rapidité de réponse"
          />
        </div>

        {/* Feedback */}
        <div className="space-y-2">
          <Label htmlFor="feedback">Commentaire (optionnel)</Label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Dites-nous en plus sur votre expérience..."
            className="resize-none"
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={rating === 0 || submitCSAT.isPending}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {submitCSAT.isPending ? "Envoi..." : "Envoyer mon avis"}
        </Button>
      </CardContent>
    </Card>
  );
}
