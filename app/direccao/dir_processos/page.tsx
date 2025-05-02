"use client";

import React, { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "components/ui/select";
import { Eye } from "lucide-react";
import Link from "next/link";
import type { Colaborador } from "../dir_colaboradores/types";

// Mock de processos validados por Técnicos e Chefe de Departamento
const processosDireccao = [
  {
    numero: "PR-202505",
    tipo: "Monitorização",
    subtipo: "Espaços Verdes",
    data: "2025-05-10",
    estado: "Validado",
    statusTecnico: "Validado",
    statusChefe: "Validado",
    statusDireccao: "Visita Técnica",
    utente: "Carlos Alves",
    valorPago: "90.000,00 AKz",
    documentos: [],
    link: "/dir_processos/PR-202505"
  },
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
    numero: "PR-202502",
    tipo: "Monitorização",
    subtipo: "Espaços Verdes",
    data: "2025-04-28",
    estado: "Validado",
    statusTecnico: "Validado",
    statusChefe: "Validado",
    statusDireccao: "Pendente Assinatura",
    utente: "Maria Santos",
    valorPago: "80.000,00 AKz",
    documentos: [
      { nome: "Relatório Técnico.pdf", url: "#" },
      { nome: "Comprovativo de Pagamento.pdf", url: "#" }
    ],
    link: "/dir_processos/PR-202502"
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

import { mockColaboradores } from "../dir_colaboradores/page";

export default function ProcessosPage() {
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [docModal, setDocModal] = useState<any|null>(null);
  const [tecnicosModal, setTecnicosModal] = useState<any|null>(null);
  const [tecnicosSelecionados, setTecnicosSelecionados] = useState<string[]>([]);

  const tipos = Array.from(new Set(processosDireccao.map(p => p.tipo)));
  const estados = Array.from(new Set(processosDireccao.map(p => p.statusDireccao)));

  const processosFiltrados = processosDireccao.filter(proc => {
    const tipoOk = !tipoFiltro || tipoFiltro === "all" || proc.tipo === tipoFiltro;
    const estadoOk = !estadoFiltro || estadoFiltro === "all" || proc.statusDireccao === estadoFiltro;
    return tipoOk && estadoOk;
  });

  return (
    <div className="w-full p-8">
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
              <TableHead className="text-left">Subtipo</TableHead>
              <TableHead className="text-left">Data</TableHead>
              <TableHead className="text-left">Valor Pago</TableHead>
              <TableHead className="text-left">Estado</TableHead>
              <TableHead className="text-left">Documentos</TableHead>
              <TableHead className="text-left">Assinar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-400">Nenhum processo para assinatura.</TableCell>
              </TableRow>
            ) : (
              processosFiltrados.map((proc, idx) => (
                <TableRow key={proc.numero} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="py-2 font-mono text-sm text-gray-800">{proc.numero}</TableCell>
                  <TableCell className="py-2 font-semibold text-gray-900">{proc.utente}</TableCell>
                  <TableCell className="py-2 font-semibold text-gray-900">{proc.tipo}</TableCell>
                  <TableCell className="py-2 text-gray-700">{proc.subtipo}</TableCell>
                  <TableCell className="py-2 text-gray-700">{proc.data}</TableCell>
                  <TableCell className="py-2 font-mono text-lime-800">{proc.valorPago}</TableCell>
                  <TableCell className="py-2">
                    <Badge className="flex items-center gap-1 px-2 bg-black text-yellow-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                      {proc.statusDireccao}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <Button variant="secondary" className="flex items-center gap-1 px-2 text-lime-700" onClick={() => setDocModal(proc)}>
                      <Eye size={16} /> Ver Documentos
                    </Button>
                  </TableCell>
                  <TableCell className="py-2">
                    {proc.tipo === "Monitorização" && proc.statusDireccao === "Visita Técnica" ? (
                      <Button variant="secondary" className="flex items-center gap-1 px-2" onClick={() => {
                        setTecnicosModal(proc);
                        setTecnicosSelecionados([]);
                      }}>
                        Selecionar Técnicos
                      </Button>
                    ) : (
                      <Button variant="secondary" className="flex items-center gap-1 px-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        Assinar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Modal de Documentos */}
      {/* Modal Selecionar Técnicos */}
      {tecnicosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] max-w-[90vw] relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-lime-700" onClick={() => setTecnicosModal(null)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l8 8M6 14L14 6"/></svg>
            </button>
            <h2 className="text-lg font-bold mb-4 text-primary">Selecionar 3 Técnicos para a Visita</h2>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {mockColaboradores.filter(c => c.nivel === "Tecnico" && c.estado === "Ativo").map((tecnico: Colaborador) => (
                <label key={tecnico.nome} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tecnicosSelecionados.includes(tecnico.nome)}
                    onChange={() => {
                      if (tecnicosSelecionados.includes(tecnico.nome)) {
                        setTecnicosSelecionados(tecnicosSelecionados.filter(n => n !== tecnico.nome));
                      } else if (tecnicosSelecionados.length < 3) {
                        setTecnicosSelecionados([...tecnicosSelecionados, tecnico.nome]);
                      }
                    }}
                    disabled={!tecnicosSelecionados.includes(tecnico.nome) && tecnicosSelecionados.length >= 3}
                  />
                  <span>{tecnico.nome} ({tecnico.area})</span>
                </label>
              ))}
            </div>
            <Button
              onClick={() => {
                // Aqui você pode salvar os técnicos selecionados, enviar para backend etc
                setTecnicosModal(null);
                alert("Técnicos selecionados: " + tecnicosSelecionados.join(", "));
              }}
              disabled={tecnicosSelecionados.length !== 3}
              className="w-full"
            >
              Confirmar Seleção
            </Button>
          </div>
        </div>
      )}

      {docModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] max-w-[90vw] relative">
            <button className="absolute top-3 right-3 text-gray-400 hover:text-lime-700" onClick={() => setDocModal(null)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l8 8M6 14L14 6"/></svg>
            </button>
            <h2 className="text-lg font-bold mb-4 text-primary">Documentos Carregados</h2>
            <ul className="space-y-2">
              {docModal.documentos.map((doc: any, idx: number) => (
                <li key={idx} className="flex items-center gap-2 border-b pb-2">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="12" height="14" rx="2"/><path d="M7 7h4M7 11h4"/></svg>
                  <span>{doc.nome}</span>
                  <a href={doc.url} className="text-lime-700 hover:underline ml-auto" target="_blank" rel="noopener noreferrer">Abrir</a>
<a href={doc.url} className="text-gray-400 hover:text-lime-700 ml-2" download>Baixar</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
