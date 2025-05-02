"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "components/ui/select";
import { Badge } from "components/ui/badge";
import { CheckCircle, Clock, XCircle, Download, Eye } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table";
import { FiX } from "react-icons/fi";

const mockMonitorizacoes = [
  {
    numero: "MO-000001",
    data: "2025-05-01",
    estado: "Aguardando RUPE",
    rupe: "Sem RUPE",
    relatorio: "Relatorio1.pdf",
    parecer: null,
  },
  {
    numero: "MO-000002",
    data: "2025-04-22",
    estado: "Aguardando Pagamento",
    rupe: "123456789012345678901",
    relatorio: "Relatorio2.pdf",
    parecer: null,
  },
  {
    numero: "MO-000003",
    data: "2025-04-10",
    estado: "Aprovado",
    rupe: "123456789012345678901",
    relatorio: "Relatorio3.pdf",
    parecer: "ParecerTecnico3.pdf",
  },
];

const estados = ["Aguardando RUPE", "Aguardando Pagamento", "Aprovado", "Rejeitado", "Carece de Melhorias"];

export default function ut_Page() {
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    estado: '',
    search: '',
  });
  const [form, setForm] = useState({
    relatorio: null as File | null,
  });

  const filteredData = mockMonitorizacoes.filter(item =>
    (filters.estado ? item.estado === filters.estado : true) &&
    (filters.search ? item.numero.includes(filters.search) : true)
  );

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, relatorio: e.target.files?.[0] || null });
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lime-700 font-semibold">Monitorização</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Monitorização</h1>
        <Button
          className="bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg shadow"
          onClick={() => setShowModal(true)}
        >
          + Solicitar Monitorização
        </Button>
      </div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Input
          placeholder="Buscar Nº Processo"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="max-w-xs"
        />
        <Select
          value={filters.estado}
          onValueChange={v => setFilters(f => ({ ...f, estado: v }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="text-gray-500 border border-gray-200 hover:bg-gray-100"
          onClick={() => setFilters({ estado: '', search: '' })}
        >
          Limpar Filtros
        </Button>
      </div>
      {/* Tabela */}
      <Table className="rounded-xl shadow-md bg-white border border-base-200">
        <TableHeader>
          <TableRow>
            <TableHead>Nº Processo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>RUPE</TableHead>
            <TableHead>Relatório</TableHead>
            <TableHead>Parecer Técnico</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map(item => (
            <TableRow key={item.numero} className="hover:bg-base-100 transition">
              <TableCell className="font-mono">{item.numero}</TableCell>
              <TableCell>{item.data}</TableCell>
              <TableCell>
                <Badge variant={
                  item.estado === 'Aprovado' ? 'default' :
                    item.estado === 'Rejeitado' ? 'destructive' :
                      'secondary'
                } className="flex items-center gap-1 px-2">
                  {item.estado === 'Aprovado' && <CheckCircle className="text-green-600" size={16} />}
                  {item.estado.toLowerCase().includes('aguardando') && <Clock className="text-yellow-500" size={16} />}
                  {item.estado === 'Rejeitado' && <XCircle className="text-red-500" size={16} />}
                  {item.estado}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.rupe !== 'Sem RUPE' ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                  {item.rupe !== 'Sem RUPE' && <CheckCircle className="text-green-600" size={16} />}
                  {item.rupe === 'Sem RUPE' && <XCircle className="text-red-500" size={16} />}
                  {item.rupe !== 'Sem RUPE' ? 'Disponível' : 'Sem RUPE'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.relatorio ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                  {item.relatorio && <CheckCircle className="text-green-600" size={16} />}
                  {!item.relatorio && <XCircle className="text-red-500" size={16} />}
                  {item.relatorio ? 'Disponível' : 'Não enviado'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.parecer ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                  {item.parecer && <CheckCircle className="text-green-600" size={16} />}
                  {!item.parecer && <XCircle className="text-red-500" size={16} />}
                  {item.parecer ? 'Disponível' : 'Indisponível'}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setLoading(true);
                    router.push(`/ut_monitorizacao/${item.numero}`);
                  }}>
                    <Eye className="text-green-600" size={16} /> Ver Processo
                  </Button>
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
                  <Button size="sm" variant="ghost">
                    <Download className="text-lime-700" size={16} /> Baixar
                  </Button>
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Modal Solicitação Monitorização */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg min-w-[350px] p-0">
            <div className="bg-white text-black rounded-3xl shadow-2xl border border-lime-100 p-8 animate-modal-pop relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-lime-700 transition-transform duration-200 ease-in-out hover:scale-125 focus:outline-none"
                onClick={() => setShowModal(false)}
                title="Fechar"
                aria-label="Fechar modal">
                <span className="inline-block transition-transform duration-300 ease-in-out">
                  <FiX size={28} />
                </span>
              </button>
              <h2 className="text-2xl font-extrabold mb-6 text-lime-700 tracking-tight animate-fade-down">Solicitar Monitorização</h2>
              <div className="mb-6 animate-fade-up">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Relatório (PDF)</label>
                <Input type="file" accept="application/pdf" onChange={handleUpload} className="file:bg-lime-100 file:text-lime-900 file:rounded-lg file:border-none file:font-semibold file:shadow-sm transition" />
              </div>
              <Button
                className="w-full bg-lime-600 text-white rounded-xl font-bold shadow-lg hover:bg-lime-700 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                disabled={!form.relatorio}
                onClick={() => setShowModal(false)}>
                Enviar Solicitação
              </Button>
            </div>
          </div>
          <style jsx global>{`
            .animate-fade-in {
              animation: fadeInBg 0.35s cubic-bezier(.4,0,.2,1);
            }
            .animate-modal-pop {
              animation: modalPop 0.33s cubic-bezier(.4,0,.2,1);
            }
            .animate-fade-down {
              animation: fadeDown 0.3s 0.05s both;
            }
            .animate-fade-up {
              animation: fadeUp 0.3s 0.12s both;
            }
            @keyframes fadeInBg {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalPop {
              from { opacity: 0; transform: scale(0.93) translateY(30px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes fadeDown {
              from { opacity: 0; transform: translateY(-16px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <span className="inline-block animate-spin-slow">
            <svg className="w-16 h-16 text-lime-500" fill="none" viewBox="0 0 32 32">
              <circle className="opacity-20" cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="4" />
              <path d="M30 16a14 14 0 0 1-14 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          <style jsx global>{`
            .animate-spin-slow {
              animation: spin 1.2s linear infinite;
            }
            @keyframes spin {
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}