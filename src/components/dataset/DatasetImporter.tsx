import { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDatasetImport } from '@/hooks/useDatasetImport';
import type { Dataset } from '@/stores/useDatasetStore';

export function DatasetImporter() {
  const {
    datasets,
    isUploading,
    uploadProgress,
    isProcessing,
    processingProgress,
    fetchDatasets,
    uploadDataset,
    processDataset,
    deleteDataset,
  } = useDatasetImport();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!name) {
        setName(file.name.replace(/\.(csv|xlsx?)$/i, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !name) return;

    const dataset = await uploadDataset(selectedFile, name, description);
    if (dataset) {
      setIsDialogOpen(false);
      setSelectedFile(null);
      setName('');
      setDescription('');
    }
  };

  const getStatusBadge = (status: Dataset['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-500">En cours</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Terminé</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import CSV/Excel</h2>
          <p className="text-muted-foreground">
            Importez vos données et calculez des scores en masse
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Importer un fichier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Importer un dataset</DialogTitle>
              <DialogDescription>
                Téléchargez un fichier CSV contenant vos données à scorer
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* File upload zone */}
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors hover:border-primary
                  ${selectedFile ? 'border-green-500 bg-green-50' : 'border-muted'}
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Cliquez pour sélectionner un fichier</p>
                    <p className="text-sm text-muted-foreground">
                      Formats acceptés: CSV, Excel (.xlsx, .xls)
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom du dataset *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mon dataset"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description optionnelle..."
                  rows={3}
                />
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Import en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || !name || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Import...
                  </>
                ) : (
                  'Importer'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dataset list */}
      <div className="grid gap-4">
        {datasets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucun dataset</h3>
              <p className="text-muted-foreground text-sm">
                Importez votre premier fichier CSV pour commencer
              </p>
            </CardContent>
          </Card>
        ) : (
          datasets.map((dataset) => (
            <Card key={dataset.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{dataset.name}</CardTitle>
                    {dataset.description && (
                      <CardDescription>{dataset.description}</CardDescription>
                    )}
                  </div>
                  {getStatusBadge(dataset.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>{dataset.row_count} lignes</span>
                    <span>{dataset.column_count} colonnes</span>
                    <span>{dataset.scores_calculated} scores calculés</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {dataset.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => processDataset(dataset.id)}
                        disabled={isProcessing}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Calculer les scores
                      </Button>
                    )}
                    
                    {dataset.status === 'processing' && (
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <Progress value={dataset.processing_progress} className="flex-1" />
                        <span className="text-sm">{dataset.processing_progress}%</span>
                      </div>
                    )}

                    {dataset.status === 'completed' && (
                      <Button size="sm" variant="outline">
                        <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                        Voir les résultats
                      </Button>
                    )}

                    {dataset.status === 'error' && (
                      <div className="flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {dataset.error_message || 'Erreur inconnue'}
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteDataset(dataset.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
