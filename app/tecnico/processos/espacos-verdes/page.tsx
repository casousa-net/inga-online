"use client";
import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, BadgeCheck, XCircle, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Solicitacao = {
  id: number;
  tipo: string;
  status: string;
  valorTotalKz: number;
  createdAt: string;
  validadoPorTecnico: boolean;
  utente: {
    id: number;
    nome: string;
    nif: string;
  };
  moeda: {
    nome: string;
  };
};

export default function TecnicoEspacosVerdes() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        const response = await fetch('/api/solicitacoes/tecnico?departamento=espacos-verdes');
        if (!response.ok) throw new Error('Erro ao carregar solicitações');
        const data = await response.json();
        console.log('Dados recebidos da API:', data);
        
        // Verificar se a resposta está no novo formato (com solicitacoes e diagnostico)
        if (data.solicitacoes) {
          console.log('Quantidade de processos:', data.solicitacoes.length);
          setSolicitacoes(data.solicitacoes);
        } else {
          // Manter compatibilidade com o formato antigo
          console.log('Quantidade de processos:', data.length);
          setSolicitacoes(data);
        }
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
          <FileText className="text-lime-700" size={28} /> Processos de Espaços Verdes
        </h1>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-sm font-semibold">
          <BadgeCheck className="w-4 h-4" /> Processos do Técnico
        </span>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-left w-36">Nº Processo</TableHead>
              <TableHead className="text-left w-40">Utente</TableHead>
              <TableHead className="text-left w-40">Tipo</TableHead>
              <TableHead className="text-left w-32">Data</TableHead>
              <TableHead className="text-left w-40">Valor</TableHead>
              <TableHead className="text-left w-44">Estado</TableHead>
              <TableHead className="text-left w-64">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span>Carregando processos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : solicitacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-gray-400" />
                    <span className="text-gray-500">Nenhum processo encontrado</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              solicitacoes.map((solicitacao) => (
                <TableRow key={solicitacao.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">PA-{String(solicitacao.id).padStart(6, '0')}</TableCell>
                  <TableCell>{solicitacao.utente.nome}</TableCell>
                  <TableCell>{solicitacao.tipo}</TableCell>
                  <TableCell>
                    {new Date(solicitacao.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'AOA'
                    }).format(solicitacao.valorTotalKz)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        solicitacao.status === 'Pendente' 
                          ? 'bg-amber-100 text-amber-800 border-amber-200' 
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }
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
                      onClick={() => router.push(`/tecnico/processo/${solicitacao.id}`)}
                    >
                      <Eye className="w-4 h-4" /> Ver Processo
                    </Button>
                    {!solicitacao.validadoPorTecnico && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1" 
                        title="Validar"
                        onClick={() => router.push(`/tecnico/solicitacoes?id=${solicitacao.id}`)}
                      >
                        <BadgeCheck className="w-4 h-4" /> Validar
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
