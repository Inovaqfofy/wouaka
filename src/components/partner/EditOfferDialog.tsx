import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Loader2, Save } from "lucide-react";
import { usePartnerOffers, OFFER_CATEGORIES, PartnerOffer } from "@/hooks/usePartnerOffers";

interface EditOfferDialogProps {
  offer: PartnerOffer;
  trigger?: React.ReactNode;
}

export function EditOfferDialog({ offer, trigger }: EditOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const { updateOffer } = usePartnerOffers();

  const [formData, setFormData] = useState({
    name: offer.name,
    description: offer.description || "",
    category: offer.category,
    interest_rate: offer.interest_rate,
    min_amount: offer.min_amount,
    max_amount: offer.max_amount,
    duration_min_months: offer.duration_min_months,
    duration_max_months: offer.duration_max_months,
    min_score_required: offer.min_score_required,
  });

  const [featuresText, setFeaturesText] = useState(offer.features?.join("\n") || "");
  const [requirementsText, setRequirementsText] = useState(offer.requirements?.join("\n") || "");

  useEffect(() => {
    if (open) {
      setFormData({
        name: offer.name,
        description: offer.description || "",
        category: offer.category,
        interest_rate: offer.interest_rate,
        min_amount: offer.min_amount,
        max_amount: offer.max_amount,
        duration_min_months: offer.duration_min_months,
        duration_max_months: offer.duration_max_months,
        min_score_required: offer.min_score_required,
      });
      setFeaturesText(offer.features?.join("\n") || "");
      setRequirementsText(offer.requirements?.join("\n") || "");
    }
  }, [open, offer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    updateOffer.mutate({
      id: offer.id,
      ...formData,
      features: featuresText.split("\n").filter(f => f.trim()),
      requirements: requirementsText.split("\n").filter(r => r.trim()),
    }, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  const handleNumberChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value ? parseFloat(e.target.value) : null;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'offre</DialogTitle>
          <DialogDescription>
            Modifiez les caractéristiques de votre offre de financement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Nom et catégorie */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">
                  Nom de l'offre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Catégorie</Label>
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Montants */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-min_amount">Montant minimum (FCFA)</Label>
                <Input
                  id="edit-min_amount"
                  type="number"
                  value={formData.min_amount || ""}
                  onChange={handleNumberChange("min_amount")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-max_amount">Montant maximum (FCFA)</Label>
                <Input
                  id="edit-max_amount"
                  type="number"
                  value={formData.max_amount || ""}
                  onChange={handleNumberChange("max_amount")}
                />
              </div>
            </div>

            {/* Taux et durées */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-interest_rate">Taux (%)</Label>
                <Input
                  id="edit-interest_rate"
                  type="number"
                  step="0.1"
                  value={formData.interest_rate || ""}
                  onChange={handleNumberChange("interest_rate")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration_min">Durée min (mois)</Label>
                <Input
                  id="edit-duration_min"
                  type="number"
                  value={formData.duration_min_months || ""}
                  onChange={handleNumberChange("duration_min_months")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration_max">Durée max (mois)</Label>
                <Input
                  id="edit-duration_max"
                  type="number"
                  value={formData.duration_max_months || ""}
                  onChange={handleNumberChange("duration_max_months")}
                />
              </div>
            </div>

            {/* Score minimum */}
            <div className="grid gap-2">
              <Label htmlFor="edit-min_score">Score minimum requis</Label>
              <Input
                id="edit-min_score"
                type="number"
                min="0"
                max="100"
                value={formData.min_score_required}
                onChange={(e) => setFormData(prev => ({ ...prev, min_score_required: parseInt(e.target.value) || 50 }))}
              />
            </div>

            {/* Avantages */}
            <div className="grid gap-2">
              <Label htmlFor="edit-features">Avantages (un par ligne)</Label>
              <Textarea
                id="edit-features"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={3}
              />
            </div>

            {/* Conditions */}
            <div className="grid gap-2">
              <Label htmlFor="edit-requirements">Conditions requises (une par ligne)</Label>
              <Textarea
                id="edit-requirements"
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
              disabled={updateOffer.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updateOffer.isPending}>
              {updateOffer.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
