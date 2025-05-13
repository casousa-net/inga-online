"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table";
import { CheckCircle, XCircle, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos
interface Utente {
  id: number;
  nome: string;
  nif: string;
  email: string;
}

interface Configuracao {
  id: number;
  utenteId: number;
  tipoPeriodo: "ANUAL" | "SEMESTRAL" | "TRIMESTRAL";
  dataInicio: string;
  utente: Utente;
}

interface Periodo {
  id: number;
  configuracaoId: number;
  numeroPeriodo: number;
  dataInicio: string;
  dataFim: string;
  estado: "ABERTO" | "FECHADO" | "AGUARDANDO_REAVALIACAO" | "REABERTURA_SOLICITADA";
  configuracao: Configuracao;
}

export default function SolicitacoesReaberturaPage() {
  const [solicitacoes, setSolicitacoes] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processando, setProcessando] = useState<number | null>(null);

  useEffect(() => {
    buscarSolicitacoes();
  }, []);

  const buscarSolicitacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/periodos-monitorizacao/reabertura");
      
      if (!response.ok) {
        throw new Error("Erro ao buscar solicitações");
      }
      
      const data = await response.json();
      setSolicitacoes(data);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      alert("Erro ao buscar solicitações. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async (periodoId: number) => {
    try {
      setProcessando(periodoId);
      const response = await fetch("/api/periodos-monitorizacao/reabertura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          periodoId,
          acao: "aprovar",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao aprovar solicitação");
      }
      
      // Atualizar a lista de solicitações
      await buscarSolicitacoes();
      alert("Solicitação aprovada com sucesso!");
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error);
      alert("Erro ao aprovar solicitação. Tente novamente.");
    } finally {
      setProcessando(null);
    }
  };

  const handleRejeitar = async (periodoId: number) => {
    try {
      setProcessando(periodoId);
      const response = await fetch("/api/periodos-monitorizacao/reabertura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          periodoId,
          acao: "rejeitar",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao rejeitar solicitação");
      }
      
      // Atualizar a lista de solicitações
      await buscarSolicitacoes();
      alert("Solicitação rejeitada com sucesso!");
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      alert("Erro ao rejeitar solicitação. Tente novamente.");
    } finally {
      setProcessando(null);
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getTipoPeriodoFormatado = (tipo: string) => {
    switch (tipo) {
      case "ANUAL":
        return "Anual";
      case "SEMESTRAL":
        return "Semestral";
      case "TRIMESTRAL":
        return "Trimestral";
      default:
        return tipo;
    }
  };

  const filteredSolicitacoes = solicitacoes.filter(
    (solicitacao) =>
      solicitacao.configuracao.utente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitacao.configuracao.utente.nif.includes(searchTerm) ||
      solicitacao.configuracao.utente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lime-700 font-semibold">Solicitações de Reabertura</span>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Solicitações de Reabertura</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar por Nome, NIF ou Email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={buscarSolicitacoes}
          className="border-lime-600 text-lime-600 hover:bg-lime-50"
        >
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-700 mx-auto mb-4"></div>
            <p className="text-lime-700 font-medium">Carregando solicitações...</p>
          </div>
        </div>
      ) : filteredSolicitacoes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma solicitação encontrada</h3>
          <p className="text-gray-600">
            Não há solicitações de reabertura de períodos pendentes no momento.
          </p>
        </div>
      ) : (
        <Table className="rounded-xl shadow-md bg-white border border-base-200">
          <TableHeader>
            <TableRow>
              <TableHead>Utente</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Tipo de Período</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Data de Início</TableHead>
              <TableHead>Data de Fim</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSolicitacoes.map((solicitacao) => (
              <TableRow key={solicitacao.id} className="hover:bg-base-100 transition">
                <TableCell className="font-medium">{solicitacao.configuracao.utente.nome}</TableCell>
                <TableCell>{solicitacao.configuracao.utente.nif}</TableCell>
                <TableCell>
                  <Badge className="bg-lime-100 text-lime-800 border-lime-300">
                    {getTipoPeriodoFormatado(solicitacao.configuracao.tipoPeriodo)}
                  </Badge>
                </TableCell>
                <TableCell>{solicitacao.numeroPeriodo}º Período</TableCell>
                <TableCell>{formatarData(solicitacao.dataInicio)}</TableCell>
                <TableCell>{formatarData(solicitacao.dataFim)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleAprovar(solicitacao.id)}
                    disabled={processando === solicitacao.id}
                  >
                    <CheckCircle className="mr-1" size={16} />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRejeitar(solicitacao.id)}
                    disabled={processando === solicitacao.id}
                  >
                    <XCircle className="mr-1" size={16} />
                    Rejeitar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
