import { useState } from "react";
import { UserPlus, Mail, User, Building2, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  INVITABLE_ROLES, 
  ROLE_LABELS, 
  ROLE_DESCRIPTIONS,
  type AppRole 
} from "@/lib/roles";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<AppRole>("PARTENAIRE");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez entrer l'adresse email de l'utilisateur",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create user via Supabase Auth admin API (edge function)
      const { data, error } = await supabase.functions.invoke("admin-invite-user", {
        body: {
          email,
          fullName: fullName || email,
          company,
          role,
        },
      });

      if (error) throw error;

      toast({
        title: "Invitation envoyée",
        description: `Un email d'invitation a été envoyé à ${email}`,
      });

      // Reset form
      setEmail("");
      setFullName("");
      setCompany("");
      setRole("PARTENAIRE");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Inviter un utilisateur
          </DialogTitle>
          <DialogDescription>
            Envoyez une invitation par email pour créer un nouveau compte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="utilisateur@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nom complet
            </Label>
            <Input
              id="fullName"
              placeholder="Jean Dupont"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Entreprise
            </Label>
            <Input
              id="company"
              placeholder="Nom de l'entreprise"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rôle
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{ROLE_LABELS[r]}</span>
                      <span className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS[r]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === "SUPER_ADMIN" && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              <strong>Attention :</strong> Le rôle Super Admin donne un accès complet à toutes les fonctionnalités.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleInvite} disabled={isLoading}>
            {isLoading ? "Envoi..." : "Envoyer l'invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
