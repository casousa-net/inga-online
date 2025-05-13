'use client';

import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Download, Eye, XCircle } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table";
import { useRouter } from "next/navigation";
import TotalAutorizacao from "../../components/TotalAutorizacao";
import { toast } from "sonner";

type Autorizacao = {
  id: number;
  tipo: string;
  createdAt: string;
  status: string;
  rupeReferencia?: string | null;
  moeda?: { nome: string };
  itens?: any[];
  documentos?: any[];
};

export default function AutorizacaoPage() {
  const [autorizacoes, setAutorizacoes] = useState<Autorizacao[]>([]);
  const [loadingAutorizacoes, setLoadingAutorizacoes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [moedas, setMoedas] = useState<{id: number, nome: string, simbolo: string, taxaCambio: number}[]>([]);
  const [codigosPautais, setCodigosPautais] = useState<{id: number, codigo: string, descricao: string}[]>([]);
  const [loadingMoedas, setLoadingMoedas] = useState(true);
  const [loadingCodigos, setLoadingCodigos] = useState(true);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    rupe: '',
    search: '',
  });
  
  // Define the initial form state to use for resetting
  const initialFormState = {
    tipo: '',
    codigos: [{ id: 0, codigo: '' }] as { id: number, codigo: string }[],
    quantidades: [1] as number[],
    precos: [0] as number[],
    moeda: '' as string | null,
    numeroFactura: '',
    documentos: {
      carta: undefined as File | undefined,
      factura: undefined as File | undefined,
      comprovativo: undefined as File | undefined,
      especificacao: undefined as File | undefined,
      fotos: [] as File[],
    },
  };
  
  const [form, setForm] = useState(initialFormState);

  // Validação do código pautal
  const validateCodigoPautal = (codigo: string) => codigo.length === 8 && /^\d+$/.test(codigo);

  // Dados de exemplo para desenvolvimento
  const mockAutorizacoes = [
    {
      id: 1001,
      tipo: 'Importações',
      createdAt: new Date().toISOString(),
      status: 'Pendente',
      rupeReferencia: null,
      moeda: { nome: 'Dólar Americano' },
      valorTotalKz: 125000
    },
    {
      id: 1002,
      tipo: 'Exportações',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Aprovado',
      rupeReferencia: 'RUPE-2025-001',
      moeda: { nome: 'Euro' },
      valorTotalKz: 250000
    },
    {
      id: 1003,
      tipo: 'Re-exportações',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Rejeitado',
      rupeReferencia: null,
      moeda: { nome: 'Kwanza' },
      valorTotalKz: 75000
    }
  ];

  // Carregar autorizações
  useEffect(() => {
    const usuarioId = localStorage.getItem('utenteId');
    if (!usuarioId) return;
    setLoadingAutorizacoes(true);
    
    const useMockData = () => {
      console.log('Usando dados de exemplo para autorizações');
      toast.warning('Usando dados de exemplo para desenvolvimento.');
      setAutorizacoes(mockAutorizacoes);
      setLoadingAutorizacoes(false);
    };
    
    // Verificar se o endpoint está disponível
    fetch(`/api/solicitacao?utenteId=${usuarioId}`)
      .then(res => {
        if (!res.ok) {
          // Se o servidor retornar um erro, usamos dados de exemplo
          if (res.status === 500) {
            console.log('Servidor retornou erro 500');
            useMockData();
            return null;
          }
          throw new Error(`Erro na API: ${res.status}`);
        }
        return res.text();
      })
      .then(text => {
        if (text === null) return; // Já tratado acima
        
        // Check if response is empty
        if (!text) {
          console.log('Resposta vazia da API');
          useMockData();
          return;
        }
        
        try {
          const data = JSON.parse(text);
          setAutorizacoes(data);
        } catch (e) {
          console.error('Erro ao analisar JSON:', e, 'Texto recebido:', text);
          useMockData();
        }
      })
      .catch(err => {
        console.error('Erro ao carregar autorizações:', err);
        useMockData();
      })
      .finally(() => setLoadingAutorizacoes(false));
  }, []);
  
  // Dados de exemplo para moedas
  const mockMoedas = [
    { id: 1, nome: 'Kwanza', simbolo: 'AKZ', taxaCambio: 1 },
    { id: 2, nome: 'Dólar Americano', simbolo: 'USD', taxaCambio: 830.5 },
    { id: 3, nome: 'Euro', simbolo: 'EUR', taxaCambio: 910.75 }
  ];

  // Carregar moedas
  useEffect(() => {
    setLoadingMoedas(true);
    
    const useMockData = () => {
      console.log('Usando dados de exemplo para moedas');
      toast.warning('Usando dados de exemplo para moedas.');
      setMoedas(mockMoedas);
      setLoadingMoedas(false);
    };
    
    fetch('/api/moedas')
      .then(res => {
        if (!res.ok) {
          // Se o servidor retornar um erro, usamos dados de exemplo
          if (res.status === 500) {
            console.log('Servidor retornou erro 500');
            useMockData();
            return null;
          }
          throw new Error(`Erro na API: ${res.status}`);
        }
        return res.text();
      })
      .then(text => {
        if (text === null) return; // Já tratado acima
        
        // Check if response is empty
        if (!text) {
          console.log('Resposta vazia da API de moedas');
          useMockData();
          return;
        }
        
        try {
          const data = JSON.parse(text);
          console.log('Moedas carregadas:', data);
          setMoedas(data);
        } catch (e) {
          console.error('Erro ao analisar JSON de moedas:', e, 'Texto recebido:', text);
          useMockData();
        }
      })
      .catch(err => {
        console.error('Erro ao carregar moedas:', err);
        useMockData();
      })
      .finally(() => setLoadingMoedas(false));
  }, []);
  
  // Dados de exemplo para códigos pautais
  const mockCodigosPautais = [
    { id: 1, codigo: '12345678', descricao: 'Equipamentos Eletrônicos', taxa: 0.05 },
    { id: 2, codigo: '23456789', descricao: 'Produtos Químicos', taxa: 0.07 },
    { id: 3, codigo: '34567890', descricao: 'Alimentos Processados', taxa: 0.03 },
    { id: 4, codigo: '45678901', descricao: 'Maquinaria Industrial', taxa: 0.06 },
    { id: 5, codigo: '56789012', descricao: 'Materiais de Construção', taxa: 0.04 }
  ];

  // Carregar códigos pautais
  useEffect(() => {
    setLoadingCodigos(true);
    
    const useMockData = () => {
      console.log('Usando dados de exemplo para códigos pautais');
      toast.warning('Usando dados de exemplo para códigos pautais.');
      setCodigosPautais(mockCodigosPautais);
      setLoadingCodigos(false);
    };
    
    fetch('/api/codigos-pautais')
      .then(res => {
        if (!res.ok) {
          // Se o servidor retornar um erro, usamos dados de exemplo
          if (res.status === 500) {
            console.log('Servidor retornou erro 500');
            useMockData();
            return null;
          }
          throw new Error(`Erro na API: ${res.status}`);
        }
        return res.text();
      })
      .then(text => {
        if (text === null) return; // Já tratado acima
        
        // Check if response is empty
        if (!text) {
          console.log('Resposta vazia da API de códigos pautais');
          useMockData();
          return;
        }
        
        try {
          const data = JSON.parse(text);
          console.log('Códigos pautais carregados:', data);
          setCodigosPautais(data);
        } catch (e) {
          console.error('Erro ao analisar JSON de códigos pautais:', e, 'Texto recebido:', text);
          useMockData();
        }
      })
      .catch(err => {
        console.error('Erro ao carregar códigos pautais:', err);
        useMockData();
      })
      .finally(() => setLoadingCodigos(false));
  }, []);

  const tipos = ['Importações', 'Exportações', 'Re-exportações'];
  const estados = ['Aprovado', 'Rejeitado', 'Pendente'];
  const rupeOptions = ['Disponível', 'Sem RUPE'];

  function calcularTaxa(valor: number): number {
    if (valor <= 6226000) return 0.006;
    if (valor <= 25000000) return 0.004;
    if (valor <= 62480000) return 0.003;
    if (valor <= 249040000) return 0.002;
    return 0.0018;
  }

  function formatarValor(valor: number, moeda: string) {
    if (!moeda) return valor.toLocaleString("pt-AO");
    
    const formatConfig: { [key: string]: { locale: string, currency: string } } = {
      AKZ: { locale: "pt-AO", currency: "AOA" },
      USD: { locale: "en-US", currency: "USD" },
      EUR: { locale: "de-DE", currency: "EUR" }
    };

    const config = formatConfig[moeda];
    if (!config) return valor.toLocaleString();

    return valor.toLocaleString(config.locale, { 
      style: "currency", 
      currency: config.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function TotalAutorizacao({ codigos, quantidades, precos, moeda }: { codigos: { id: number, codigo: string }[]; quantidades: number[]; precos: number[]; moeda: string }) {
    // Encontrar a moeda selecionada
    const moedaSelecionada = moedas.find(m => m.id.toString() === moeda);
    if (!moedaSelecionada) return null;

    // Calcular total bruto na moeda original
    let totalOriginal = 0;
    for (let i = 0; i < codigos.length; i++) {
      if (!codigos[i] || !codigos[i].id) continue;
      const qtd = Number(quantidades[i]);
      const preco = Number(precos[i]);
      if (!isNaN(qtd) && !isNaN(preco)) {
        totalOriginal += qtd * preco;
      }
    }

    // Converter para Kwanzas usando a taxa de câmbio
    const totalKz = totalOriginal * moedaSelecionada.taxaCambio;
    
    // Calcular a taxa sobre o valor em Kwanzas
    const taxa = calcularTaxa(totalKz);
    let totalCobrar = totalKz * taxa;
    
    // Aplicar valor mínimo se necessário
    let minAplicado = false;
    if (totalCobrar < 2000) {
      totalCobrar = 2000;
      minAplicado = true;
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">Valor Original:</span>
          <span className="text-lg font-mono">
            {formatarValor(totalOriginal, moedaSelecionada.simbolo)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">Valor em Kwanzas:</span>
          <span className="text-lg font-mono">
            {formatarValor(totalKz, 'AKZ')}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">Taxa a Pagar:</span>
          <span className="text-lg font-mono text-lime-900">
            {formatarValor(totalCobrar, 'AKZ')}
          </span>
          <span className="text-xs text-gray-500">
            {(taxa * 100).toFixed(2)}% sobre {formatarValor(totalKz, 'AKZ')}
          </span>
          {minAplicado && (
            <span className="text-xs text-orange-600">Valor mínimo aplicado: 2.000 Kz</span>
          )}
        </div>
      </div>
    );
  }

  // Filtro simples
  const filteredData = Array.isArray(autorizacoes) ? autorizacoes.filter(item => {
    // Ajuste os campos conforme os dados reais
    const rupe = item.rupeReferencia ? 'Disponível' : 'Sem RUPE';
    return (
      (filters.tipo ? item.tipo === filters.tipo : true) &&
      (filters.estado ? item.status === filters.estado : true) &&
      (filters.rupe ? rupe === filters.rupe : true) &&
      (filters.search ? `PA-${String(item.id).padStart(6, "0")}`.includes(filters.search) : true)
    );
  }) : [];

  // Add/Remove múltiplos códigos
  const handleAddCodigoPautal = () => {
    setForm({
      ...form,
      codigos: [...form.codigos, { id: 0, codigo: '' }],
      quantidades: [...form.quantidades, 1],
      precos: [...form.precos, 0]
    });
  };

  const handleRemoveCodigo = (idx: number) => {
    const codigos = form.codigos.filter((_, i) => i !== idx);
    const quantidades = form.quantidades.filter((_, i) => i !== idx);
    const precos = form.precos.filter((_, i) => i !== idx);
    setForm({ ...form, codigos, quantidades, precos });
  };

  // Modal Step 1 (SEM RUPE)
  const Step1 = (
    <div className="max-w-xl mx-auto">
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
    <div className="rounded-2xl shadow-2xl bg-white/95 border border-lime-100 p-6 max-w-3xl mx-auto animate-modal-pop">
      <h2 className="text-lg font-semibold mb-4 text-lime-800 tracking-tight">Informações do Produto</h2>
      {form.codigos.map((codigo, idx) => (
        <div key={idx} className="flex flex-col md:flex-row gap-2 mb-6 md:mb-3 md:items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Código Pautal</label>
            <Select
              value={codigo.id ? codigo.id.toString() : ''}
              onValueChange={(value) => {
                const selectedCodigo = codigosPautais.find(cp => cp.id.toString() === value);
                if (selectedCodigo) {
                  const newCodigos = [...form.codigos];
                  newCodigos[idx] = { id: selectedCodigo.id, codigo: selectedCodigo.codigo };
                  setForm({ ...form, codigos: newCodigos });
                }
              }}
              disabled={loadingCodigos}
            >
              <SelectTrigger className="w-full md:w-80">
                <SelectValue 
                  placeholder={loadingCodigos ? "Carregando..." : "Selecione o código"} 
                />
              </SelectTrigger>
              <SelectContent>
                {codigosPautais.map((cp) => (
                  <SelectItem key={cp.id} value={cp.id.toString()}>
                    {cp.codigo} - {cp.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantidade</label>
            <Input
              type="number"
              value={form.quantidades[idx] || ''}
              onChange={e => {
                const quantidades = [...form.quantidades];
                quantidades[idx] = Number(e.target.value);
                setForm({ ...form, quantidades });
              }}
              className="w-full md:w-32"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preço Unitário</label>
            <Input
              type="number"
              value={form.precos[idx] || ''}
              onChange={e => {
                const precos = [...form.precos];
                precos[idx] = Number(e.target.value);
                setForm({ ...form, precos });
              }}
              className="w-full md:w-40"
              min={0}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveCodigo(idx)}
            className="text-red-500 self-end mt-2 md:mt-0"
            title="Remover"
          >
            ×
          </Button>
        </div>
      ))}
      <Button variant="link" className="text-lime-700 mb-4" onClick={handleAddCodigoPautal}>
        + Adicionar Código
      </Button>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Moeda</label>
        <Select 
          value={form.moeda?.toString() || ''} 
          onValueChange={(value) => setForm({ ...form, moeda: value })}
          disabled={loadingMoedas}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loadingMoedas ? "Carregando..." : "Selecione a moeda"} />
          </SelectTrigger>
          <SelectContent>
            {moedas.map((moeda) => (
              <SelectItem key={moeda.id} value={moeda.id.toString()}>
                {moeda.nome} ({moeda.simbolo})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Número da Factura</label>
        <Input
          type="text"
          value={form.numeroFactura}
          onChange={(e) => setForm({ ...form, numeroFactura: e.target.value })}
          placeholder="Digite o número da factura"
          className="w-full"
        />
      </div>

      {form.moeda && (
        <div className="mb-4 p-4 bg-lime-50 border border-lime-200 rounded-xl">
          <label className="block text-sm font-bold mb-1 text-lime-800">Total a Pagar pela Autorização</label>
          <TotalAutorizacao 
            codigos={form.codigos} 
            quantidades={form.quantidades.map(Number)} 
            precos={form.precos.map(Number)} 
            moeda={form.moeda || '0'} 
          />
        </div>
      )}

      <Button
        className="w-full bg-lime-600 text-white rounded-lg font-semibold shadow hover:bg-lime-700 transition"
        onClick={() => setStep(3)}
        disabled={!form.codigos.every(c => c.id !== 0) || !form.moeda}
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

  const handleSubmit = async () => {
    if (!validateDocs()) return;

    // Verificar se o utente está identificado antes de começar
    const utenteId = localStorage.getItem('utenteId');
    if (!utenteId) {
      alert('Sessão expirada. Por favor, faça login novamente.');
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    try {
      // Criar FormData para enviar arquivos
      const formData = new FormData();
      formData.append('tipo', form.tipo);
      if (form.moeda === null) {
        toast.error('Por favor, selecione uma moeda');
        return;
      }
      if (!form.numeroFactura.trim()) {
        toast.error('Por favor, digite o número da factura');
        return;
      }
      formData.append('moeda', form.moeda.toString());
      formData.append('utenteId', utenteId);
      formData.append('numeroFactura', form.numeroFactura);
      
      // Adicionar itens (códigos, quantidades e preços)
      formData.append('itens', JSON.stringify(form.codigos.map((c, i) => ({
        codigoPautalId: c.id,
        quantidade: Number(form.quantidades[i]),
        precoUnitario: Number(form.precos[i])
      }))));

      // Adicionar documentos
      if (form.documentos.carta) formData.append('carta', form.documentos.carta);
      if (form.documentos.factura) formData.append('factura', form.documentos.factura);
      if (form.documentos.comprovativo) formData.append('comprovativo', form.documentos.comprovativo);
      if (form.documentos.especificacao) formData.append('especificacao', form.documentos.especificacao);
      form.documentos.fotos?.forEach((foto, i) => {
        formData.append(`fotos`, foto);
      });

      // Enviar solicitação
      const response = await fetch('/api/solicitacao', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar solicitação');
      }

      // Atualizar lista de autorizações
      const autorizacoesRes = await fetch(`/api/solicitacao?utenteId=${utenteId}`);
      const autorizacoesData = await autorizacoesRes.json();
      setAutorizacoes(autorizacoesData);

      // Fechar modal e resetar form
      setShowModal(false);
      setForm(initialFormState);
      setStep(1);

      // Mostrar mensagem de sucesso
      alert('Solicitação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      alert(error instanceof Error ? error.message : 'Erro ao enviar solicitação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const Step3 = (
    <div className="max-w-2xl mx-auto">
      <p className="text-gray-600 mb-4">Carregue os documentos necessários para a solicitação de autorização.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Carta de Solicitação */}
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:border-lime-200 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">Carta de Solicitação</h3>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Obrigatório</Badge>
          </div>
          
          <div className="relative">
            <Input 
              type="file" 
              accept="application/pdf,image/*" 
              onChange={e => handleDocChange('carta', e.target.files?.[0])} 
              className={`border-2 ${form.documentos.carta ? 'border-lime-300 bg-lime-50' : docErrors.carta ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            />
            {form.documentos.carta && (
              <div className="absolute right-2 top-2 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
            )}
          </div>
          
          {docErrors.carta && <span className="text-xs text-red-500 mt-1 block">{docErrors.carta}</span>}
          <p className="text-xs text-gray-500 mt-2">Formato: PDF ou imagem</p>
        </div>
        
        {/* Factura Recibo */}
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:border-lime-200 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">Factura Recibo</h3>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Obrigatório</Badge>
          </div>
          
          <div className="relative">
            <Input 
              type="file" 
              accept="application/pdf" 
              onChange={e => handleDocChange('factura', e.target.files?.[0])} 
              className={`border-2 ${form.documentos.factura ? 'border-lime-300 bg-lime-50' : docErrors.factura ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            />
            {form.documentos.factura && (
              <div className="absolute right-2 top-2 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
            )}
          </div>
          
          {docErrors.factura && <span className="text-xs text-red-500 mt-1 block">{docErrors.factura}</span>}
          <p className="text-xs text-gray-500 mt-2">Formato: apenas PDF</p>
        </div>
        
        {/* Comprovativo de Pagamento */}
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:border-lime-200 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">Comprovativo</h3>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Obrigatório</Badge>
          </div>
          
          <div className="relative">
            <Input 
              type="file" 
              accept="application/pdf,image/*" 
              onChange={e => handleDocChange('comprovativo', e.target.files?.[0])} 
              className={`border-2 ${form.documentos.comprovativo ? 'border-lime-300 bg-lime-50' : docErrors.comprovativo ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            />
            {form.documentos.comprovativo && (
              <div className="absolute right-2 top-2 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
            )}
          </div>
          
          {docErrors.comprovativo && <span className="text-xs text-red-500 mt-1 block">{docErrors.comprovativo}</span>}
          <p className="text-xs text-gray-500 mt-2">Formato: PDF ou imagem</p>
        </div>
        
        {/* Especificação Técnica */}
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:border-lime-200 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">Especificação Técnica</h3>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Obrigatório</Badge>
          </div>
          
          <div className="relative">
            <Input 
              type="file" 
              accept="application/pdf,image/*" 
              onChange={e => handleDocChange('especificacao', e.target.files?.[0])} 
              className={`border-2 ${form.documentos.especificacao ? 'border-lime-300 bg-lime-50' : docErrors.especificacao ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            />
            {form.documentos.especificacao && (
              <div className="absolute right-2 top-2 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
            )}
          </div>
          
          {docErrors.especificacao && <span className="text-xs text-red-500 mt-1 block">{docErrors.especificacao}</span>}
          <p className="text-xs text-gray-500 mt-2">Formato: PDF ou imagem</p>
        </div>
      </div>
      
      {/* Fotos do Produto */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:border-lime-200 transition-all duration-200 hover:shadow-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800">Fotos do Produto</h3>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Obrigatório</Badge>
        </div>
        
        <div className="relative">
          <Input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={e => handleFotosChange(e.target.files)} 
            className={`border-2 ${form.documentos.fotos?.length ? 'border-lime-300 bg-lime-50' : docErrors.fotos ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
          />
          {form.documentos.fotos?.length > 0 && (
            <div className="absolute right-2 top-2 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          )}
        </div>
        
        {docErrors.fotos && <span className="text-xs text-red-500 mt-1 block">{docErrors.fotos}</span>}
        <p className="text-xs text-gray-500 mt-2">Selecione uma ou mais fotos do produto</p>
        
        {form.documentos.fotos?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-green-600 font-medium">{form.documentos.fotos.length} {form.documentos.fotos.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}</p>
          </div>
        )}
      </div>
      <Button
        className="w-full bg-lime-600 text-white rounded-lg font-semibold shadow hover:bg-lime-700 transition"
        onClick={handleSubmit}
        disabled={loading || !form.documentos.carta || !form.documentos.factura || form.documentos.factura?.type !== 'application/pdf' || !form.documentos.comprovativo || !form.documentos.especificacao || !form.documentos.fotos || form.documentos.fotos.length === 0}
      >
        {loading ? 'Enviando...' : 'Solicitar Autorização'}
      </Button>
    </div>
  );

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Modal fundo escuro e centralização absoluta */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            // Resetar o formulário quando fechar o modal
            setForm(initialFormState);
            setStep(1);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? 'Tipo de Autorização' : step === 2 ? 'Informações do Produto' : 'Envio de Documentos'}
            </DialogTitle>
          </DialogHeader>
          {step === 1 ? Step1 : step === 2 ? Step2 : step === 3 ? Step3 : null}
        </DialogContent>
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
          {filteredData.map(item => {
            const numero = `PA-${String(item.id).padStart(6, '0')}`;
            const rupe = item.rupeReferencia ? 'Disponível' : 'Sem RUPE';
            let badgeVariant: 'default' | 'secondary' | 'destructive' = 'secondary';
            if (item.status === 'Aprovado') badgeVariant = 'default';
            else if (item.status === 'Rejeitado') badgeVariant = 'destructive';
            return (
              <TableRow key={item.id} className="hover:bg-base-100 transition">
                <TableCell className="font-mono">{numero}</TableCell>
                <TableCell>{item.tipo}</TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={badgeVariant} className="flex items-center gap-1 px-2">
                    {item.status === 'Aprovado' && <CheckCircle className="text-green-600" size={16} />}
                    {item.status === 'Pendente' && <Clock className="text-yellow-500" size={16} />}
                    {item.status === 'Rejeitado' && <XCircle className="text-white-500" size={16} />}
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={rupe === 'Disponível' ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                    {rupe === 'Disponível' && <CheckCircle className="text-green-600" size={16} />}
                    {rupe === 'Sem RUPE' && <XCircle className="text-red-500" size={16} />}
                    {rupe !== 'Disponível' && rupe !== 'Sem RUPE' && <Clock className="text-yellow-500" size={16} />}
                    {rupe}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setLoading(true);
                      router.push(`/utente/ut_autorizacao/${item.id}`);
                    }}>
                      <Eye className="text-green-600" size={16} /> Ver Processo
                    </Button>
                  </Badge>
                  {item.status === 'Aprovado' && (
                    <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
                      <Button size="sm" variant="ghost">
                        <Download className="text-lime-700" size={16} /> Baixar
                      </Button>
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
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
