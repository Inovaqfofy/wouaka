import React, { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Award, FileCheck } from 'lucide-react';
import { ComplianceCertificateViewer } from '@/components/compliance/ComplianceCertificateViewer';
import { useComplianceCertificate } from '@/hooks/useComplianceCertificate';

export default function AdminComplianceCertificate() {
  const { certificate, isLoading, isVerified, generateCertificate } = useComplianceCertificate();

  useEffect(() => {
    // Generate certificate on mount
    generateCertificate();
  }, []);

  return (
    <DashboardLayout role="admin" title="Certificat de Conformité">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Certificat de Conformité Technique
            </h1>
            <p className="text-muted-foreground mt-1">
              Rapport de robustesse et conformité pour partenaires bancaires et investisseurs
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {certificate && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Score Global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{certificate.overall_compliance_score}%</div>
                <p className="text-xs text-muted-foreground">
                  Grade: {certificate.compliance_grade}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Indice Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{certificate.security_index.score}%</div>
                <p className="text-xs text-muted-foreground">
                  RLS: {certificate.security_index.components.rls_strict.tables_protected} tables
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Entrées Sanctions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{certificate.aml_audit.total_entries}</div>
                <p className="text-xs text-muted-foreground">
                  {certificate.aml_audit.sources_synced.filter(s => s.status === 'active').length}/4 sources actives
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Modèles Souverains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{certificate.sovereignty_proof.local_models.length}</div>
                <p className="text-xs text-muted-foreground">
                  {certificate.sovereignty_proof.no_external_ai_calls ? 'Aucun appel IA externe' : 'Appels externes'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Certificate Viewer */}
        {!certificate && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Générer un Certificat
              </CardTitle>
              <CardDescription>
                Créez un certificat de conformité technique pour présentation aux partenaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => generateCertificate()} disabled={isLoading}>
                <FileCheck className="h-4 w-4 mr-2" />
                Générer le Certificat
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Génération du certificat en cours...</p>
            </CardContent>
          </Card>
        )}

        {certificate && !isLoading && (
          <ComplianceCertificateViewer
            certificate={certificate}
            isVerified={isVerified}
            onRefresh={() => generateCertificate()}
            isLoading={isLoading}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
