import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CreditCard,
  Calendar,
  User,
  FileText,
  Check,
  Search,
  Building,
  Gift,
  Banknote,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BORROWER_PLANS, PARTNER_PLANS } from "@/lib/pricing-plans";
import {
  useCreateManualSubscription,
  type PaymentMethod,
  type SubscriptionType,
} from "@/hooks/useAdminSubscriptionMutations";

interface ManualSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedUser?: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { value: "bank_transfer", label: "Virement bancaire", icon: Building },
  { value: "check", label: "Chèque", icon: FileText },
  { value: "promo", label: "Offre promotionnelle", icon: Gift },
  { value: "cash", label: "Espèces", icon: Banknote },
  { value: "other", label: "Autre", icon: CreditCard },
];

export function ManualSubscriptionDialog({
  open,
  onOpenChange,
  preselectedUser,
}: ManualSubscriptionDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
    fullName: string | null;
  } | null>(preselectedUser || null);
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>("borrower");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customRecertifications, setCustomRecertifications] = useState<string>("");
  const [customDossiers, setCustomDossiers] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const createMutation = useCreateManualSubscription();

  // Fetch users for search
  const { data: users } = useQuery({
    queryKey: ["admin-users-search", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, email, full_name, company")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(
          `email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`
        );
      }

      const { data } = await query;
      return data || [];
    },
    enabled: open && !preselectedUser,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (preselectedUser) {
        setSelectedUser(preselectedUser);
      } else {
        setSelectedUser(null);
      }
      setSubscriptionType("borrower");
      setSelectedPlanId("");
      setCustomEndDate(undefined);
      setUseCustomDate(false);
      setCustomRecertifications("");
      setCustomDossiers("");
      setPaymentMethod("bank_transfer");
      setPaymentReference("");
      setAdminNote("");
      setSendEmail(true);
      setSearchQuery("");
    }
  }, [open, preselectedUser]);

  const plans = subscriptionType === "borrower" ? BORROWER_PLANS : PARTNER_PLANS;
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubmit = async () => {
    if (!selectedUser || !selectedPlanId || !selectedPlan) return;

    const amount = selectedPlan.price || 0;
    const validityDays = subscriptionType === "borrower" 
      ? (selectedPlan as typeof BORROWER_PLANS[0]).validityDays 
      : 30;

    await createMutation.mutateAsync({
      userId: selectedUser.id,
      type: subscriptionType,
      planId: selectedPlanId,
      planSlug: selectedPlanId,
      planName: selectedPlan.name,
      amount,
      customEndDate: useCustomDate ? customEndDate : undefined,
      customValidityDays: validityDays,
      customLimits: {
        recertifications: customRecertifications ? parseInt(customRecertifications) : undefined,
        dossiers: customDossiers ? parseInt(customDossiers) : undefined,
      },
      paymentMethod,
      paymentReference: paymentReference || undefined,
      adminNote: adminNote || undefined,
      sendConfirmationEmail: sendEmail,
    });

    onOpenChange(false);
  };

  const canSubmit = selectedUser && selectedPlanId && paymentMethod;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Attribuer un forfait manuellement
          </DialogTitle>
          <DialogDescription>
            Créer un abonnement pour un utilisateur ayant payé par chèque, virement ou autre méthode hors-ligne.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Utilisateur
            </Label>
            
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{selectedUser.fullName || "Sans nom"}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                {!preselectedUser && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    Changer
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par email, nom ou entreprise..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                  {users?.map((user) => (
                    <button
                      key={user.id}
                      className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center justify-between"
                      onClick={() => setSelectedUser({
                        id: user.id,
                        email: user.email,
                        fullName: user.full_name,
                      })}
                    >
                      <div>
                        <p className="font-medium">{user.full_name || "Sans nom"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      {user.company && (
                        <Badge variant="outline" className="text-xs">
                          {user.company}
                        </Badge>
                      )}
                    </button>
                  ))}
                  {users?.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      Aucun utilisateur trouvé
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Subscription Type */}
          <div className="space-y-3">
            <Label>Type d'abonnement</Label>
            <RadioGroup
              value={subscriptionType}
              onValueChange={(v) => {
                setSubscriptionType(v as SubscriptionType);
                setSelectedPlanId("");
              }}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="type-borrower"
                className={cn(
                  "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all",
                  subscriptionType === "borrower" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="borrower" id="type-borrower" className="sr-only" />
                <User className="w-8 h-8 mb-2 text-primary" />
                <span className="font-medium">Emprunteur (B2C)</span>
                <span className="text-xs text-muted-foreground">Certificat de confiance</span>
              </Label>
              <Label
                htmlFor="type-partner"
                className={cn(
                  "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all",
                  subscriptionType === "partner" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="partner" id="type-partner" className="sr-only" />
                <Building className="w-8 h-8 mb-2 text-primary" />
                <span className="font-medium">Partenaire (B2B)</span>
                <span className="text-xs text-muted-foreground">API & Quotas dossiers</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Plan Selection */}
          <div className="space-y-3">
            <Label>Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-muted-foreground">
                        {plan.price === null ? "Sur devis" : `${plan.price?.toLocaleString()} FCFA`}
                      </span>
                      {plan.popular && <Badge variant="secondary" className="text-xs">Populaire</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlan && (
              <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
            )}
          </div>

          <Separator />

          {/* Custom Date */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de fin personnalisée
              </Label>
              <Switch checked={useCustomDate} onCheckedChange={setUseCustomDate} />
            </div>
            {useCustomDate && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {customEndDate
                      ? format(customEndDate, "PPP", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Custom Quotas */}
          {subscriptionType === "borrower" && (
            <div className="space-y-3">
              <Label>Quotas personnalisés (optionnel)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Recertifications</Label>
                  <Input
                    type="number"
                    placeholder="Par défaut du plan"
                    value={customRecertifications}
                    onChange={(e) => setCustomRecertifications(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {subscriptionType === "partner" && (
            <div className="space-y-3">
              <Label>Quotas personnalisés (optionnel)</Label>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Dossiers mensuels</Label>
                <Input
                  type="number"
                  placeholder="Par défaut du plan"
                  value={customDossiers}
                  onChange={(e) => setCustomDossiers(e.target.value)}
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Mode de paiement</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <method.icon className="w-4 h-4" />
                      {method.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label>Référence du paiement (optionnel)</Label>
            <Input
              placeholder="ex: VIR-2026-00123, CHK-456..."
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>

          {/* Admin Note */}
          <div className="space-y-2">
            <Label>Note administrative (optionnel)</Label>
            <Textarea
              placeholder="Commentaire interne sur cette attribution..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
            />
          </div>

          {/* Send Email */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Envoyer un email de confirmation</Label>
              <p className="text-sm text-muted-foreground">
                L'utilisateur recevra un email confirmant l'activation de son forfait
              </p>
            </div>
            <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createMutation.isPending}
            className="gap-2"
          >
            {createMutation.isPending ? (
              "Attribution en cours..."
            ) : (
              <>
                <Check className="w-4 h-4" />
                Attribuer le forfait
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
