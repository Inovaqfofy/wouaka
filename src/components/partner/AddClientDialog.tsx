import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useCreateCustomerProfile, CreateCustomerProfileInput } from "@/hooks/useCustomerProfiles";

interface AddClientDialogProps {
  trigger?: React.ReactNode;
}

const COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Sénégal" },
  { code: "ML", name: "Mali" },
  { code: "BF", name: "Burkina Faso" },
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Bénin" },
  { code: "NE", name: "Niger" },
  { code: "GW", name: "Guinée-Bissau" },
];

export function AddClientDialog({ trigger }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const createClient = useCreateCustomerProfile();

  const [formData, setFormData] = useState<CreateCustomerProfileInput>({
    externalReference: "",
    fullName: "",
    phoneNumber: "",
    nationalId: "",
    email: "",
    city: "",
    country: "CI",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.externalReference.trim()) {
      return;
    }

    createClient.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          externalReference: "",
          fullName: "",
          phoneNumber: "",
          nationalId: "",
          email: "",
          city: "",
          country: "CI",
        });
      },
    });
  };

  const handleChange = (field: keyof CreateCustomerProfileInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
          <DialogDescription>
            Créez un profil client pour commencer à évaluer sa solvabilité.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="externalReference">
                Référence externe <span className="text-destructive">*</span>
              </Label>
              <Input
                id="externalReference"
                placeholder="ID unique dans votre système (ex: CLI-2025-001)"
                value={formData.externalReference}
                onChange={handleChange("externalReference")}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  placeholder="Jean Kouassi"
                  value={formData.fullName}
                  onChange={handleChange("fullName")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Téléphone</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+225 07 00 00 00 00"
                  value={formData.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nationalId">N° Pièce d'identité</Label>
                <Input
                  id="nationalId"
                  placeholder="CI0012345678"
                  value={formData.nationalId}
                  onChange={handleChange("nationalId")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@email.com"
                  value={formData.email}
                  onChange={handleChange("email")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  placeholder="Abidjan"
                  value={formData.city}
                  onChange={handleChange("city")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Pays</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, country: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createClient.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le client
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
