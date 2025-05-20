'use client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCw, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ReaberturaModalsProps {
  isReaberturaModalOpen: boolean;
  setIsReaberturaModalOpen: (open: boolean) => void;
  motivoReabertura: string;
  setMotivoReabertura: (motivo: string) => void;
  handleReabertura: () => Promise<void>;
  processandoReabertura: boolean;
  isRupeModalOpen: boolean;
  setIsRupeModalOpen: (open: boolean) => void;
  setIsRupeConfirmationModalOpen: (open: boolean) => void;
  isRupeConfirmationModalOpen: boolean;
  handleConfirmarPagamentoRupe: () => Promise<void>;
}

export function ReaberturaModals({
  isReaberturaModalOpen,
  setIsReaberturaModalOpen,
  motivoReabertura,
  setMotivoReabertura,
  handleReabertura,
  processandoReabertura,
  isRupeModalOpen,
  setIsRupeModalOpen,
  setIsRupeConfirmationModalOpen,
  isRupeConfirmationModalOpen,
  handleConfirmarPagamentoRupe
}: ReaberturaModalsProps) {
  return (
    <>
      <Dialog 
        open={isReaberturaModalOpen} 
        onOpenChange={setIsReaberturaModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Reabertura de Período</DialogTitle>
            <DialogDescription>
              Informe o motivo pelo qual você necessita reabrir este período para envio de relatório.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="motivo-reabertura" className="text-left">
                Motivo da Reabertura
              </Label>
              <Textarea
                id="motivo-reabertura"
                value={motivoReabertura}
                onChange={(e) => setMotivoReabertura(e.target.value)}
                placeholder="Descreva o motivo pelo qual você necessita reabrir este período"
                className="resize-none"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReaberturaModalOpen(false)}
              disabled={processandoReabertura}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleReabertura}
              disabled={!motivoReabertura.trim() || processandoReabertura}
            >
              {processandoReabertura ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Solicitar Reabertura'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isRupeModalOpen} 
        onOpenChange={setIsRupeModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento de RUPE Necessário</DialogTitle>
            <DialogDescription>
              Para reabrir este período, é necessário efetuar o pagamento de um novo RUPE.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700">
              Após efetuar o pagamento, clique no botão abaixo para confirmar.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsRupeConfirmationModalOpen(true)}
              disabled={processandoReabertura}
            >
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isRupeConfirmationModalOpen} 
        onOpenChange={setIsRupeConfirmationModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Você confirma que já efetuou o pagamento do RUPE para reabertura deste período?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRupeConfirmationModalOpen(false)}
              disabled={processandoReabertura}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmarPagamentoRupe}
              disabled={processandoReabertura}
            >
              {processandoReabertura ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
