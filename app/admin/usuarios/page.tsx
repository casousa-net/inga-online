'use client';

import { useState, useEffect } from 'react';
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { User, Pencil, Trash2, Save, X, Plus, Search, Shield, Key, Upload } from "lucide-react";
import ExcelImporter from "components/ExcelImporter";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { toast } from "components/ui/use-toast";
import { Badge } from "components/ui/badge";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type Usuario = {
  id: number;
  nome: string;
  email: string;
  nif: string;
  telefone: string;
  endereco: string;
  role: 'utente' | 'direccao' | 'chefe' | 'tecnico';
  createdAt: string;
  updatedAt: string;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    nif: '',
    telefone: '',
    endereco: '',
    role: 'tecnico',
    senha: ''
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [resetPasswordData, setResetPasswordData] = useState({
    novaSenha: '',
    confirmarSenha: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Carregar usuários
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Filtrar usuários quando o termo de busca ou filtro de role mudar
  useEffect(() => {
    let filtered = [...usuarios];
    
    // Filtrar por termo de busca
    if (searchTerm.trim() !== '') {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        usuario => 
          usuario.nome.toLowerCase().includes(lowercaseSearch) || 
          usuario.email.toLowerCase().includes(lowercaseSearch) ||
          usuario.nif.includes(searchTerm)
      );
    }
    
    // Filtrar por role
    if (roleFilter !== '') {
      filtered = filtered.filter(usuario => usuario.role === roleFilter);
    }
    
    setFilteredUsuarios(filtered);
  }, [searchTerm, roleFilter, usuarios]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usuarios');
      const data = await response.json();
      setUsuarios(data);
      setFilteredUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Adicionar usuário
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
        throw new Error(errorData.error || 'Erro ao adicionar usuário');
      }

      // Recarregar usuários
      fetchUsuarios();
      
      // Limpar formulário e fechar diálogo
      setFormData({
        nome: '',
        email: '',
        nif: '',
        telefone: '',
        endereco: '',
        role: 'tecnico',
        senha: ''
      });
      setShowAddDialog(false);
      
      toast({
        title: "Sucesso",
        description: "Usuário adicionado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o usuário.",
        variant: "destructive"
      });
    }
  };

  // Atualizar usuário
  const handleUpdateSubmit = async (id: number) => {
    try {
      const usuarioToUpdate = usuarios.find(u => u.id === id);
      if (!usuarioToUpdate) return;

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: usuarioToUpdate.nome,
          email: usuarioToUpdate.email,
          nif: usuarioToUpdate.nif,
          telefone: usuarioToUpdate.telefone,
          endereco: usuarioToUpdate.endereco,
          role: usuarioToUpdate.role
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar usuário');
      }

      setEditingId(null);
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o usuário.",
        variant: "destructive"
      });
    }
  };

  // Excluir usuário
  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir usuário');
      }

      // Atualizar lista de usuários
      setUsuarios(usuarios.filter(usuario => usuario.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o usuário.",
        variant: "destructive"
      });
    }
  };

  // Redefinir senha
  const handleOpenResetPassword = (id: number) => {
    setResetPasswordUserId(id);
    setResetPasswordData({ novaSenha: '', confirmarSenha: '' });
    setShowResetPasswordDialog(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetPasswordUserId) return;
    
    // Validar senhas
    if (resetPasswordData.novaSenha !== resetPasswordData.confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/usuarios/${resetPasswordUserId}/reset-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          novaSenha: resetPasswordData.novaSenha
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao redefinir senha');
      }

      setShowResetPasswordDialog(false);
      setResetPasswordUserId(null);
      setResetPasswordData({ novaSenha: '', confirmarSenha: '' });
      
      toast({
        title: "Sucesso",
        description: "Senha redefinida com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível redefinir a senha.",
        variant: "destructive"
      });
    }
  };

  const handleEditChange = (id: number, field: keyof Usuario, value: string) => {
    setUsuarios(usuarios.map(usuario => {
      if (usuario.id === id) {
        return { ...usuario, [field]: value };
      }
      return usuario;
    }));
  };

  // Função para importar usuários do Excel
  const handleExcelImport = async (data: any[]) => {
    try {
      // Mapear os dados do Excel para o formato esperado pela API
      const usuarios = data.map(row => ({
        nome: String(row.nome || row.Nome || row.NOME || '').trim(),
        email: String(row.email || row.Email || row.EMAIL || '').trim(),
        nif: String(row.nif || row.Nif || row.NIF || '').trim(),
        telefone: String(row.telefone || row.Telefone || row.TELEFONE || '').trim(),
        endereco: String(row.endereco || row.Endereco || row.ENDERECO || '').trim(),
        role: String(row.role || row.Role || row.ROLE || 'utente').toLowerCase(),
        senha: row.senha || row.Senha || row.SENHA || row.nif // Se não tiver senha, usa o NIF como senha padrão
      }));
      
      // Validar os dados
      const invalidUsuarios = usuarios.filter(
        item => !item.nome || !item.email || !item.nif || !item.telefone || !item.endereco
      );
      
      if (invalidUsuarios.length > 0) {
        throw new Error(`${invalidUsuarios.length} usuários inválidos. Verifique se todos têm nome, email, NIF, telefone e endereço.`);
      }
      
      // Enviar para a API
      const response = await fetch('/api/usuarios/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuarios }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao importar usuários');
      }
      
      // Recarregar a lista após importação
      fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao importar usuários:', error);
      throw error;
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'direccao':
        return <Badge className="bg-purple-600">Direção</Badge>;
      case 'chefe':
        return <Badge className="bg-blue-600">Chefe</Badge>;
      case 'tecnico':
        return <Badge className="bg-green-600">Técnico</Badge>;
      case 'utente':
        return <Badge className="bg-gray-600">Utente</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: pt });
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Gestão de Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <ExcelImporter 
            onDataImported={handleExcelImport}
            templateFields={['nome', 'email', 'nif', 'telefone', 'endereco', 'role', 'senha']}
            templateName="usuarios"
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-lime-600 hover:bg-lime-700 text-white">
              <Plus size={16} className="mr-2" /> Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
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
                  onValueChange={(value) => setFormData({...formData, role: value as 'utente' | 'direccao' | 'chefe' | 'tecnico'})}
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
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" className="bg-lime-600 hover:bg-lime-700">Salvar</Button>
              </DialogFooter>
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
              placeholder="Buscar por nome, email ou NIF..." 
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
                <SelectItem value="">Todas as funções</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="chefe">Chefe</SelectItem>
                <SelectItem value="direccao">Direção</SelectItem>
                <SelectItem value="utente">Utente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lime-500"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchTerm.trim() !== '' || roleFilter !== '' 
                    ? 'Nenhum resultado encontrado para a busca' 
                    : 'Nenhum usuário cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    {editingId === usuario.id ? (
                      <Input 
                        value={usuario.nome} 
                        onChange={(e) => handleEditChange(usuario.id, 'nome', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-lime-600" />
                        {usuario.nome}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === usuario.id ? (
                      <Input 
                        value={usuario.email} 
                        onChange={(e) => handleEditChange(usuario.id, 'email', e.target.value)}
                      />
                    ) : (
                      usuario.email
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === usuario.id ? (
                      <Input 
                        value={usuario.nif} 
                        onChange={(e) => handleEditChange(usuario.id, 'nif', e.target.value)}
                      />
                    ) : (
                      usuario.nif
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === usuario.id ? (
                      <Select 
                        value={usuario.role} 
                        onValueChange={(value) => handleEditChange(usuario.id, 'role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="chefe">Chefe</SelectItem>
                          <SelectItem value="direccao">Direção</SelectItem>
                          <SelectItem value="utente">Utente</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getRoleBadge(usuario.role)
                    )}
                  </TableCell>
                  <TableCell>{formatDate(usuario.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {editingId === usuario.id ? (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleUpdateSubmit(usuario.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setEditingId(usuario.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleOpenResetPassword(usuario.id)}
                          className="text-amber-600 hover:text-amber-800"
                          title="Redefinir senha"
                        >
                          <Key size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(usuario.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de redefinição de senha */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="novaSenha" className="text-sm font-medium">Nova Senha</label>
              <Input 
                id="novaSenha" 
                type="password"
                value={resetPasswordData.novaSenha} 
                onChange={(e) => setResetPasswordData({...resetPasswordData, novaSenha: e.target.value})}
                placeholder="Nova senha" 
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmarSenha" className="text-sm font-medium">Confirmar Senha</label>
              <Input 
                id="confirmarSenha" 
                type="password"
                value={resetPasswordData.confirmarSenha} 
                onChange={(e) => setResetPasswordData({...resetPasswordData, confirmarSenha: e.target.value})}
                placeholder="Confirme a nova senha" 
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" className="bg-lime-600 hover:bg-lime-700">Redefinir Senha</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
