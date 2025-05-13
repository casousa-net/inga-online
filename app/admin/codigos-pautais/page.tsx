'use client';

import { useState, useEffect } from 'react';
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { Package, Plus, Search } from "lucide-react";
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

interface FormData {
  codigo: string;
  descricao: string;
}

type CodigoPautal = {
  id: number;
  codigo: string;
  descricao: string;
  taxa: number;
};

export default function CodigosPautaisPage() {
  const [codigos, setCodigos] = useState<CodigoPautal[]>([]);
  const [filteredCodigos, setFilteredCodigos] = useState<CodigoPautal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<FormData>({ codigo: '', descricao: '' });

  // Buscar códigos pautais
  const fetchCodigos = async () => {
    try {
      const response = await fetch('/api/codigos-pautais');
      if (!response.ok) {
        throw new Error('Erro ao buscar códigos pautais');
      }
      const data = await response.json();
      setCodigos(data);
      setFilteredCodigos(data);
    } catch (error) {
      console.error('Erro ao buscar códigos pautais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os códigos pautais.",
        variant: "destructive"
      });
    }
  };

  // Carregar códigos ao montar o componente
  useEffect(() => {
    fetchCodigos();
  }, []);

  // Filtrar códigos ao digitar na busca
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCodigos(codigos);
      return;
    }

    const filtered = codigos.filter(codigo => 
      codigo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codigo.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCodigos(filtered);
  }, [searchTerm, codigos]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.codigo || !formData.descricao) {
        toast({
          title: "Erro de validação",
          description: "Código e descrição são obrigatórios",
          variant: "destructive"
        });
        return;
      }

      if (!/^\d{8}$/.test(formData.codigo)) {
        toast({
          title: "Erro de validação",
          description: "O código pautal deve ter exatamente 8 dígitos",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/codigos-pautais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: formData.codigo,
          descricao: formData.descricao
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Erro ao adicionar código pautal');
      }

      await fetchCodigos();
      setFormData({ codigo: '', descricao: '' });
      setShowAddDialog(false);
      
      toast({
        title: "Sucesso",
        description: "Código pautal adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao adicionar código pautal:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível adicionar o código pautal.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-8 h-8" />
          Códigos Pautais
        </h1>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-lime-500 hover:bg-lime-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Código
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Código Pautal</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label>Código</label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: 12345678"
                  maxLength={8}
                />
              </div>
              
              <div className="space-y-2">
                <label>Descrição</label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do código pautal"
                />
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button className="bg-lime-500 hover:bg-lime-600" onClick={handleAddSubmit}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar códigos pautais..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead className="w-full">Descrição</TableHead>
              <TableHead>Taxa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCodigos.map(codigo => (
              <TableRow key={codigo.id}>
                <TableCell className="font-mono">{codigo.codigo}</TableCell>
                <TableCell>{codigo.descricao}</TableCell>
                <TableCell>{(codigo.taxa * 100).toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
