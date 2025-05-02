'use client';

import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { Button } from "components/ui/button";
import { Dialog } from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "components/ui/select";
import { Badge } from "components/ui/badge";
import { CheckCircle, Clock, Download, Eye, XCircle } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table";

type Autorizacao = {
  numero: string;
  tipo: 'Importações' | 'Exportações' | 'Re-exportações';
  data: string;
  estado: 'Aprovado' | 'Rejeitado' | 'Pendente';
  rupe: 'Disponível' | 'Sem RUPE';
};

const mockData: Autorizacao[] = [
  { numero: 'PA-000001', tipo: 'Importações', data: '2025-04-10', estado: 'Aprovado', rupe: 'Disponível' },
  { numero: 'PA-000002', tipo: 'Exportações', data: '2025-04-12', estado: 'Pendente', rupe: 'Sem RUPE' },
  { numero: 'PA-000003', tipo: 'Re-exportações', data: '2025-03-28', estado: 'Rejeitado', rupe: 'Disponível' },
];

const tipos = ['Importações', 'Exportações', 'Re-exportações'];
const estados = ['Aprovado', 'Rejeitado', 'Pendente'];
const rupeOptions = ['Disponível', 'Sem RUPE'];

import { useRouter } from "next/navigation";

export default function AutorizacaoPage() {
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    rupe: '',
    search: '',
  });
  const [form, setForm] = useState({
    tipo: '',
    codigos: [''],
    quantidades: [''],
    custos: [''],
    moeda: '',
    documentos: {
      carta: undefined as File | undefined,
      factura: undefined as File | undefined,
      comprovativo: undefined as File | undefined,
      especificacao: undefined as File | undefined,
      fotos: [] as File[],
    },
  });

  // Mock validation
  const validateCodigoPautal = (codigo: string) => codigo.length === 8;

  // Filtro simples
  const filteredData = mockData.filter(item =>
    (filters.tipo ? item.tipo === filters.tipo : true) &&
    (filters.estado ? item.estado === filters.estado : true) &&
    (filters.rupe ? item.rupe === filters.rupe : true) &&
    (filters.search ? item.numero.includes(filters.search) : true)
  );

  // Add/Remove múltiplos códigos
  const handleCodigoChange = (idx: number, value: string) => {
    const codigos = [...form.codigos];
    codigos[idx] = value;
    setForm({ ...form, codigos });
  };
  const addCodigo = () =>
    setForm({
      ...form,
      codigos: [...form.codigos, ''],
      quantidades: [...form.quantidades, ''],
      custos: [...form.custos, ''],
    });
  const removeCodigo = (idx: number) => {
    const codigos = form.codigos.filter((_, i) => i !== idx);
    const quantidades = form.quantidades.filter((_, i) => i !== idx);
    const custos = form.custos.filter((_, i) => i !== idx);
    setForm({ ...form, codigos, quantidades, custos });
  };

  // Modal Step 1 (SEM RUPE)
  const Step1 = (
    <div>
      <h2 className="text-xl font-bold mb-6 text-primary">Tipo de Autorização</h2>
      <div className="flex flex-col gap-4 mb-8">
        <Select
          value={form.tipo}
          onValueChange={v => setForm({ ...form, tipo: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo de autorização" />
          </SelectTrigger>
          <SelectContent>
            {tipos.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full bg-lime-600 text-white rounded-lg font-semibold shadow hover:bg-lime-700 transition"
        disabled={!form.tipo}
        onClick={() => setStep(2)}
      >
        Próximo
      </Button>
    </div>
  );

  // Modal Step 2
  const Step2 = (
    <div className="rounded-2xl shadow-2xl bg-white/95 border border-lime-100 p-6 max-w-lg mx-auto animate-modal-pop">
      <h2 className="text-lg font-semibold mb-4 text-lime-800 tracking-tight">Informações do Produto</h2>
      {form.codigos.map((codigo, idx) => (
        <div key={idx} className="flex gap-2 mb-3 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Código Pautal</label>
            <Input
              value={codigo}
              onChange={e => handleCodigoChange(idx, e.target.value)}
              placeholder="8 dígitos"
              className="w-32"
            />
            {!validateCodigoPautal(codigo) && codigo && (
              <span className="text-xs text-red-500">Código inválido</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantidade</label>
            <Input
              type="number"
              value={form.quantidades[idx] || ''}
              onChange={e => {
                const quantidades = [...form.quantidades];
                quantidades[idx] = e.target.value;
                setForm({ ...form, quantidades });
              }}
              className="w-24"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Custo Unitário</label>
            <Input
              type="number"
              value={form.custos[idx] || ''}
              onChange={e => {
                const custos = [...form.custos];
                custos[idx] = e.target.value;
                setForm({ ...form, custos });
              }}
              className="w-24"
              min={0}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeCodigo(idx)}
            className="text-red-500"
            title="Remover"
          >
            ×
          </Button>
        </div>
      ))}
      <Button variant="link" className="text-lime-700 mb-4" onClick={addCodigo}>
        + Adicionar Código
      </Button>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Moeda</label>
        <Select
          value={form.moeda}
          onValueChange={v => setForm({ ...form, moeda: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AKZ">AKZ</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full bg-lime-600 text-white rounded-lg font-semibold shadow hover:bg-lime-700 transition"
        onClick={() => setStep(3)}
        disabled={!form.codigos.every(validateCodigoPautal) || !form.moeda}
      >
        Próximo
      </Button>
    </div>
  );

  // Modal Step 3
  const [docErrors, setDocErrors] = React.useState<{[k: string]: string}>({});
  const validateDocs = () => {
    const errors: {[k: string]: string} = {};
    if (!form.documentos.carta) errors.carta = 'Obrigatório';
    if (!form.documentos.factura) errors.factura = 'Obrigatório';
    else if (form.documentos.factura && form.documentos.factura.type !== 'application/pdf') errors.factura = 'Apenas PDF permitido';
    if (!form.documentos.comprovativo) errors.comprovativo = 'Obrigatório';
    if (!form.documentos.especificacao) errors.especificacao = 'Obrigatório';
    if (!form.documentos.fotos || form.documentos.fotos.length === 0) errors.fotos = 'Envie pelo menos uma foto';
    setDocErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleDocChange = (key: string, file: File | undefined) => {
    setForm(f => ({
      ...f,
      documentos: { ...f.documentos, [key]: file }
    }));
  };
  const handleFotosChange = (files: FileList | null) => {
    setForm(f => ({
      ...f,
      documentos: { ...f.documentos, fotos: files ? Array.from(files) : [] }
    }));
  };
  const Step3 = (
    <div>
      <div className="mb-4">
        <label className="block font-medium">Carta de Solicitação *</label>
        <Input type="file" accept="application/pdf,image/*" onChange={e => handleDocChange('carta', e.target.files?.[0])} />
        {docErrors.carta && <span className="text-xs text-red-500">{docErrors.carta}</span>}
      </div>
      <div className="mb-4">
        <label className="block font-medium">Factura Recibo (apenas PDF) *</label>
        <Input type="file" accept="application/pdf" onChange={e => handleDocChange('factura', e.target.files?.[0])} />
        {docErrors.factura && <span className="text-xs text-red-500">{docErrors.factura}</span>}
      </div>
      <div className="mb-4">
        <label className="block font-medium">Comprovativo de Pagamento *</label>
        <Input type="file" accept="application/pdf,image/*" onChange={e => handleDocChange('comprovativo', e.target.files?.[0])} />
        {docErrors.comprovativo && <span className="text-xs text-red-500">{docErrors.comprovativo}</span>}
      </div>
      <div className="mb-4">
        <label className="block font-medium">Especificação Técnica *</label>
        <Input type="file" accept="application/pdf,image/*" onChange={e => handleDocChange('especificacao', e.target.files?.[0])} />
        {docErrors.especificacao && <span className="text-xs text-red-500">{docErrors.especificacao}</span>}
      </div>
      <div className="mb-4">
        <label className="block font-medium">Fotos do Produto *</label>
        <Input type="file" accept="image/*" multiple onChange={e => handleFotosChange(e.target.files)} />
        {docErrors.fotos && <span className="text-xs text-red-500">{docErrors.fotos}</span>}
      </div>
      <Button
        className="w-full bg-lime-600 text-white rounded-lg font-semibold shadow hover:bg-lime-700 transition"
        onClick={() => {
          if (validateDocs()) setShowModal(false);
        }}
        disabled={!form.documentos.carta || !form.documentos.factura || form.documentos.factura?.type !== 'application/pdf' || !form.documentos.comprovativo || !form.documentos.especificacao || !form.documentos.fotos || form.documentos.fotos.length === 0}
      >
        Solicitar Autorização
      </Button>
    </div>
  );

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Modal fundo escuro e centralização absoluta */}
      <Dialog
        open={showModal}
        onOpenChange={open => {
          setShowModal(open);
          if (!open) setStep(1);
        }}
        title={step === 1 ? 'Tipo de Autorização' : step === 2 ? 'Informações do Produto' : 'Envio de Documentos'}
      >
        {step === 1 ? Step1 : step === 2 ? Step2 : step === 3 ? Step3 : null}
      </Dialog>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lime-700 font-semibold">Autorizações</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Autorizações</h1>
        <Button
          className="bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg shadow"
          onClick={() => { setShowModal(true); setStep(1); }}
        >
          + Solicitar Autorização
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
          value={filters.tipo}
          onValueChange={v => setFilters(f => ({ ...f, tipo: v }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {tipos.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
          </SelectContent>
        </Select>
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
        <Select
          value={filters.rupe}
          onValueChange={v => setFilters(f => ({ ...f, rupe: v }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="RUPE" />
          </SelectTrigger>
          <SelectContent>
            {rupeOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="text-gray-500 border border-gray-200 hover:bg-gray-100"
          onClick={() => setFilters({ tipo: '', estado: '', search: '', rupe: '' })}
        >
          Limpar Filtros
        </Button>
      </div>

      {/* Tabela */}
      <Table className="rounded-xl shadow-md bg-white border border-base-200">
        <TableHeader>
          <TableRow>
            <TableHead>Nº Pedido</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>RUPE</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map(item => (
            <TableRow key={item.numero} className="hover:bg-base-100 transition">
              <TableCell className="font-mono">{item.numero}</TableCell>
              <TableCell>{item.tipo}</TableCell>
              <TableCell>{item.data}</TableCell>
              <TableCell>
                <Badge variant={
                  item.estado === 'Aprovado' ? 'default' :
                    item.estado === 'Pendente' ? 'secondary' :
                      'destructive'
                } className="flex items-center gap-1 px-2">
                  {item.estado === 'Aprovado' && <CheckCircle className="text-green-600" size={16} />}
                  {item.estado === 'Pendente' && <Clock className="text-yellow-500" size={16} />}
                  {item.estado === 'Rejeitado' && <XCircle className="text-white-500" size={16} />}
                  {item.estado}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.rupe === 'Disponível' ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                  {item.rupe === 'Disponível' && <CheckCircle className="text-green-600" size={16} />}
                  {item.rupe === 'Sem RUPE' && <XCircle className="text-red-500" size={16} />}
                  {item.rupe !== 'Disponível' && item.rupe !== 'Sem RUPE' && <Clock className="text-yellow-500" size={16} />}
                  {item.rupe}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setLoading(true);
                    router.push(`/ut_autorizacao/${item.numero}`);
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg min-w-[350px] p-0">
            <div className="bg-white text-black rounded-3xl shadow-2xl border border-lime-100 p-8 animate-modal-pop relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-lime-700 transition-transform duration-200 ease-in-out hover:scale-125 focus:outline-none"
                onClick={() => setShowModal(false)}
                title="Fechar"
                aria-label="Fechar modal"
              >
                <span className="inline-block transition-transform duration-300 ease-in-out">
                  <FiX size={28} />
                </span>
              </button>
              {step === 1 ? Step1 : Step2}
            </div>
          </div>
          <style jsx global>{`
            .animate-fade-in {
              animation: fadeInBg 0.35s cubic-bezier(.4,0,.2,1);
            }
            .animate-modal-pop {
              animation: modalPop 0.33s cubic-bezier(.4,0,.2,1);
            }
            @keyframes fadeInBg {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalPop {
              from { opacity: 0; transform: scale(0.93) translateY(30px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
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