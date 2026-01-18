import { useState } from 'react';
import { Copy, Check, Key } from 'lucide-react';
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

const PERMISSIONS = [
  { id: 'score', label: 'Scoring', description: 'Calculer des scores de crédit' },
  { id: 'kyc', label: 'KYC', description: 'Vérifications KYC' },
  { id: 'identity', label: 'Identité', description: 'Vérification d\'identité' },
];

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateKey: (name: string, permissions: string[], expiresInDays?: number) => Promise<any>;
}

export function CreateApiKeyDialog({ open, onOpenChange, onCreateKey }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['score', 'kyc', 'identity']);
  const [expiresInDays, setExpiresInDays] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    const result = await onCreateKey(
      name, 
      permissions, 
      expiresInDays ? parseInt(expiresInDays) : undefined
    );
    setIsLoading(false);

    if (result?.key) {
      setCreatedKey(result.key);
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setPermissions(['score', 'kyc', 'identity']);
    setExpiresInDays('');
    setCreatedKey(null);
    onOpenChange(false);
  };

  const togglePermission = (permissionId: string) => {
    setPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {createdKey ? 'Clé API créée' : 'Nouvelle clé API'}
          </DialogTitle>
          <DialogDescription>
            {createdKey 
              ? 'Copiez cette clé maintenant. Elle ne sera plus affichée.'
              : 'Créez une nouvelle clé pour accéder à l\'API Wouaka'}
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription className="font-mono text-sm break-all">
                {createdKey}
              </AlertDescription>
            </Alert>
            <Button onClick={handleCopy} className="w-full">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copié !' : 'Copier la clé'}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la clé</Label>
                <Input
                  id="name"
                  placeholder="Production, Staging, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 mt-2">
                  {PERMISSIONS.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={permissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <label htmlFor={permission.id} className="text-sm cursor-pointer">
                        <span className="font-medium">{permission.label}</span>
                        <span className="text-muted-foreground ml-2">- {permission.description}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="expires">Expiration (jours, optionnel)</Label>
                <Input
                  id="expires"
                  type="number"
                  placeholder="30, 90, 365..."
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={!name.trim() || isLoading}>
                {isLoading ? 'Création...' : 'Créer la clé'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
