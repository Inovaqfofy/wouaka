import { useState } from "react";
import { z } from "zod";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Validation schema
const contactSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Le nom ne doit pas dépasser 100 caractères"),
  email: z.string().trim().email("Format d'email invalide").max(255, "L'email ne doit pas dépasser 255 caractères"),
  company: z.string().max(100, "Le nom d'entreprise ne doit pas dépasser 100 caractères").optional(),
  subject: z.string().min(1, "Veuillez sélectionner un sujet"),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(5000, "Le message ne doit pas dépasser 5000 caractères"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const validateField = (field: keyof ContactFormData, value: string) => {
    try {
      contactSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: err.errors[0].message }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate all fields
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          company: formData.company?.trim() || undefined,
          subject: formData.subject,
          message: formData.message.trim(),
        },
      });

      if (error) {
        throw new Error(error.message || "Erreur lors de l'envoi");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        subject: "",
        message: "",
      });

      toast({
        title: "Message envoyé !",
        description: "Nous avons bien reçu votre message et vous répondrons sous 24h.",
      });
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-xl mx-auto card-premium text-center py-12">
              <CardContent>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Message envoyé avec succès !</h2>
                <p className="text-muted-foreground mb-6">
                  Merci de nous avoir contacté. Notre équipe vous répondra dans les plus brefs délais, 
                  généralement sous 24 heures ouvrées.
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  Un email de confirmation a été envoyé à votre adresse.
                </p>
                <Button onClick={() => setSuccess(false)} variant="outline">
                  Envoyer un autre message
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contactez-nous"
        description="Contactez l'équipe Wouaka pour une démo, des questions sur les tarifs ou un partenariat. Réponse sous 24h. Abidjan, Côte d'Ivoire."
        keywords="contact Wouaka, démo scoring crédit, partenariat fintech Afrique"
        canonical="/contact"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-hero text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              <MessageSquare className="w-3 h-3 mr-1" />
              Contact
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              Parlons de votre
              <span className="block text-secondary">projet</span>
            </h1>
            <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour répondre à toutes vos questions et vous accompagner dans vos projets.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="card-premium">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-muted-foreground text-sm mb-2">Pour toute demande</p>
                      <a href="mailto:contact@wouaka-creditscore.com" className="text-secondary hover:underline">
                        contact@wouaka-creditscore.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Téléphone</h3>
                      <p className="text-muted-foreground text-sm mb-2">Lun-Ven, 9h-18h GMT</p>
                      <a href="tel:+2250701238974" className="text-secondary hover:underline">
                        +225 07 01 23 89 74
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Bureau</h3>
                      <p className="text-muted-foreground text-sm">
                        27 BP 148 Abidjan 27<br />
                        Côte d'Ivoire
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Temps de réponse</h3>
                      <p className="opacity-80 text-sm">
                        Nous répondons généralement sous 24h ouvrées.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="card-premium lg:col-span-2">
              <CardHeader>
                <CardTitle>Envoyez-nous un message</CardTitle>
                <CardDescription>
                  Remplissez le formulaire ci-dessous et nous vous recontacterons rapidement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        placeholder="Votre nom"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          validateField('name', e.target.value);
                        }}
                        className={errors.name ? "border-destructive" : ""}
                        disabled={loading}
                        required
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          validateField('email', e.target.value);
                        }}
                        className={errors.email ? "border-destructive" : ""}
                        disabled={loading}
                        required
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Entreprise</Label>
                      <Input
                        id="company"
                        placeholder="Nom de votre entreprise"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => {
                          setFormData({ ...formData, subject: value });
                          setErrors(prev => ({ ...prev, subject: undefined }));
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger className={errors.subject ? "border-destructive" : ""}>
                          <SelectValue placeholder="Sélectionnez un sujet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">Demande de démo</SelectItem>
                          <SelectItem value="pricing">Questions sur les tarifs</SelectItem>
                          <SelectItem value="technical">Support technique</SelectItem>
                          <SelectItem value="partnership">Partenariat</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.subject && (
                        <p className="text-xs text-destructive">{errors.subject}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Décrivez votre projet ou votre question..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        validateField('message', e.target.value);
                      }}
                      className={errors.message ? "border-destructive" : ""}
                      disabled={loading}
                      required
                    />
                    {errors.message && (
                      <p className="text-xs text-destructive">{errors.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.message.length}/5000 caractères
                    </p>
                  </div>

                  <Button type="submit" size="lg" className="w-full md:w-auto" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="h-80 bg-muted rounded-2xl overflow-hidden">
              <iframe
                title="Localisation Wouaka - Abidjan, Côte d'Ivoire"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127065.14489973068!2d-4.0631!3d5.3599!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfc1ea5311959121%3A0x3fe70ddce19221b6!2sAbidjan%2C%20C%C3%B4te%20d'Ivoire!5e0!3m2!1sfr!2sfr!4v1704067200000!5m2!1sfr!2sfr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;