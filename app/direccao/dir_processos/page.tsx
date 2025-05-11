"use client";

import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Eye, FileText, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

// Tipo para as solicitações da API
type Solicitacao = {
  id: number;
  tipo: string;
  status: string;
  createdAt: string;
  valorTotalKz: number;
  rupeReferencia?: string;
  rupePago: boolean;
  rupeValidado: boolean;
  validadoPorTecnico: boolean;
  validadoPorChefe: boolean;
  aprovadoPorDirecao: boolean;
  utente: {
    id: number;
    nome: string;
    nif: string;
  };
  moeda?: {
    nome: string;
  };
};

export default function ProcessosPage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/solicitacoes/direccao');
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

  // Extrair tipos únicos das solicitações
  const tipos = Array.from(new Set(solicitacoes.map(p => p.tipo)));
  
  // Estados possíveis para filtro
  const estados = ['Pagamento_Confirmado', 'Aprovado'];

  const processosFiltrados = solicitacoes.filter(proc => {
    const tipoOk = !tipoFiltro || tipoFiltro === "all" || proc.tipo === tipoFiltro;
    const estadoOk = !estadoFiltro || estadoFiltro === "all" || proc.status === estadoFiltro;
    return tipoOk && estadoOk;
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Processos para Assinatura da Direcção</h1>
        <div className="flex gap-2">
          <Select value={tipoFiltro || "all"} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos os Tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {tipos.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={estadoFiltro || "all"} onValueChange={setEstadoFiltro}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todos os Estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {estados.map(estado => (
                <SelectItem key={estado} value={estado}>{estado}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md border border-base-200 p-6">
        <Table className="w-full rounded-xl shadow-md bg-white border border-base-200">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-left">Nº Processo</TableHead>
              <TableHead className="text-left">Utente</TableHead>
              <TableHead className="text-left">Tipo</TableHead>
              <TableHead className="text-left">Data</TableHead>
              <TableHead className="text-left">Valor</TableHead>
              <TableHead className="text-left">Estado</TableHead>
              <TableHead className="text-left">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lime-500"></div>
                  </div>
                  <p className="mt-2">Carregando processos...</p>
                </TableCell>
              </TableRow>
            ) : processosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo encontrado com os filtros selecionados.</TableCell>
              </TableRow>
            ) : (
              processosFiltrados.map(proc => (
                <TableRow key={proc.id} className="hover:bg-muted/50">
                  <TableCell className="font-semibold text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-lime-700" />
                    PA-{proc.id.toString().padStart(4, '0')}
                  </TableCell>
                  <TableCell>{proc.utente.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {proc.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(proc.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{proc.valorTotalKz.toLocaleString('pt-AO')} KZ</TableCell>
                  <TableCell>
                    {proc.status === 'Pagamento_Confirmado' ? (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1">
                        <Clock size={12} /> Pendente Assinatura
                      </Badge>
                    ) : proc.status === 'Aprovado' ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                        <CheckCircle size={12} /> Aprovado
                      </Badge>
                    ) : (
                      <Badge>
                        {proc.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="text-blue-700 border-blue-700 flex items-center gap-1" 
                      title="Ver Detalhes"
                      onClick={() => router.push(`/direccao/dir_processos/${proc.id}`)}
                    >
                      <Eye className="w-4 h-4" /> Ver Detalhes
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
