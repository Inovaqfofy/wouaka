import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { BorrowerDocument } from "@/hooks/useBorrowerData";

interface DocumentViewDialogProps {
  document: BorrowerDocument | null;
  onClose: () => void;
}

export function DocumentViewDialog({ document, onClose }: DocumentViewDialogProps) {
  const isPdfDocument = (url: string) => {
    return url.toLowerCase().endsWith('.pdf');
  };

  return (
    <Dialog open={!!document} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {document?.file_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {document?.file_url && (
            isPdfDocument(document.file_url) ? (
              <iframe 
                src={document.file_url} 
                className="w-full h-[500px] rounded-lg border"
                title={document.file_name}
              />
            ) : (
              <img 
                src={document.file_url} 
                alt={document.file_name}
                className="w-full max-h-[500px] object-contain rounded-lg border"
              />
            )
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Type: {document?.document_type}</span>
              {document?.created_at && (
                <span>• Uploadé le {format(new Date(document.created_at), 'dd MMM yyyy', { locale: fr })}</span>
              )}
            </div>
            {document?.ocr_confidence && (
              <Badge variant="outline">
                OCR Confiance: {Math.round(document.ocr_confidence)}%
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
