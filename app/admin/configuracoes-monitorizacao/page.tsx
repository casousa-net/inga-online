'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { ToastContainer } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Plus, Calendar, User, Clock } from 'lucide-react';

type Utente = {
  id: number;
  nome: string;
  nif: string;
  email: string;
};

type ConfiguracaoMonitorizacao = {
  id: number;
  utenteId: number;
  tipoPeriodo: string;
  dataInicio: string;
  utente: {
    nome: string;
    nif: string;
  };
  periodos: {
    id: number;
    numeroPeriodo: number;
    dataInicio: string;
    dataFim: string;
    estado: string;
  }[];
};

export default function ConfiguracoesMonitorizacaoPage() {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoMonitorizacao[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedUtente, setSelectedUtente] = useState<Utente | null>(null);
  const [formData, setFormData] = useState({
    utenteId: '',
    tipoPeriodo: 'ANUAL',
    dataInicio: new Date().toISOString().split('T')[0]
  });

  // Carregar utentes e configurações
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Carregar utentes
        console.log('Buscando utentes...');
        const resUtentes = await fetch('/api/usuarios?role=utente');
        if (!resUtentes.ok) {
          const errorText = await resUtentes.text();
          console.error('Erro na resposta da API:', errorText);
          throw new Error(`Erro ao carregar utentes: ${resUtentes.status} ${resUtentes.statusText}`);
        }
        
        const dataUtentes = await resUtentes.json();
        console.log('Utentes recebidos:', dataUtentes);
        
        if (!Array.isArray(dataUtentes)) {
          console.error('Dados recebidos não são um array:', dataUtentes);
          throw new Error('Formato de dados inválido: esperado um array de utentes');
        }
        
        setUtentes(dataUtentes);

        // Carregar configurações
        console.log('Buscando configurações...');
        const resConfiguracoes = await fetch('/api/monitorizacao/configuracoes');
        if (!resConfiguracoes.ok) {
          const errorText = await resConfiguracoes.text();
          console.error('Erro na resposta da API de configurações:', errorText);
          throw new Error(`Erro ao carregar configurações: ${resConfiguracoes.status} ${resConfiguracoes.statusText}`);
        }
        
        const dataConfiguracoes = await resConfiguracoes.json();
        console.log('Configurações recebidas:', dataConfiguracoes);
        
        if (!Array.isArray(dataConfiguracoes)) {
          console.error('Dados de configuração não são um array:', dataConfiguracoes);
          throw new Error('Formato de dados inválido: esperado um array de configurações');
        }
        
        setConfiguracoes(dataConfiguracoes);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('Erro ao carregar dados:', err);
        setError(`Erro ao carregar dados: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar utentes com base na busca
  const filteredUtentes = utentes.filter(utente => 
    utente.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    utente.nif.includes(searchTerm) ||
    utente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar se utente já tem configuração
  const utenteTemConfiguracao = (utenteId: number) => {
    return configuracoes.some(config => config.utenteId === utenteId);
  };

  // Selecionar utente para configuração
  const handleSelectUtente = (utente: Utente) => {
    setSelectedUtente(utente);
    setFormData({
      ...formData,
      utenteId: utente.id.toString()
    });
    setShowForm(true);
  };

  // Atualizar dados do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Criar nova configuração
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/monitorizacao/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utenteId: parseInt(formData.utenteId),
          tipoPeriodo: formData.tipoPeriodo,
          dataInicio: formData.dataInicio
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar configuração');
      }

      const data = await response.json();
      
      // Atualizar lista de configurações
      setConfiguracoes([...configuracoes, {
        ...data.configuracao,
        periodos: data.periodos,
        utente: {
          nome: selectedUtente?.nome || '',
          nif: selectedUtente?.nif || ''
        }
      }]);

      toast({
        title: 'Sucesso',
        description: 'Configuração de monitorização criada com sucesso',
      });

      // Resetar formulário
      setShowForm(false);
      setSelectedUtente(null);
      setFormData({
        utenteId: '',
        tipoPeriodo: 'ANUAL',
        dataInicio: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !showForm) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configurações de Monitorização</h1>
        <Button className="bg-lime-500 hover:bg-lime-600" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedUtente 
                ? `Configurar Monitorização para ${selectedUtente.nome}`
                : 'Nova Configuração de Monitorização'}
            </h2>

            {!selectedUtente ? (
              <div className="mb-6">
                <Label htmlFor="search">Buscar Utente</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    id="search"
                    placeholder="Nome, NIF ou email"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="mt-4 max-h-60 overflow-y-auto border rounded-md">
                  {filteredUtentes.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhum utente encontrado
                    </div>
                  ) : (
                    filteredUtentes.map(utente => (
                      <div 
                        key={utente.id}
                        className={`p-3 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50 ${
                          utenteTemConfiguracao(utente.id) ? 'opacity-50' : ''
                        }`}
                        onClick={() => !utenteTemConfiguracao(utente.id) && handleSelectUtente(utente)}
                      >
                        <div>
                          <div className="font-medium">{utente.nome}</div>
                          <div className="text-sm text-gray-500">NIF: {utente.nif}</div>
                        </div>
                        {utenteTemConfiguracao(utente.id) ? (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            Já configurado
                          </span>
                        ) : (
                          <Button size="sm" variant="outline">Selecionar</Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-md">
                  <User className="h-5 w-5 mr-2 text-gray-500" />
                  <div>
                    <div className="font-medium">{selectedUtente.nome}</div>
                    <div className="text-sm text-gray-500">NIF: {selectedUtente.nif}</div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto"
                    onClick={() => {
                      setSelectedUtente(null);
                      setFormData({...formData, utenteId: ''});
                    }}
                  >
                    Alterar
                  </Button>
                </div>

                <div>
                  <Label htmlFor="tipoPeriodo">Tipo de Período</Label>
                  <select 
                    id="tipoPeriodo"
                    name="tipoPeriodo"
                    value={formData.tipoPeriodo}
                    onChange={handleFormChange}
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option value="ANUAL">Anual</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input 
                      id="dataInicio"
                      name="dataInicio"
                      type="date"
                      className="pl-8"
                      value={formData.dataInicio}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-1/2"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedUtente(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-1/2" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Configuração'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {configuracoes.length === 0 ? (
          <div className="col-span-2 text-center p-8 border rounded-md bg-gray-50">
            <p className="text-gray-500">Nenhuma configuração de monitorização encontrada</p>
          </div>
        ) : (
          configuracoes.map(config => (
            <Card key={config.id} className="overflow-hidden">
              <div className="bg-lime-50 p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{config.utente.nome}</h3>
                    <p className="text-sm text-gray-600">NIF: {config.utente.nif}</p>
                  </div>
                  <div className="bg-white px-3 py-1 rounded-full text-xs font-medium border">
                    {config.tipoPeriodo === 'ANUAL' ? 'Anual' : 
                     config.tipoPeriodo === 'SEMESTRAL' ? 'Semestral' : 'Trimestral'}
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center mb-3 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Início: {(() => {
  const d = new Date(config.dataInicio);
  return isNaN(d.getTime()) ? 'Data inválida' : format(d, 'dd/MM/yyyy', { locale: ptBR });
})()}</span>
                </div>
                
                <h4 className="font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Períodos
                </h4>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {config.periodos.map((periodo, index) => (
                    <div key={`${config.id}-${periodo.id}-${index}`} className="text-sm p-2 border rounded flex justify-between items-center">
                      <div>
                        <div>Período {periodo.numeroPeriodo}</div>
                        <div className="text-xs text-gray-500">
                          {(() => {
  const di = new Date(periodo.dataInicio);
  const df = new Date(periodo.dataFim);
  const inicio = isNaN(di.getTime()) ? 'Data inválida' : format(di, 'dd/MM/yyyy', { locale: ptBR });
  const fim = isNaN(df.getTime()) ? 'Data inválida' : format(df, 'dd/MM/yyyy', { locale: ptBR });
  return `${inicio} a ${fim}`;
})()}
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        periodo.estado === 'ABERTO' ? 'bg-green-100 text-green-800' :
                        periodo.estado === 'FECHADO' ? 'bg-red-100 text-red-800' :
                        periodo.estado === 'AGUARDANDO_REAVALIACAO' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {periodo.estado === 'ABERTO' ? 'Aberto' :
                         periodo.estado === 'FECHADO' ? 'Fechado' :
                         periodo.estado === 'AGUARDANDO_REAVALIACAO' ? 'Aguardando Reavaliação' :
                         'Reabertura Solicitada'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
