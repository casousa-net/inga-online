'use client';

import { useState, useEffect } from 'react';
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { User, Pencil, Trash2, Save, X, Plus, Search, FileText } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "components/ui/dialog";
import { toast } from "components/ui/use-toast";
import { Badge } from "components/ui/badge";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type Utente = {
  id: number;
  nome: string;
  email: string;
  nif: string;
  telefone: string;
  endereco: string;
  createdAt: string;
  updatedAt: string;
};

export default function UtentesPage() {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUtentes, setFilteredUtentes] = useState<Utente[]>([]);

  // Carregar utentes
  useEffect(() => {
    fetchUtentes();
  }, []);

  // Filtrar utentes quando o termo de busca mudar
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUtentes(utentes);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      setFilteredUtentes(
        utentes.filter(
          utente => 
            utente.nome.toLowerCase().includes(lowercaseSearch) || 
            utente.email.toLowerCase().includes(lowercaseSearch) ||
            utente.nif.includes(searchTerm)
        )
      );
    }
  }, [searchTerm, utentes]);

  const fetchUtentes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usuarios?role=utente');
      const data = await response.json();
      setUtentes(data);
      setFilteredUtentes(data);
    } catch (error) {
      console.error('Erro ao carregar utentes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os utentes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar utente
  const handleUpdateSubmit = async (id: number) => {
    try {
      const utenteToUpdate = utentes.find(u => u.id === id);
      if (!utenteToUpdate) return;

      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: utenteToUpdate.nome,
          email: utenteToUpdate.email,
          nif: utenteToUpdate.nif,
          telefone: utenteToUpdate.telefone,
          endereco: utenteToUpdate.endereco
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar utente');
      }

      setEditingId(null);
      toast({
        title: "Sucesso",
        description: "Utente atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar utente:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o utente.",
        variant: "destructive"
      });
    }
  };

  const handleEditChange = (id: number, field: keyof Utente, value: string) => {
    setUtentes(utentes.map(utente => {
      if (utente.id === id) {
        return { ...utente, [field]: value } as Utente;
      }
      return utente;
    }));
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: pt });
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Gestão de Utentes</h1>
          <p className="text-gray-500 mt-1">Visualize e gerencie os utentes cadastrados no sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar por nome, email ou NIF..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>NIF</TableHead>
              <TableHead>Telefone</TableHead>
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
            ) : filteredUtentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchTerm.trim() !== '' 
                    ? 'Nenhum resultado encontrado para a busca' 
                    : 'Nenhum utente cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUtentes.map((utente) => (
                <TableRow key={utente.id}>
                  <TableCell>
                    {editingId === utente.id ? (
                      <Input 
                        value={utente.nome} 
                        onChange={(e) => handleEditChange(utente.id, 'nome', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-lime-600" />
                        {utente.nome}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === utente.id ? (
                      <Input 
                        value={utente.email} 
                        onChange={(e) => handleEditChange(utente.id, 'email', e.target.value)}
                      />
                    ) : (
                      utente.email
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === utente.id ? (
                      <Input 
                        value={utente.nif} 
                        onChange={(e) => handleEditChange(utente.id, 'nif', e.target.value)}
                      />
                    ) : (
                      utente.nif
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === utente.id ? (
                      <Input 
                        value={utente.telefone} 
                        onChange={(e) => handleEditChange(utente.id, 'telefone', e.target.value)}
                      />
                    ) : (
                      utente.telefone
                    )}
                  </TableCell>
                  <TableCell>{formatDate(utente.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {editingId === utente.id ? (
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
                          onClick={() => handleUpdateSubmit(utente.id)}
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
                          onClick={() => setEditingId(utente.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-amber-600 hover:text-amber-800"
                          title="Ver Processos"
                          onClick={() => window.location.href = `/admin/processos?utenteId=${utente.id}`}
                        >
                          <FileText size={16} />
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
    </div>
  );
}
