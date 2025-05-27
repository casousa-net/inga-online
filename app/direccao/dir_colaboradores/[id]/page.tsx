'use client';
import { useState, useEffect } from 'react';
import { Loader2, Mail, Phone, Calendar, Building, UserCog, Users, Briefcase, ChevronDown, ArrowLeft, FileText, History } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { useRouter, useParams } from 'next/navigation';

type HistoricoNivel = {
  id: number;
  nivel: string;
  area: string;
  dataAlteracao: string;
  motivoAlteracao: string;
};

type Processo = {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Colaborador = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  nivel: string;
  area: string;
  estado: string;
  createdAt: string;
  processos: Processo[];
  historicoNiveis: HistoricoNivel[];
};

export default function ColaboradorDetalhesPage() {
  const params = useParams();
  const id = params?.id as string;
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [novoNivel, setNovoNivel] = useState('');
  const [novaArea, setNovaArea] = useState('');
  const [motivoAlteracao, setMotivoAlteracao] = useState('');
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchColaborador = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/usuarios/colaboradores/${id}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar dados do colaborador');
        }
        
        const data = await response.json();
        setColaborador(data);
        setNovoNivel(data.nivel);
        setNovaArea(data.area);
      } catch (err) {
        console.error('Erro ao buscar colaborador:', err);
        setError('Falha ao carregar os dados do colaborador. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchColaborador();
    }
  }, [id]);

  const handleUpdateColaborador = async () => {
    if (!id) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/usuarios/colaboradores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nivel: novoNivel,
          area: novaArea,
          motivoAlteracao,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar colaborador');
      }

      // Recarregar os dados do colaborador
      const responseGet = await fetch(`/api/usuarios/colaboradores/${id}`);
      const data = await responseGet.json();
      setColaborador(data);
      setShowEditForm(false);
      setMotivoAlteracao('');
    } catch (err) {
      console.error('Erro ao atualizar colaborador:', err);
      setError('Falha ao atualizar os dados. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-lime-600 mb-4" />
        <p className="text-gray-500">Carregando dados do colaborador...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center max-w-md">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg text-center max-w-md">
          <p>Colaborador não encontrado.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/direccao/dir_colaboradores')}
          >
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-sm">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-gray-600 hover:text-gray-900"
          onClick={() => router.push('/direccao/dir_colaboradores')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista
        </Button>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{colaborador.nome}</h1>
                <Badge variant={colaborador.estado === "Ativo" ? "default" : "secondary"} className="text-sm">
                  {colaborador.estado}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{colaborador.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{colaborador.telefone || 'Não informado'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Registrado em {new Date(colaborador.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  {colaborador.nivel === "Chefe de Departamento" ? (
                    <UserCog className="h-4 w-4 text-blue-700" />
                  ) : colaborador.nivel === "Direção" ? (
                    <Users className="h-4 w-4 text-lime-700" />
                  ) : (
                    <Briefcase className="h-4 w-4 text-gray-400" />
                  )}
                  <span>{colaborador.nivel}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>{colaborador.area}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditForm(!showEditForm)}
                  className="mt-2"
                >
                  {showEditForm ? 'Cancelar Edição' : 'Alterar Nível/Área'}
                </Button>
              </div>
            </div>

            {/* Formulário de Edição */}
            {showEditForm && (
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Alterar Nível e Área</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Novo Nível</label>
                    <select
                      value={novoNivel}
                      onChange={(e) => setNovoNivel(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="Tecnico">Técnico</option>
                      <option value="Chefe de Departamento">Chefe de Departamento</option>
                      <option value="Direção">Direção</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nova Área</label>
                    <select
                      value={novaArea}
                      onChange={(e) => setNovaArea(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="Autorização">Autorização</option>
                      <option value="Monitorizacao">Monitorizacao</option>
                      <option value="Espaços Verdes">Espaços Verdes</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Motivo da Alteração</label>
                  <textarea
                    value={motivoAlteracao}
                    onChange={(e) => setMotivoAlteracao(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="Descreva o motivo da alteração..."
                  />
                </div>
                <Button
                  onClick={handleUpdateColaborador}
                  disabled={updating || !motivoAlteracao}
                  className="w-full"
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Histórico de Processos */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-lime-600" />
              Histórico de Processos
            </h2>
            {colaborador.processos.length === 0 ? (
              <p className="text-gray-500">Nenhum processo encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-2 px-4">ID</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-left py-2 px-4">Data de Criação</th>
                      <th className="text-left py-2 px-4">Última Atualização</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colaborador.processos.map((processo) => (
                      <tr key={processo.id} className="border-t">
                        <td className="py-2 px-4">{processo.id}</td>
                        <td className="py-2 px-4">
                          <Badge variant="outline">{processo.status}</Badge>
                        </td>
                        <td className="py-2 px-4">{new Date(processo.createdAt).toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-4">{new Date(processo.updatedAt).toLocaleString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Histórico de Níveis */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-lime-600" />
              Histórico de Níveis
            </h2>
            {colaborador.historicoNiveis.length === 0 ? (
              <p className="text-gray-500">Nenhuma alteração de nível registrada.</p>
            ) : (
              <div className="space-y-4">
                {colaborador.historicoNiveis.map((historico) => (
                  <div key={historico.id} className="border-l-4 border-lime-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{historico.nivel}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{historico.area}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Motivo: {historico.motivoAlteracao}</p>
                      <p>Data: {new Date(historico.dataAlteracao).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
