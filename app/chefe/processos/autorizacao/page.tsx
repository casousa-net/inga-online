"use client";
import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Eye, BadgeCheck, XCircle, FileText, FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-sm font-semibold">
          <BadgeCheck className="w-4 h-4" /> Apenas processos sem assinatura da Direcção
        </span>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-left w-36">Nº Processo</TableHead>
              <TableHead className="text-left w-40">Utente</TableHead>
              <TableHead className="text-left w-40">Subtipo</TableHead>
              <TableHead className="text-left w-32">Data</TableHead>
              <TableHead className="text-left w-40">Taxa Sobre</TableHead>
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
                  <TableCell>{solicitacao.createdAt ? new Date(solicitacao.createdAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>KZ {solicitacao.valorTotalKz?.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0,00'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={solicitacao.status === 'Pendente' ? 'destructive' : 'outline'} 
                      className={solicitacao.status === 'Pendente' ? 'bg-red-100 text-red-700 border-none' : ''}
                    >
                      {solicitacao.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="text-blue-700 border-blue-700 flex items-center gap-1" 
                      title="Ver Processo"
                      onClick={() => router.push(`/chefe/processo/${solicitacao.id}`)}
                    >
                      <Eye className="w-4 h-4" /> Ver Processo
                    </Button>
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
