"use client";
import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Eye, BadgeCheck, XCircle, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Função para calcular a taxa baseada no valor
function calcularTaxa(valor: number): number {
  if (valor <= 6226000) return 0.006;
  if (valor <= 25000000) return 0.004;
  if (valor <= 62480000) return 0.003;
  if (valor <= 249040000) return 0.002;
  return 0.0018;
}

// Função para calcular o valor final com a taxa e aplicar o mínimo
function calcularValorFinal(valor: number): number {
  const taxa = calcularTaxa(valor);
  let totalCobrar = valor * taxa;
  
  if (totalCobrar < 2000) {
    totalCobrar = 2000;
  }
  
  return totalCobrar;
}

type Solicitacao = {
  id: number;
  tipo: string;
  status: string;
  valorTotalKz: number;
  createdAt: string;
  validadoPorTecnico: boolean;
  validadoPorChefe: boolean;
  rupePago: boolean;
  rupeValidado: boolean;
  utente: {
    id: number;
    nome: string;
    nif: string;
  };
  moeda: {
    nome: string;
  };
};



export default function ChefeAutorizacao() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        const response = await fetch('/api/solicitacoes/chefe');
        if (!response.ok) throw new Error('Erro ao carregar solicitações');
        const data = await response.json();
        setSolicitacoes(data);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitacoes();
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col gap-6 p-0">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <FileText className="text-lime-700" size={28} /> Autorizações Pendentes
        </h1>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-sm font-semibold">
            <BadgeCheck className="w-4 h-4" /> Apenas processos sem assinatura da Direcção
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
            <Loader2 className="w-4 h-4" /> Ordem de chegada (FIFO)
          </span>
        </div>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-left w-36">Nº Processo</TableHead>
              <TableHead className="text-left w-40">Utente</TableHead>
              <TableHead className="text-left w-40">Subtipo</TableHead>
              <TableHead className="text-left w-32">Data</TableHead>
              <TableHead className="text-left w-40">Valor</TableHead>
              <TableHead className="text-left w-44">Estado</TableHead>
              <TableHead className="text-left w-56">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando processos...</TableCell>
              </TableRow>
            ) : solicitacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo de autorização pendente.</TableCell>
              </TableRow>
            ) : (
              solicitacoes.map((solicitacao: Solicitacao) => (
                <TableRow key={solicitacao.id} className="hover:bg-muted/50">
                  <TableCell className="font-semibold text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-lime-700" />
                    PR-{solicitacao.id}
                  </TableCell>
                  <TableCell>{solicitacao.utente.nome}</TableCell>
                  <TableCell>Autorização</TableCell>
                  <TableCell>{solicitacao.createdAt ? new Date(solicitacao.createdAt).toLocaleString('pt-BR') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{calcularValorFinal(solicitacao.valorTotalKz).toLocaleString('pt-AO')} Kz</span>
                      <span className="text-xs text-gray-500">
                        Taxa: {(calcularTaxa(solicitacao.valorTotalKz) * 100).toFixed(2)}%
                        {calcularValorFinal(solicitacao.valorTotalKz) === 2000 && (
                          <span className="ml-1 text-amber-600">(mín.)</span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={solicitacao.status === 'Pendente' ? 'destructive' : 'outline'} 
                      className={solicitacao.status === 'Pendente' ? 'bg-red-100 text-red-700 border-none' : ''}
                    >
                      {solicitacao.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {/* Ocultar o botão "Ver Processo" para processos com estado "Aprovado" */}
                    {solicitacao.status !== 'Aprovado' && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="text-blue-700 border-blue-700 flex items-center gap-1" 
                        title="Ver Processo"
                        onClick={() => router.push(`/chefe/processo/${solicitacao.id}`)}
                      >
                        <Eye className="w-4 h-4" /> Ver Processo
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
