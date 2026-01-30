import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { usePartnerOffers, OFFER_CATEGORIES, CreateOfferData } from "@/hooks/usePartnerOffers";

interface AddOfferDialogProps {
  trigger?: React.ReactNode;
}

export function AddOfferDialog({ trigger }: AddOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const { createOffer } = usePartnerOffers();

  const [formData, setFormData] = useState<CreateOfferData>({
    name: "",
    description: "",
    category: "credit",
    interest_rate: undefined,
    min_amount: undefined,
    max_amount: undefined,
    duration_min_months: undefined,
    duration_max_months: undefined,
    min_score_required: 50,
    countries: ["CI"],
    features: [],
    requirements: [],
  });

  const [featuresText, setFeaturesText] = useState("");
  const [requirementsText, setRequirementsText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category) {
      return;
    }

    const offerToCreate: CreateOfferData = {
      ...formData,
      features: featuresText.split("\n").filter(f => f.trim()),
      requirements: requirementsText.split("\n").filter(r => r.trim()),
    };

    createOffer.mutate(offerToCreate, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          name: "",
          description: "",
          category: "credit",
          interest_rate: undefined,
          min_amount: undefined,
          max_amount: undefined,
          duration_min_months: undefined,
          duration_max_months: undefined,
          min_score_required: 50,
          countries: ["CI"],
          features: [],
          requirements: [],
        });
        setFeaturesText("");
        setRequirementsText("");
      },
    });
  };

  const handleNumberChange = (field: keyof CreateOfferData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value ? parseFloat(e.target.value) : undefined;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Offre
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle offre</DialogTitle>
          <DialogDescription>
            Définissez les caractéristiques de votre offre de financement. Elle sera créée en brouillon.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Nom et catégorie */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Nom de l'offre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Crédit PME Express"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">
                  Catégorie <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFER_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre offre de financement..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Montants */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min_amount">Montant minimum (FCFA)</Label>
                <Input
                  id="min_amount"
                  type="number"
                  placeholder="100000"
                  value={formData.min_amount || ""}
                  onChange={handleNumberChange("min_amount")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_amount">Montant maximum (FCFA)</Label>
                <Input
                  id="max_amount"
                  type="number"
                  placeholder="10000000"
                  value={formData.max_amount || ""}
                  onChange={handleNumberChange("max_amount")}
                />
              </div>
            </div>

            {/* Taux et durées */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interest_rate">Taux d'intérêt (%)</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.1"
                  placeholder="12.5"
                  value={formData.interest_rate || ""}
                  onChange={handleNumberChange("interest_rate")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration_min">Durée min (mois)</Label>
                <Input
                  id="duration_min"
                  type="number"
                  placeholder="3"
                  value={formData.duration_min_months || ""}
                  onChange={handleNumberChange("duration_min_months")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration_max">Durée max (mois)</Label>
                <Input
                  id="duration_max"
                  type="number"
                  placeholder="24"
                  value={formData.duration_max_months || ""}
                  onChange={handleNumberChange("duration_max_months")}
                />
              </div>
            </div>

            {/* Score minimum */}
            <div className="grid gap-2">
              <Label htmlFor="min_score">Score Wouaka minimum requis</Label>
              <Input
                id="min_score"
                type="number"
                min="0"
                max="100"
                placeholder="50"
                value={formData.min_score_required}
                onChange={(e) => setFormData(prev => ({ ...prev, min_score_required: parseInt(e.target.value) || 50 }))}
              />
              <p className="text-xs text-muted-foreground">
                Les emprunteurs doivent avoir un score supérieur ou égal pour postuler.
              </p>
            </div>

            {/* Avantages */}
            <div className="grid gap-2">
              <Label htmlFor="features">Avantages (un par ligne)</Label>
              <Textarea
                id="features"
                placeholder="Déblocage rapide en 48h&#10;Pas de frais de dossier&#10;Taux préférentiel"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={3}
              />
            </div>

            {/* Conditions */}
            <div className="grid gap-2">
              <Label htmlFor="requirements">Conditions requises (une par ligne)</Label>
              <Textarea
                id="requirements"
                placeholder="Pièce d'identité valide&#10;Justificatif de revenus&#10;RIB bancaire"
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createOffer.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createOffer.isPending}>
              {createOffer.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer l'offre
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
