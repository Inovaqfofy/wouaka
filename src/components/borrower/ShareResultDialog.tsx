import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Link as LinkIcon, 
  Mail, 
  Copy, 
  Check, 
  Loader2,
  ExternalLink,
  QrCode,
  Share2
} from 'lucide-react';

interface ShareResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultType: 'score' | 'kyc';
  resultId: string;
  resultSummary?: {
    score?: number;
    grade?: string;
    status?: string;
  };
}

export function ShareResultDialog({
  open,
  onOpenChange,
  resultType,
  resultId,
  resultSummary
}: ShareResultDialogProps) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const createShareLink = async () => {
    if (!user?.id) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('borrower_shared_results')
        .insert({
          borrower_id: user.id,
          result_type: resultType,
          result_id: resultId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
        })
        .select('share_token')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/shared/${data.share_token}`;
      setShareLink(link);
      toast.success('Lien de partage créé');
    } catch (error) {
      console.error('Erreur création lien:', error);
      toast.error('Erreur lors de la création du lien');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Lien copié dans le presse-papier');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const sendByEmail = async () => {
    if (!user?.id || !email) return;

    setIsSending(true);
    try {
      // Créer un lien si pas encore fait
      let link = shareLink;
      if (!link) {
        const { data, error } = await supabase
          .from('borrower_shared_results')
          .insert({
            borrower_id: user.id,
            result_type: resultType,
            result_id: resultId,
            shared_with_email: email,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select('share_token')
          .single();

        if (error) throw error;
        link = `${window.location.origin}/shared/${data.share_token}`;
        setShareLink(link);
      }

      // TODO: Envoyer l'email via edge function
      toast.success(`Invitation envoyée à ${email}`);
      setEmail('');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const getResultLabel = () => {
    if (resultType === 'score') {
      return resultSummary?.score 
        ? `Score: ${resultSummary.score} (${resultSummary.grade})`
        : 'Score de crédit';
    }
    return resultSummary?.status 
      ? `KYC: ${resultSummary.status}`
      : 'Vérification KYC';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Partager mon résultat
          </DialogTitle>
          <DialogDescription>
            Partagez votre {resultType === 'score' ? 'score de crédit' : 'vérification KYC'} avec un prêteur de votre choix.
          </DialogDescription>
        </DialogHeader>

        {/* Résumé du résultat */}
        <div className="p-3 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Résultat à partager</p>
          <p className="font-semibold">{getResultLabel()}</p>
        </div>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              Lien
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 pt-4">
            {!shareLink ? (
              <Button 
                onClick={createShareLink} 
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Créer un lien de partage
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input 
                    value={shareLink} 
                    readOnly 
                    className="text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(shareLink, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voir la page partagée
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Ce lien expire dans 30 jours
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email du prêteur</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@preteur.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button 
              onClick={sendByEmail} 
              className="w-full"
              disabled={!email || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
