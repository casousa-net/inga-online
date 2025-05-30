'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Pencil, Trash2, Save, X, Plus, Upload } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import ExcelImporter from "@/components/ExcelImporter";

type CodigoPautal = {
  id: number;
  codigo: string;
  descricao: string;
  taxa: number;
};

export default function CodigosPautaisPage() {
  const [codigosPautais, setCodigosPautais] = useState<CodigoPautal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    taxa: '0'
  });
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Carregar códigos pautais
  useEffect(() => {
    fetchCodigosPautais();
  }, []);

  const fetchCodigosPautais = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/codigopautal');
      const data = await response.json();
      setCodigosPautais(data);
    } catch (error) {
      console.error('Erro ao carregar códigos pautais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os códigos pautais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/codigopautal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          taxa: parseFloat(formData.taxa) || 0
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar código pautal');
      }

      const newCodigoPautal = await response.json();
      setCodigosPautais(prev => [...prev, newCodigoPautal]);
      
      toast({
        title: "Sucesso",
        description: "Código pautal criado com sucesso!",
      });

      // Reset form and close dialog
      setFormData({ codigo: '', descricao: '', taxa: '0' });
      setShowAddDialog(false);
    } catch (error: any) {
      console.error('Erro ao criar código pautal:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o código pautal.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (codigoPautal: CodigoPautal) => {
    setEditingId(codigoPautal.id);
    setFormData({
      codigo: codigoPautal.codigo,
      descricao: codigoPautal.descricao,
      taxa: codigoPautal.taxa.toString()
    });
  };

  const handleUpdate = async (id: number) => {
    try {
      const response = await fetch(`/api/codigopautal/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          taxa: parseFloat(formData.taxa) || 0
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar código pautal');
      }

      const updatedCodigoPautal = await response.json();
      
      setCodigosPautais(prev => 
        prev.map(item => item.id === id ? updatedCodigoPautal : item)
      );
      
      toast({
        title: "Sucesso",
        description: "Código pautal atualizado com sucesso!",
      });

      // Reset form and editing state
      setEditingId(null);
      setFormData({ codigo: '', descricao: '', taxa: '0' });
    } catch (error: any) {
      console.error('Erro ao atualizar código pautal:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o código pautal.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este código pautal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/codigopautal/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir código pautal');
      }

      setCodigosPautais(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Código pautal excluído com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao excluir código pautal:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o código pautal.",
        variant: "destructive"
      });
    }
  };

  const handleImport = async (data: any[]): Promise<void> => {
    try {
      const response = await fetch('/api/codigopautal/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao importar códigos pautais');
      }

      // Atualizar a lista após a importação
      await fetchCodigosPautais();
      
      toast({
        title: "Importação concluída",
        description: `${result.count} códigos pautais importados com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro na importação:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Códigos Pautais</h1>
          <p className="text-muted-foreground">Gerencie os códigos pautais do sistema</p>
        </div>
        
        <div className="flex gap-2">
          {/* Importar Excel */}
          <ExcelImporter 
            onDataImported={handleImport}
            templateFields={['codigo', 'descricao', 'taxa']}
            templateName="codigos_pautais"
          />
          
          {/* Adicionar Novo */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                Adicionar Código Pautal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Código Pautal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="codigo" className="text-sm font-medium">Código</label>
                    <Input
                      id="codigo"
                      name="codigo"
                      value={formData.codigo}
                      onChange={handleInputChange}
                      placeholder="Ex: 0101.21.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="descricao" className="text-sm font-medium">Descrição</label>
                    <Input
                      id="descricao"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      placeholder="Descrição do código pautal"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="taxa" className="text-sm font-medium">Taxa (AOA)</label>
                    <Input
                      id="taxa"
                      name="taxa"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.taxa}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Taxa (AOA)</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : codigosPautais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum código pautal cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              codigosPautais.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {editingId === item.id ? (
                      <Input
                        name="codigo"
                        value={formData.codigo}
                        onChange={handleInputChange}
                        className="h-8"
                      />
                    ) : (
                      item.codigo
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleInputChange}
                        className="h-8"
                      />
                    ) : (
                      item.descricao
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === item.id ? (
                      <Input
                        name="taxa"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.taxa}
                        onChange={handleInputChange}
                        className="h-8 text-right"
                      />
                    ) : (
                      new Intl.NumberFormat('pt-AO', { 
                        style: 'decimal', 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      }).format(item.taxa)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === item.id ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleUpdate(item.id)}
                            className="h-8 w-8"
                          >
                            <Save size={16} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setEditingId(null)}
                            className="h-8 w-8"
                          >
                            <X size={16} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 size={16} />
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
    </div>
  );
}
