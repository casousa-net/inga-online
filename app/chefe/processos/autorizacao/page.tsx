"use client";
import React, { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Eye, BadgeCheck, XCircle, FileText, FilePlus2 } from "lucide-react";

// Mock dos processos - normalmente você importaria de um arquivo compartilhado
const processosDireccao = [
  {
    numero: "PR-202501",
    tipo: "Autorização",
    subtipo: "Importações",
    data: "2025-05-01",
    estado: "Validado",
    statusTecnico: "Validado",
    statusChefe: "Validado",
    statusDireccao: "Pendente Assinatura",
    utente: "João Silva",
    valorPago: "120.000,00 AKz",
    documentos: [
      { nome: "Requerimento.pdf", url: "#" },
      { nome: "Declaração Técnica.pdf", url: "#" },
      { nome: "Recibo de Pagamento.pdf", url: "#" }
    ],
    link: "/dir_processos/PR-202501"
  },
  {
    numero: "PR-202503",
    tipo: "Autorização",
    subtipo: "Exportações",
    data: "2025-04-25",
    estado: "Validado",
    statusTecnico: "Validado",
    statusChefe: "Validado",
    statusDireccao: "Pendente Assinatura",
    utente: "Pedro Oliveira",
    valorPago: "150.000,00 AKz",
    documentos: [
      { nome: "Requerimento.pdf", url: "#" },
      { nome: "Recibo de Pagamento.pdf", url: "#" }
    ],
    link: "/dir_processos/PR-202503"
  }
];

export default function ChefeAutorizacao() {
  // Filtra apenas processos de autorização sem assinatura da Direcção
  const processosAutorizacao = processosDireccao.filter(
    p => p.tipo === "Autorização" && p.statusDireccao === "Pendente Assinatura"
  );

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
              <TableHead className="text-left w-40">Valor Pago</TableHead>
              <TableHead className="text-left w-44">Estado</TableHead>
              <TableHead className="text-left w-56">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processosAutorizacao.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo de autorização pendente.</TableCell>
              </TableRow>
            ) : (
              processosAutorizacao.map(proc => (
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
                    <Badge variant={proc.statusDireccao === "Pendente Assinatura" ? "destructive" : "outline"} className={proc.statusDireccao === "Pendente Assinatura" ? "bg-red-100 text-red-700 border-none" : ""}>
                      {proc.statusDireccao}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="secondary" className="text-green-700 border-green-700 flex items-center gap-1" title="Aprovar">
                      <BadgeCheck className="w-4 h-4" /> Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" className="flex items-center gap-1" title="Rejeitar">
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </Button>
                    <Button size="sm" variant="secondary" className="text-blue-700 border-blue-700 flex items-center gap-1" title="Inserir RUPE">
                      <FilePlus2 className="w-4 h-4" /> Inserir RUPE
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
