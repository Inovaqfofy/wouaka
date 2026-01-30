import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Eye, Trash2, Share2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { BorrowerDocument } from "@/hooks/useBorrowerData";

interface DocumentsListProps {
  documents: BorrowerDocument[] | undefined;
  isLoading: boolean;
  hasVerifiedDocs: boolean;
  hasActiveCertificate: boolean;
  onView: (doc: BorrowerDocument) => void;
  onDelete: (docId: string) => void;
}

export function DocumentsList({
  documents,
  isLoading,
  hasVerifiedDocs,
  hasActiveCertificate,
  onView,
  onDelete,
}: DocumentsListProps) {
  const getStatusBadge = (doc: BorrowerDocument) => {
    const docStatus = doc.status || 'pending';
    const confidence = doc.ocr_confidence;
    const ocrData = doc.ocr_data;
    
    // Show verified if status is verified OR confidence >= 50
    if (docStatus === 'verified' || (confidence && confidence >= 50)) {
      return (
        <Badge className="bg-primary/20 text-primary border-primary/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Vérifié {confidence ? `(${confidence}%)` : ''}
        </Badge>
      );
    }
    
    // Show rejected
    if (docStatus === 'rejected') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
    }
    
    // Check if OCR failed (insufficient text or PDF)
    if (ocrData?.insufficient_text || ocrData?.reason === 'ocr_no_text') {
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          <XCircle className="w-3 h-3 mr-1" />
          OCR échoué
        </Badge>
      );
    }
    
    // Check if PDF (manual verification needed)
    if (ocrData?.type === 'pdf' || ocrData?.reason === 'pdf_not_ocr_supported') {
      return (
        <Badge variant="outline" className="bg-accent text-accent-foreground border-accent">
          <Clock className="w-3 h-3 mr-1" />
          Vérif. manuelle
        </Badge>
      );
    }
    
    // Show pending with confidence if available
    if (docStatus === 'pending') {
      // If confidence is very low (1-49), OCR ran but found little
      if (confidence && confidence > 0 && confidence < 50) {
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <Clock className="w-3 h-3 mr-1" />
            Confiance faible ({confidence}%)
          </Badge>
        );
      }
      
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          En attente
        </Badge>
      );
    }
    
    return <Badge variant="outline">{docStatus}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Documents Soumis</CardTitle>
            <CardDescription>
              Liste de vos documents et leur statut de vérification
            </CardDescription>
          </div>
          {hasVerifiedDocs && hasActiveCertificate && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/borrower/score">
                <Share2 className="w-4 h-4 mr-2" />
                Partager mon certificat
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun document soumis</h3>
            <p className="text-muted-foreground mb-4">
              Ajoutez des documents pour renforcer votre dossier de certification
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.document_type} • {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(doc)}
                  <Button variant="ghost" size="icon" onClick={() => onView(doc)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
