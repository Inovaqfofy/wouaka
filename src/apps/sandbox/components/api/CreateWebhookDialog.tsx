import { useState } from 'react';
import { Copy, Check, Webhook } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

const WEBHOOK_EVENTS = [
  { id: 'score.completed', label: 'Score calculé', description: 'Quand un scoring est terminé' },
  { id: 'score.failed', label: 'Score échoué', description: 'Quand un scoring échoue' },
  { id: 'kyc.validated', label: 'KYC validé', description: 'Quand un KYC est approuvé' },
  { id: 'kyc.rejected', label: 'KYC rejeté', description: 'Quand un KYC est refusé' },
  { id: 'identity.verified', label: 'Identité vérifiée', description: 'Quand une identité est confirmée' },
];

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWebhook: (name: string, url: string, events: string[]) => Promise<any>;
}

export function CreateWebhookDialog({ open, onOpenChange, onCreateWebhook }: CreateWebhookDialogProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['score.completed']);
  const [isLoading, setIsLoading] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !url.trim() || events.length === 0) return;
    
    setIsLoading(true);
    const result = await onCreateWebhook(name, url, events);
    setIsLoading(false);

    if (result?.secret) {
      setCreatedSecret(result.secret);
    }
  };

  const handleCopy = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setEvents(['score.completed']);
    setCreatedSecret(null);
    onOpenChange(false);
  };

  const toggleEvent = (eventId: string) => {
    setEvents(prev => 
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            {createdSecret ? 'Webhook créé' : 'Nouveau webhook'}
          </DialogTitle>
          <DialogDescription>
            {createdSecret 
              ? 'Sauvegardez ce secret pour vérifier les signatures.'
              : 'Configurez un endpoint pour recevoir les événements'}
          </DialogDescription>
        </DialogHeader>

        {createdSecret ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <p className="text-sm text-muted-foreground mb-2">Secret de signature HMAC:</p>
                <code className="font-mono text-sm break-all">{createdSecret}</code>
              </AlertDescription>
            </Alert>
            <Button onClick={handleCopy} className="w-full">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copié !' : 'Copier le secret'}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-name">Nom</Label>
                <Input
                  id="webhook-name"
                  placeholder="Mon webhook production"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="webhook-url">URL de l'endpoint</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://api.example.com/webhook"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div>
                <Label>Événements</Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {WEBHOOK_EVENTS.map(event => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.id}
                        checked={events.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <label htmlFor={event.id} className="text-sm cursor-pointer">
                        <span className="font-medium">{event.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">- {event.description}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={!name.trim() || !url.trim() || events.length === 0 || isLoading}
              >
                {isLoading ? 'Création...' : 'Créer le webhook'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
