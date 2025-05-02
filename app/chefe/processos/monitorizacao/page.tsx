"use client";
import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Eye, FilePlus2, Upload, CalendarCheck2, BadgeCheck, AlertCircle, XCircle, FileText } from "lucide-react";

// Mock dos processos de monitorização (em produção, importar do backend ou arquivo compartilhado)
const processosMonitorizacao = [
  {
    numero: "PR-202502",
    tipo: "Monitorização",
    subtipo: "Espaços Verdes",
    data: "2025-04-28",
    estado: "Validado",
    statusTecnico: "Validado",
    statusChefe: "Validado",
    statusDireccao: "Pendente Assinatura",
    parecer: "Carece de Melhorias",
    utente: "Maria Santos",
    valorPago: "80.000,00 AKz",
    documentos: [
      { nome: "Relatório Técnico.pdf", url: "#" },
      { nome: "Comprovativo de Pagamento.pdf", url: "#" }
    ],
    link: "/dir_processos/PR-202502"
  },
  {
    numero: "PR-202504",
    tipo: "Monitorização",
    subtipo: "Espaços Verdes",
    data: "2025-04-20",
    estado: "Validado",
    statusTecnico: "Validado",
    statusChefe: "Validado",
    statusDireccao: "Pendente Assinatura",
    parecer: "Aprovado",
    utente: "Joana Lima",
    valorPago: "100.000,00 AKz",
    documentos: [
      { nome: "Relatório Técnico.pdf", url: "#" },
      { nome: "Comprovativo de Pagamento.pdf", url: "#" },
      { nome: "Parecer Chefe.pdf", url: "#" }
    ],
    link: "/dir_processos/PR-202504"
  },
];

const parecerColors: Record<string, string> = {
  "Aprovado": "bg-lime-100 text-lime-700 border-none",
  "Carece de Melhorias": "bg-yellow-100 text-yellow-700 border-none",
  "Rejeitado": "bg-red-100 text-red-700 border-none"
};

export default function ChefeMonitorizacao() {
  return (
    <div className="w-full min-h-screen flex flex-col gap-6 p-0">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <FileText className="text-lime-700" size={28} /> Processos de Monitorização
        </h1>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-sm font-semibold">
          <BadgeCheck className="w-4 h-4" /> Processos aguardando ações do Chefe
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
              <TableHead className="text-left w-40">Valor Pago</TableHead>
              <TableHead className="text-left w-44">Parecer</TableHead>
              <TableHead className="text-left w-64">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processosMonitorizacao.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo de monitorização pendente.</TableCell>
              </TableRow>
            ) : (
              processosMonitorizacao.map(proc => (
                <TableRow key={proc.numero} className="hover:bg-muted/50">
                  <TableCell className="font-semibold text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-lime-700" />
                    {proc.numero}
                  </TableCell>
                  <TableCell>{proc.utente}</TableCell>
                  <TableCell>{proc.subtipo}</TableCell>
                  <TableCell>{proc.data}</TableCell>
                  <TableCell>{proc.valorPago}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={parecerColors[proc.parecer] || ""}>
                      {proc.parecer}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" className="text-blue-700 border-blue-700 flex items-center gap-1" title="Inserir RUPE">
                      <FilePlus2 className="w-4 h-4" /> Inserir RUPE
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-1" title="Ver Documentos">
                      <Eye className="w-4 h-4" /> Ver Documentos
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-1" title="Carregar Documentos">
                      <Upload className="w-4 h-4" /> Carregar Docs
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-1" title="Marcar Visita">
                      <CalendarCheck2 className="w-4 h-4" /> Marcar Visita
                    </Button>
                    <Button size="sm" variant="secondary" className="flex items-center gap-1 text-lime-700 border-lime-700" title="Aprovar Parecer">
                      <BadgeCheck className="w-4 h-4" /> Aprovado
                    </Button>
                    <Button size="sm" variant="secondary" className="flex items-center gap-1 text-yellow-700 border-yellow-700" title="Carece de Melhorias">
                      <AlertCircle className="w-4 h-4" /> Carece de Melhorias
                    </Button>
                    <Button size="sm" variant="destructive" className="flex items-center gap-1" title="Rejeitar Parecer">
                      <XCircle className="w-4 h-4" /> Rejeitado
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
