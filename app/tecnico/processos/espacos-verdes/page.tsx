"use client";
import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Eye, BadgeCheck, XCircle, FileText } from "lucide-react";

// Mock dos processos de espaços verdes
const processosEspacosVerdes = [
  {
    numero: "PR-202510",
    tipo: "Espaços Verdes",
    subtipo: "Parque Urbano",
    data: "2025-05-02",
    estado: "Em Análise",
    statusTecnico: "Em Análise",
    statusChefe: "Pendente",
    statusDireccao: "Pendente",
    utente: "Carlos Mendes",
    valorPago: "60.000,00 AKz",
    documentos: [
      { nome: "Requerimento.pdf", url: "#" },
      { nome: "Croqui.pdf", url: "#" }
    ],
    link: "/dir_processos/PR-202510"
  }
];

export default function TecnicoEspacosVerdes() {
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
              <TableHead className="text-left w-40">Subtipo</TableHead>
              <TableHead className="text-left w-32">Data</TableHead>
              <TableHead className="text-left w-40">Valor Pago</TableHead>
              <TableHead className="text-left w-44">Estado</TableHead>
              <TableHead className="text-left w-64">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processosEspacosVerdes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo de espaços verdes pendente.</TableCell>
              </TableRow>
            ) : (
              processosEspacosVerdes.map(proc => (
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
                    <Badge variant="outline">{proc.estado}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-1" title="Ver Documentos">
                      <Eye className="w-4 h-4" /> Ver Documentos
                    </Button>
                    <Button size="sm" variant="secondary" className="flex items-center gap-1 text-lime-700 border-lime-700" title="Aprovar">
                      <BadgeCheck className="w-4 h-4" /> Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" className="flex items-center gap-1" title="Rejeitar">
                      <XCircle className="w-4 h-4" /> Rejeitar
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
