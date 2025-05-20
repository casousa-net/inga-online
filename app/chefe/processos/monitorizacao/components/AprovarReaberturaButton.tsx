import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface AprovarReaberturaButtonProps {
  periodoId: number;
  onSuccess?: () => void;
}

export default function AprovarReaberturaButton({ periodoId, onSuccess }: AprovarReaberturaButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rupeReferencia, setRupeReferencia] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAprovarReabertura = async () => {
    if (!rupeReferencia) {
      toast({
        title: "Erro",
        description: "Informe o número do RUPE para aprovar a reabertura",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/monitorizacao/periodos/reabertura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodoId,
          rupeReferencia
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aprovar reabertura do período');
      }

      toast({
        title: "Sucesso",
        description: "Reabertura do período aprovada com sucesso"
      });
      
      setIsDialogOpen(false);
      setRupeReferencia('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao aprovar reabertura:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a aprovação da reabertura",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="bg-amber-50 text-amber-800 hover:bg-amber-100"
        onClick={() => setIsDialogOpen(true)}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Aprovar Reabertura
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Reabertura de Período</DialogTitle>
            <DialogDescription>
              Informe o número do RUPE para aprovar a reabertura do período.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rupeReabertura">Número do RUPE</Label>
              <Input
                id="rupeReabertura"
                type="text"
                placeholder="Informe o número do RUPE"
                value={rupeReferencia}
                onChange={(e) => setRupeReferencia(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleAprovarReabertura}
              disabled={!rupeReferencia || isProcessing}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Aprovar Reabertura
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
