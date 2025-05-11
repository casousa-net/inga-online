'use client';

import { useState, useEffect } from 'react';
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { DollarSign, Pencil, Trash2, Save, X, Plus, Upload } from "lucide-react";
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
import ExcelImporter from "components/ExcelImporter";

type Moeda = {
  id: number;
  nome: string;
  simbolo: string;
  taxaCambio: number;
};

export default function MoedasPage() {
  const [moedas, setMoedas] = useState<Moeda[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    simbolo: '',
    taxaCambio: ''
  });
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Carregar moedas
  useEffect(() => {
    fetchMoedas();
  }, []);

  const fetchMoedas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/moedas');
      const data = await response.json();
      setMoedas(data);
    } catch (error) {
      console.error('Erro ao carregar moedas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as moedas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Adicionar moeda
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/moedas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          simbolo: formData.simbolo,
          taxaCambio: parseFloat(formData.taxaCambio)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar moeda');
      }

      // Recarregar moedas
      fetchMoedas();
      
      // Limpar formulário e fechar diálogo
      setFormData({ nome: '', simbolo: '', taxaCambio: '' });
      setShowAddDialog(false);
      
      toast({
        title: "Sucesso",
        description: "Moeda adicionada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao adicionar moeda:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar a moeda.",
        variant: "destructive"
      });
    }
  };

  // Atualizar moeda
  const handleUpdateSubmit = async (id: number) => {
    try {
      const moedaToUpdate = moedas.find(m => m.id === id);
      if (!moedaToUpdate) return;

      const response = await fetch(`/api/moedas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: moedaToUpdate.nome,
          simbolo: moedaToUpdate.simbolo,
          taxaCambio: moedaToUpdate.taxaCambio
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar moeda');
      }

      setEditingId(null);
      toast({
        title: "Sucesso",
        description: "Moeda atualizada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar moeda:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a moeda.",
        variant: "destructive"
      });
    }
  };

  // Excluir moeda
  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta moeda?')) return;
    
    try {
      const response = await fetch(`/api/moedas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir moeda');
      }

      // Atualizar lista de moedas
      setMoedas(moedas.filter(moeda => moeda.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Moeda excluída com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao excluir moeda:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a moeda.",
        variant: "destructive"
      });
    }
  };

  const handleEditChange = (id: number, field: keyof Moeda, value: string) => {
    setMoedas(moedas.map(moeda => {
      if (moeda.id === id) {
        return { 
          ...moeda, 
          [field]: field === 'taxaCambio' ? parseFloat(value) : value 
        };
      }
      return moeda;
    }));
  };

  // Função para importar moedas do Excel
  const handleExcelImport = async (data: any[]) => {
    try {
      // Mapear os dados do Excel para o formato esperado pela API
      const moedas = data.map(row => ({
        nome: String(row.nome || row.Nome || row.NOME).trim(),
        simbolo: String(row.simbolo || row.Simbolo || row.SIMBOLO).trim(),
        taxaCambio: Number(row.taxaCambio || row.TaxaCambio || row['Taxa de Câmbio'] || row.taxa || 0)
      }));
      
      // Validar os dados
      const invalidMoedas = moedas.filter(
        item => !item.nome || !item.simbolo || isNaN(item.taxaCambio)
      );
      
      if (invalidMoedas.length > 0) {
        throw new Error(`${invalidMoedas.length} moedas inválidas. Verifique se todas têm nome, símbolo e taxa de câmbio válida.`);
      }
      
      // Enviar para a API
      const response = await fetch('/api/moedas/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moedas }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao importar moedas');
      }
      
      // Recarregar a lista após importação
      fetchMoedas();
    } catch (error: any) {
      console.error('Erro ao importar moedas:', error);
      throw error;
    }
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Moedas e Câmbio</h1>
          <p className="text-gray-500 mt-1">Gerencie as moedas e taxas de câmbio do sistema</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <ExcelImporter 
            onDataImported={handleExcelImport}
            templateFields={['nome', 'simbolo', 'taxaCambio']}
            templateName="moedas"
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-lime-600 hover:bg-lime-700 text-white">
                <Plus size={16} className="mr-2" /> Adicionar Moeda
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Moeda</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="nome" className="text-sm font-medium">Nome da Moeda</label>
                <Input 
                  id="nome" 
                  value={formData.nome} 
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: USD, EUR, AKZ" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="simbolo" className="text-sm font-medium">Símbolo</label>
                <Input 
                  id="simbolo" 
                  value={formData.simbolo} 
                  onChange={(e) => setFormData({...formData, simbolo: e.target.value})}
                  placeholder="Ex: $, €, Kz" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="taxaCambio" className="text-sm font-medium">Taxa de Câmbio</label>
                <Input 
                  id="taxaCambio" 
                  type="number" 
                  step="0.01"
                  value={formData.taxaCambio} 
                  onChange={(e) => setFormData({...formData, taxaCambio: e.target.value})}
                  placeholder="Ex: 850.50" 
                  required
                />
                <p className="text-xs text-gray-500">Taxa de câmbio em relação à moeda local (AKZ)</p>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Símbolo</TableHead>
              <TableHead>Taxa de Câmbio</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lime-500"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : moedas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Nenhuma moeda cadastrada
                </TableCell>
              </TableRow>
            ) : (
              moedas.map((moeda) => (
                <TableRow key={moeda.id}>
                  <TableCell>
                    {editingId === moeda.id ? (
                      <Input 
                        value={moeda.nome} 
                        onChange={(e) => handleEditChange(moeda.id, 'nome', e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-lime-600" />
                        {moeda.nome}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === moeda.id ? (
                      <Input 
                        value={moeda.simbolo} 
                        onChange={(e) => handleEditChange(moeda.id, 'simbolo', e.target.value)}
                      />
                    ) : (
                      moeda.simbolo
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === moeda.id ? (
                      <Input 
                        type="number"
                        step="0.01"
                        value={String(moeda.taxaCambio)} 
                        onChange={(e) => handleEditChange(moeda.id, 'taxaCambio', e.target.value)}
                      />
                    ) : (
                      moeda.taxaCambio.toLocaleString('pt-AO')
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === moeda.id ? (
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
                          onClick={() => handleUpdateSubmit(moeda.id)}
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
                          onClick={() => setEditingId(moeda.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(moeda.id)}
                          className="text-red-600 hover:text-red-800"
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
    </div>
  );
}
