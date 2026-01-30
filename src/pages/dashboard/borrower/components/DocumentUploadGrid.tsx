import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentType {
  type: string;
  label: string;
  description: string;
  required: boolean;
}

interface DocumentUploadGridProps {
  documentTypes: DocumentType[];
  isUploading: boolean;
  uploadProgress: number;
  selectedDocType: string | null;
  highlightedDocType?: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, docType: string) => void;
  fileInputRefs?: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>;
}

export function DocumentUploadGrid({
  documentTypes,
  isUploading,
  uploadProgress,
  selectedDocType,
  highlightedDocType,
  onFileSelect,
  fileInputRefs: externalRefs,
}: DocumentUploadGridProps) {
  const internalRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRefs = externalRefs || internalRefs;

  return (
    <Card id="upload-grid">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Ajouter des Preuves Documentaires
        </CardTitle>
        <CardDescription>
          Ces documents renforceront votre dossier de certification auprès des partenaires financiers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning banner for document requirements */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
          <p className="text-sm text-warning-foreground">
            <strong>⚠️ Important :</strong> Uploadez de <strong>vraies pièces d'identité</strong> (CNI, passeport, facture) avec du <strong>texte lisible</strong>.
            Les logos, captures d'écran ou images génériques ne seront pas vérifiés automatiquement.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {documentTypes.map((docType) => {
            const isHighlighted = highlightedDocType === docType.type;
            return (
              <div 
                key={docType.type}
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center transition-all",
                  isHighlighted 
                    ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 animate-pulse" 
                    : "hover:border-primary hover:bg-primary/5"
                )}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  ref={(el) => {
                    if (fileInputRefs.current) {
                      fileInputRefs.current[docType.type] = el;
                    }
                  }}
                  onChange={(e) => onFileSelect(e, docType.type)}
                />
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">{docType.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{docType.description}</p>
                {docType.required && (
                  <Badge variant="outline" className="mt-2 text-xs">Recommandé</Badge>
                )}
                
                {isUploading && selectedDocType === docType.type ? (
                  <div className="mt-3 space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      {uploadProgress}%
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant={isHighlighted ? "default" : "ghost"}
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      if (fileInputRefs.current) {
                        fileInputRefs.current[docType.type]?.click();
                      }
                    }}
                    disabled={isUploading}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {isHighlighted ? "Télécharger maintenant" : "Ajouter"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
