import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Upload
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wizard, WizardContent, WizardFooter } from "@/components/ui/wizard";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { usePublicProduct, formatAmount } from "@/hooks/usePublicMarketplace";
import { usePublicApplications } from "@/hooks/useLoanApplications";
import { PublicDocumentUpload } from "@/components/kyc/PublicDocumentUpload";
import { SEOHead } from "@/components/seo/SEOHead";
import { useWouakaScore } from "@/hooks/useWouakaScore";
import { ScoreSkeletonCard } from "@/components/ui/skeleton-card";

const personalInfoSchema = z.object({
  applicant_name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  applicant_email: z.string().email("Email invalide"),
  applicant_phone: z.string().min(8, "Numéro de téléphone invalide"),
  national_id: z.string().optional(),
});

type PersonalInfoData = z.infer<typeof personalInfoSchema>;

const STEPS = [
  { id: "info", title: "Informations", description: "Vos coordonnées" },
  { id: "kyc", title: "Vérification", description: "Documents KYC" },
  { id: "score", title: "Évaluation", description: "Calcul du score" },
  { id: "result", title: "Résultat", description: "Éligibilité" },
];

const ApplyForLoan = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<{ type: string; url: string; ocrData?: any }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    grade: string;
    isEligible: boolean;
    reason: string;
  } | null>(null);

  const { data: product, isLoading: productLoading } = usePublicProduct(productId);
  const { createApplication, updateApplicationResults } = usePublicApplications();
  const { calculateScore: sdkCalculateScore, isLoading: scoringLoading } = useWouakaScore({ 
    persistToDatabase: false, 
    showToasts: false 
  });

  const form = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      applicant_name: "",
      applicant_email: "",
      applicant_phone: "",
      national_id: "",
    },
  });

  const handlePersonalInfoSubmit = async (data: PersonalInfoData) => {
    if (!product) return;

    try {
      const result = await createApplication.mutateAsync({
        product_id: product.id,
        applicant_name: data.applicant_name,
        applicant_email: data.applicant_email,
        applicant_phone: data.applicant_phone,
        national_id: data.national_id,
      });
      setApplicationId(result.id);
      setCurrentStep(1);
    } catch (error) {
      console.error("Error creating application:", error);
    }
  };

  const handleDocumentUploaded = (type: string, url: string, ocrData?: any) => {
    setUploadedDocuments(prev => [...prev, { type, url, ocrData }]);
  };

  const handleKycComplete = () => {
    if (uploadedDocuments.length === 0) {
      toast({
        title: "Documents requis",
        description: "Veuillez télécharger au moins une pièce d'identité.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
    processScoring();
  };

  const processScoring = async () => {
    if (!applicationId || !product) return;
    
    setIsProcessing(true);

    try {
      // Get identity document URL
      const identityDoc = uploadedDocuments.find(d => 
        d.type === 'national_id' || d.type === 'passport'
      );

      // Call W-Score via SDK
      const scoreResult = await sdkCalculateScore({
        phone_number: form.getValues('applicant_phone'),
        full_name: form.getValues('applicant_name'),
        national_id: form.getValues('national_id'),
      });

      if (!scoreResult) throw new Error('Échec du calcul du score');

      const score = scoreResult.score || 0;
      const grade = scoreResult.grade || 'D';
      const isEligible = score >= product.min_score_required;
      const reason = isEligible 
        ? `Votre score de ${score}/100 dépasse le minimum requis de ${product.min_score_required}.`
        : `Votre score de ${score}/100 est inférieur au minimum requis de ${product.min_score_required}.`;

      // Update application with results
      await updateApplicationResults.mutateAsync({
        id: applicationId,
        score,
        score_grade: grade,
        score_details: scoreResult.factors || {},
        risk_level: scoreResult.risk_category || 'high',
        kyc_status: 'verified',
        kyc_identity_score: 85, // From KYC verification
        kyc_fraud_score: 10,
        identity_document_url: identityDoc?.url,
        additional_documents: uploadedDocuments.filter(d => d.type !== 'national_id' && d.type !== 'passport'),
        is_eligible: isEligible,
        eligibility_reason: reason,
      });

      setResult({
        score,
        grade,
        isEligible,
        reason,
      });

      setCurrentStep(3);
    } catch (error) {
      console.error("Scoring error:", error);
      toast({
        title: "Erreur lors de l'évaluation",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (productLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background py-12">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-2xl font-bold mb-4">Offre introuvable</h1>
            <Button asChild>
              <Link to="/marketplace">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au marketplace
              </Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead 
        title={`Candidature - ${product.name} | Wouaka`}
        description="Complétez votre candidature pour cette offre de financement."
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" asChild>
                <Link to={`/marketplace/${product.id}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'offre
                </Link>
              </Button>
              <Badge variant="secondary">
                {product.name} - {product.provider_name}
              </Badge>
            </div>
          </div>
        </div>

        {/* Wizard */}
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Wizard
            steps={STEPS}
            currentStep={currentStep}
            onStepChange={(step) => {
              // Only allow going back
              if (step < currentStep) {
                setCurrentStep(step);
              }
            }}
          >
            {/* Step 1: Personal Info */}
            {currentStep === 0 && (
              <WizardContent>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Vos informations personnelles
                    </CardTitle>
                    <CardDescription>
                      Ces informations seront utilisées pour traiter votre candidature.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handlePersonalInfoSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="applicant_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom complet *</FormLabel>
                              <FormControl>
                                <Input placeholder="Jean Dupont" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="applicant_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="jean@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="applicant_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de téléphone *</FormLabel>
                              <FormControl>
                                <Input placeholder="+225 XX XX XX XX" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="national_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro CNI / Passeport</FormLabel>
                              <FormControl>
                                <Input placeholder="Optionnel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end pt-4">
                          <Button type="submit" disabled={createApplication.isPending}>
                            {createApplication.isPending && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Continuer
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </WizardContent>
            )}

            {/* Step 2: KYC Documents */}
            {currentStep === 1 && (
              <WizardContent>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Vérification d'identité (KYC)
                    </CardTitle>
                    <CardDescription>
                      Téléchargez vos documents pour vérifier votre identité.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <PublicDocumentUpload
                        documentId="national_id"
                        label="Pièce d'identité"
                        description="CNI, passeport ou carte consulaire en cours de validité"
                        icon={FileText}
                        isUploaded={uploadedDocuments.some(d => d.type === 'national_id')}
                        onUpload={(url, ocrData) => handleDocumentUploaded('national_id', url, ocrData)}
                        partnerId={product.provider_id || 'public'}
                        clientName={form.getValues('applicant_name') || 'applicant'}
                      />
                    </div>

                    {uploadedDocuments.length > 0 && (
                      <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                        <div className="flex items-center gap-2 text-success mb-2">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">{uploadedDocuments.length} document(s) téléchargé(s)</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setCurrentStep(0)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Précédent
                      </Button>
                      <Button 
                        onClick={handleKycComplete}
                        disabled={uploadedDocuments.length === 0}
                      >
                        Continuer vers l'évaluation
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </WizardContent>
            )}

            {/* Step 3: Scoring */}
            {currentStep === 2 && (
              <WizardContent>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Évaluation en cours
                    </CardTitle>
                    <CardDescription>
                      Nous calculons votre score de crédit basé sur des données alternatives.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
                          <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Analyse en cours...</h3>
                      <p className="text-muted-foreground max-w-md">
                        Nous analysons vos données pour calculer votre score de solvabilité. 
                        Cela ne prend que quelques secondes.
                      </p>

                      <div className="mt-8 space-y-3 text-left w-full max-w-sm">
                        <div className="flex items-center gap-3 text-sm">
                          <CheckCircle className="w-5 h-5 text-success" />
                          <span>Documents vérifiés</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          <span>Analyse des données télécom...</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="w-5 h-5 rounded-full border-2 border-muted" />
                          <span>Calcul du score final</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </WizardContent>
            )}

            {/* Step 4: Result */}
            {currentStep === 3 && result && (
              <WizardContent>
                <Card className={result.isEligible ? "border-success" : "border-destructive"}>
                  <CardHeader className="text-center">
                    <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      result.isEligible ? 'bg-success/10' : 'bg-destructive/10'
                    }`}>
                      {result.isEligible ? (
                        <CheckCircle className="w-10 h-10 text-success" />
                      ) : (
                        <XCircle className="w-10 h-10 text-destructive" />
                      )}
                    </div>
                    <CardTitle className="text-2xl">
                      {result.isEligible ? "Félicitations ! Vous êtes éligible" : "Désolé, vous n'êtes pas éligible"}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      {result.reason}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Score Display */}
                    <div className="text-center py-8 bg-muted rounded-xl">
                      <div className="text-sm text-muted-foreground mb-2">Votre score Wouaka</div>
                      <div className="text-6xl font-bold mb-2">{result.score}</div>
                      <Badge variant={result.grade === 'A' || result.grade === 'B' ? 'success' : 'secondary'} className="text-lg px-4 py-1">
                        Grade {result.grade}
                      </Badge>
                    </div>

                    {/* Product Reminder */}
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <h4 className="font-semibold mb-2">Offre sélectionnée</h4>
                      <p className="text-muted-foreground">
                        {product.name} par {product.provider_name}
                      </p>
                      <p className="text-sm mt-1">
                        Montant: {formatAmount(product.min_amount)} - {formatAmount(product.max_amount)}
                      </p>
                    </div>

                    {result.isEligible ? (
                      <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                        <div className="flex items-start gap-3">
                          <Shield className="w-6 h-6 text-success shrink-0" />
                          <div>
                            <h4 className="font-semibold text-success">Candidature transmise</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Votre candidature a été envoyée à {product.provider_name}. 
                              Vous serez contacté sous 24-48h pour la suite du processus.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Votre score actuel ne vous permet pas d'accéder à cette offre. 
                          Voici quelques suggestions pour améliorer votre profil :
                        </p>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                            <span>Maintenez une activité régulière sur vos comptes mobile money</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                            <span>Effectuez des transactions régulières et variées</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                            <span>Conservez un solde positif sur vos comptes</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        asChild
                      >
                        <Link to="/marketplace">
                          Voir d'autres offres
                        </Link>
                      </Button>
                      {result.isEligible && (
                        <Button className="flex-1" asChild>
                          <Link to="/">
                            Retour à l'accueil
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </WizardContent>
            )}
          </Wizard>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ApplyForLoan;
