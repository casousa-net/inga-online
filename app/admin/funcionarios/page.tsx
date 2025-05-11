'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Pencil, Trash2, Save, X, Plus, Search, Shield } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type Funcionario = {
  id: number;
  nome: string;
  email: string;
  nif: string;
  telefone: string;
  endereco: string;
  role: 'direccao' | 'chefe' | 'tecnico';
  createdAt: string;
  updatedAt: string;
  departamento?: string;
};

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    nif: '',
    telefone: '',
    endereco: '',
    role: 'tecnico' as 'tecnico' | 'chefe' | 'direccao',
    senha: '',
    departamento: ''
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFuncionarios, setFilteredFuncionarios] = useState<Funcionario[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Carregar funcionários
  useEffect(() => {
    fetchFuncionarios();
  }, []);

  // Filtrar funcionários quando o termo de busca ou filtro de role mudar
  useEffect(() => {
    let filtered = [...funcionarios];
    
    // Filtrar por termo de busca
    if (searchTerm.trim() !== '') {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        funcionario => 
          funcionario.nome.toLowerCase().includes(lowercaseSearch) || 
          funcionario.email.toLowerCase().includes(lowercaseSearch) ||
          funcionario.nif.includes(searchTerm) ||
          (funcionario.departamento && funcionario.departamento.toLowerCase().includes(lowercaseSearch))
      );
    }
    
    // Filtrar por role
    if (roleFilter !== 'all' && roleFilter !== '') {
      filtered = filtered.filter(funcionario => funcionario.role === roleFilter);
    }
    
    setFilteredFuncionarios(filtered);
  }, [searchTerm, roleFilter, funcionarios]);

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      // Buscar apenas funcionários (não utentes)
      const response = await fetch('/api/usuarios?funcionariosOnly=true');
      const data = await response.json();
      setFuncionarios(data);
      setFilteredFuncionarios(data);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Adicionar funcionário
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar funcionário');
      }

      // Recarregar funcionários
      fetchFuncionarios();
      
      // Limpar formulário e fechar diálogo
      setFormData({
        nome: '',
        email: '',
        nif: '',
        telefone: '',
        endereco: '',
        role: 'tecnico',
        senha: '',
        departamento: ''
      });
      setShowAddDialog(false);
      
      toast({
        title: "Sucesso",
        description: "Funcionário adicionado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao adicionar funcionário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o funcionário.",
        variant: "destructive"
      });
    }
  };

  // Atualizar funcionário
  const handleUpdateSubmit = async (id: number) => {
    try {
      const funcionarioToUpdate = funcionarios.find(f => f.id === id);
      if (!funcionarioToUpdate) return;

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: funcionarioToUpdate.nome,
          email: funcionarioToUpdate.email,
          nif: funcionarioToUpdate.nif,
          telefone: funcionarioToUpdate.telefone,
          endereco: funcionarioToUpdate.endereco,
          role: funcionarioToUpdate.role,
          departamento: funcionarioToUpdate.departamento
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar funcionário');
      }

      setEditingId(null);
      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar funcionário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o funcionário.",
        variant: "destructive"
      });
    }
  };

  // Excluir funcionário
  const handleDelete = async () => {
    if (!funcionarioToDelete) return;
    
    try {
      const response = await fetch(`/api/usuarios/${funcionarioToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir funcionário');
      }

      // Atualizar lista de funcionários
      setFuncionarios(prev => prev.filter(f => f.id !== funcionarioToDelete));
      setFilteredFuncionarios(prev => prev.filter(f => f.id !== funcionarioToDelete));
      
      setShowDeleteDialog(false);
      setFuncionarioToDelete(null);
      
      toast({
        title: "Sucesso",
        description: "Funcionário excluído com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao excluir funcionário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o funcionário.",
        variant: "destructive"
      });
    }
  };

  const handleFieldChange = (id: number, field: keyof Funcionario, value: string) => {
    setFuncionarios(prev => 
      prev.map(f => 
        f.id === id 
          ? { ...f, [field]: value } 
          : f
      )
    );
    
    setFilteredFuncionarios(prev => 
      prev.map(f => 
        f.id === id 
          ? { ...f, [field]: value } 
          : f
      )
    );
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'direccao':
        return <Badge className="bg-purple-600">Direção</Badge>;
      case 'chefe':
        return <Badge className="bg-blue-600">Chefe</Badge>;
      case 'tecnico':
        return <Badge className="bg-green-600">Técnico</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };
  
  const getDepartamentoBadge = (departamento?: string) => {
    if (!departamento) return '-';
    
    switch(departamento) {
      case 'autorizacao':
        return <Badge className="bg-amber-600">Autorização</Badge>;
      case 'monitorizacao':
        return <Badge className="bg-cyan-600">Monitorização</Badge>;
      case 'espacos-verdes':
        return <Badge className="bg-emerald-600">Espaços Verdes</Badge>;
      case 'todos':
        return <Badge className="bg-indigo-600">Todos os Processos</Badge>;
      default:
        return departamento;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: pt });
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Gestão de Funcionários</h1>
          <p className="text-gray-500 mt-1">Gerencie os funcionários do sistema (Técnicos, Chefes e Direção)</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-lime-600 hover:bg-lime-700 text-white">
                <Plus size={16} className="mr-2" /> Adicionar Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="nome" className="text-sm font-medium">Nome Completo</label>
                  <Input 
                    id="nome" 
                    value={formData.nome} 
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome completo" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input 
                    id="email" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemplo.com" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="nif" className="text-sm font-medium">NIF</label>
                  <Input 
                    id="nif" 
                    value={formData.nif} 
                    onChange={(e) => setFormData({...formData, nif: e.target.value})}
                    placeholder="Número de Identificação Fiscal" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="telefone" className="text-sm font-medium">Telefone</label>
                  <Input 
                    id="telefone" 
                    value={formData.telefone} 
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="Número de telefone" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="endereco" className="text-sm font-medium">Endereço</label>
                  <Input 
                    id="endereco" 
                    value={formData.endereco} 
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Endereço completo" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium">Função</label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({...formData, role: value as 'direccao' | 'chefe' | 'tecnico'})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="chefe">Chefe</SelectItem>
                      <SelectItem value="direccao">Direção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="departamento" className="text-sm font-medium">Departamento (Tipo de Processo)</label>
                  <Select 
                    value={formData.departamento || ''} 
                    onValueChange={(value) => setFormData({...formData, departamento: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de processo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="autorizacao">Autorização</SelectItem>
                      <SelectItem value="monitorizacao">Monitorização</SelectItem>
                      <SelectItem value="espacos-verdes">Espaços Verdes</SelectItem>
                      <SelectItem value="todos">Todos os Processos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="senha" className="text-sm font-medium">Senha</label>
                  <Input 
                    id="senha" 
                    type="password"
                    value={formData.senha} 
                    onChange={(e) => setFormData({...formData, senha: e.target.value})}
                    placeholder="Senha" 
                    required
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 mt-4">
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" className="bg-lime-600 hover:bg-lime-700">Salvar</Button>
                  </DialogFooter>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar por nome, email, NIF ou departamento..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select 
              value={roleFilter} 
              onValueChange={setRoleFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="chefe">Chefe</SelectItem>
                <SelectItem value="direccao">Direção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-700"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>NIF</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Departamento</TableHead>

                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum funcionário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFuncionarios.map((funcionario) => (
                    <TableRow key={funcionario.id}>
                      <TableCell>
                        {editingId === funcionario.id ? (
                          <Input 
                            value={funcionario.nome} 
                            onChange={(e) => handleFieldChange(funcionario.id, 'nome', e.target.value)}
                            className="max-w-[200px]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            {funcionario.nome}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === funcionario.id ? (
                          <Input 
                            value={funcionario.email} 
                            onChange={(e) => handleFieldChange(funcionario.id, 'email', e.target.value)}
                            className="max-w-[200px]"
                          />
                        ) : (
                          funcionario.email
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === funcionario.id ? (
                          <Input 
                            value={funcionario.nif} 
                            onChange={(e) => handleFieldChange(funcionario.id, 'nif', e.target.value)}
                            className="max-w-[120px]"
                          />
                        ) : (
                          funcionario.nif
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === funcionario.id ? (
                          <Select 
                            value={funcionario.role} 
                            onValueChange={(value) => handleFieldChange(funcionario.id, 'role', value as 'direccao' | 'chefe' | 'tecnico')}
                          >
                            <SelectTrigger className="max-w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tecnico">Técnico</SelectItem>
                              <SelectItem value="chefe">Chefe</SelectItem>
                              <SelectItem value="direccao">Direção</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getRoleBadge(funcionario.role)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === funcionario.id ? (
                          <Select 
                            value={funcionario.departamento || ''} 
                            onValueChange={(value) => handleFieldChange(funcionario.id, 'departamento', value)}
                          >
                            <SelectTrigger className="max-w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="autorizacao">Autorização</SelectItem>
                              <SelectItem value="monitorizacao">Monitorização</SelectItem>
                              <SelectItem value="espacos-verdes">Espaços Verdes</SelectItem>
                              <SelectItem value="todos">Todos os Processos</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getDepartamentoBadge(funcionario.departamento)
                        )}
                      </TableCell>

                      <TableCell>{formatDate(funcionario.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {editingId === funcionario.id ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleUpdateSubmit(funcionario.id)}
                              >
                                <Save size={16} className="text-lime-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingId(null)}
                              >
                                <X size={16} className="text-red-600" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingId(funcionario.id)}
                              >
                                <Pencil size={16} className="text-blue-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setFuncionarioToDelete(funcionario.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
