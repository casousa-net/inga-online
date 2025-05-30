'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search, Pencil, Trash2, Save, X, Download } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import ExcelImporter from "@/components/ExcelImporter";
import * as XLSX from 'xlsx';

// Função para formatar o código pautal (adiciona pontos)
const formatarCodigoPautal = (codigo: string): string => {
  if (!codigo) return '';
  // Remove todos os pontos existentes
  const numeros = codigo.replace(/\./g, '');
  // Adiciona pontos nas posições corretas (0000.00.00)
  return numeros.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3');
};

// Função para remover a formatação (pontos) do código
const removerFormatacaoCodigo = (codigo: string): string => {
  return codigo.replace(/\./g, '');
};

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{codigo: string, descricao: string}>({ codigo: '', descricao: '' });
  const [formData, setFormData] = useState<FormData>({ codigo: '', descricao: '' });
  const [formErrors, setFormErrors] = useState<{codigo?: string, descricao?: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar códigos pautais
  const fetchCodigos = async () => {
    try {
      console.log('Buscando códigos pautais...');
      const response = await fetch('/api/codigos-pautais');
      if (!response.ok) {
        throw new Error('Erro ao buscar códigos pautais');
      }
      const data = await response.json();
      console.log('Códigos pautais recebidos:', data);
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
    console.log('Componente montado, buscando códigos pautais...');
    fetchCodigos();
  }, []);

  // Filtrar códigos ao digitar na busca
  useEffect(() => {
    console.log('Filtrando códigos com termo:', searchTerm);
    if (!searchTerm) {
      console.log('Nenhum termo de busca, mostrando todos os códigos');
      setFilteredCodigos(codigos);
      return;
    }

    // Remove a formatação para busca
    const termoBusca = removerFormatacaoCodigo(searchTerm).toLowerCase();

    const filtered = codigos.filter(codigo => {
      const codigoLimpo = removerFormatacaoCodigo(codigo.codigo).toLowerCase();
      const matches = (
        codigoLimpo.includes(termoBusca) ||
        codigo.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`Código ${codigo.codigo} - ${codigo.descricao} - ${matches ? 'match' : 'no match'}`);
      return matches;
    });
    console.log(`Filtro concluído. ${filtered.length} de ${codigos.length} códigos correspondem à busca`);
    setFilteredCodigos(filtered);
  }, [searchTerm, codigos]);

  const validateForm = (data: FormData) => {
    const errors: {codigo?: string, descricao?: string} = {};
    
    if (!data.codigo) {
      errors.codigo = 'Código é obrigatório';
    } else if (!/^\d{8}$/.test(removerFormatacaoCodigo(data.codigo))) {
      errors.codigo = 'O código deve ter 8 dígitos (formato: 0000.00.00)';
    }
    
    if (!data.descricao) {
      errors.descricao = 'Descrição é obrigatória';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida o formulário
    if (!validateForm(formData)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Remove a formatação para validação
      const codigoLimpo = removerFormatacaoCodigo(formData.codigo);

      const response = await fetch('/api/codigos-pautais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: codigoLimpo,
          descricao: formData.descricao
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Erro ao adicionar código pautal');
      }

      await fetchCodigos();
      setFormData({ codigo: '', descricao: '' });
      setFormErrors({});
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (codigo: CodigoPautal) => {
    setEditingId(codigo.id);
    // Remove a formatação ao editar para facilitar a edição
    setEditData({ 
      codigo: removerFormatacaoCodigo(codigo.codigo), 
      descricao: codigo.descricao 
    });
  };

  const handleEditChange = (field: keyof typeof editData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdate = async (id: number) => {
    try {
      if (!editData.codigo || !editData.descricao) {
        toast({
          title: "Erro de validação",
          description: "Código e descrição são obrigatórios",
          variant: "destructive"
        });
        return;
      }

      // Remove a formatação para validação
      const codigoLimpo = removerFormatacaoCodigo(editData.codigo);
      
      if (!/^\d{8}$/.test(codigoLimpo)) {
        toast({
          title: "Erro de validação",
          description: "O código pautal deve ter exatamente 8 dígitos (formato: 0000.00.00)",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`/api/codigos-pautais/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigo: codigoLimpo,
          descricao: editData.descricao
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar código pautal');
      }

      await fetchCodigos();
      setEditingId(null);
      
      toast({
        title: "Sucesso",
        description: "Código pautal atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar código pautal:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o código pautal.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este código pautal?')) return;
    
    try {
      const response = await fetch(`/api/codigos-pautais/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir código pautal');
      }

      // Atualizar a lista de códigos
      setCodigos(codigos.filter(codigo => codigo.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Código pautal excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir código pautal:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o código pautal.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadTemplate = () => {
    try {
      // Cria os dados iniciais com cabeçalhos e exemplo
      const data = [
        // Cabeçalhos
        { codigo: 'codigo', descricao: 'descricao' },
        // Linha de exemplo
        { codigo: '01010101', descricao: 'Exemplo de descrição' },
        // Instruções
        { codigo: '********', descricao: 'O código deve ter 8 dígitos (ex: 01010101). Será exibido como 0101.01.01' }
      ];
      
      // Cria a planilha a partir dos dados
      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });
      
      // Ajusta a largura das colunas
      ws['!cols'] = [
        { wch: 15 }, // Largura da coluna de código
        { wch: 40 }  // Largura da coluna de descrição
      ];
      
      // Formata o cabeçalho em negrito
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[headerCell]) continue;
        ws[headerCell].s = { font: { bold: true } };
      }
      
      // Cria o workbook e a planilha
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Códigos Pautais');
      
      // Faz o download do arquivo
      XLSX.writeFile(wb, 'template-codigos-pautais.xlsx');
    } catch (error) {
      console.error('Erro ao gerar template:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o template.",
        variant: "destructive"
      });
    }
  };

  const handleImport = async (data: any[]): Promise<{ success: boolean; message?: string; data?: any }> => {
    try {
      console.log('Dados recebidos para importação:', data);
      
      // Filtra apenas as linhas que têm pelo menos um valor preenchido
      const linhasValidas = data.filter(row => {
        return Object.values(row).some(val => val !== null && val !== undefined && val !== '');
      });
      
      console.log('Linhas válidas para importação:', linhasValidas);
      
      if (linhasValidas.length === 0) {
        const errorMsg = 'Nenhum dado válido para importação. Verifique o arquivo.';
        console.error(errorMsg);
        return { success: false, message: errorMsg };
      }
      
      // Formata os códigos antes de enviar para a API
      const dadosFormatados = linhasValidas.map((item, index) => {
        try {
          // Encontra o nome correto das propriedades (case-insensitive)
          const codigoKey = Object.keys(item).find(
            key => key.toLowerCase() === 'codigo'
          ) || 'codigo';
          
          const descricaoKey = Object.keys(item).find(
            key => key.toLowerCase() === 'descricao'
          ) || 'descricao';
          
          const codigo = removerFormatacaoCodigo(item[codigoKey]?.toString() || '');
          const descricao = item[descricaoKey]?.toString() || '';
          
          // Valida os dados
          if (!codigo || !/^\d{8}$/.test(codigo)) {
            throw new Error(`Linha ${index + 1}: Código inválido. Deve ter exatamente 8 dígitos.`);
          }
          
          if (!descricao || descricao.trim() === '') {
            throw new Error(`Linha ${index + 1}: Descrição não pode estar vazia.`);
          }
          
          return { codigo, descricao };
          
        } catch (error: any) {
          console.error(`Erro ao processar linha ${index + 1}:`, error);
          throw new Error(`Erro na linha ${index + 1}: ${error.message}`);
        }
      });

      console.log('Dados formatados para importação:', dadosFormatados);

      console.log('Enviando dados para importação:', dadosFormatados);
      const response = await fetch('/api/codigos-pautais/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigos: dadosFormatados
        }),
      });

      const responseData = await response.json();
      console.log('Resposta da API de importação:', responseData);

      if (!response.ok) {
        const errorMsg = responseData?.error || responseData?.message || 'Erro ao importar códigos pautais';
        throw new Error(errorMsg);
      }
      
      if (responseData.error) {
        const errorMsg = responseData.details || responseData.error || 'Erro ao processar a importação';
        throw new Error(errorMsg);
      }

      // Força um novo fetch dos dados para garantir que temos a lista mais recente
      console.log('Buscando códigos atualizados...');
      const updatedResponse = await fetch('/api/codigos-pautais');
      if (!updatedResponse.ok) {
        throw new Error('Falha ao buscar os códigos atualizados');
      }
      
      const updatedData = await updatedResponse.json();
      console.log('Dados atualizados do banco:', updatedData);
      
      // Atualiza os estados locais com os dados mais recentes
      setCodigos(updatedData);
      setFilteredCodigos(updatedData);
      
      const successMsg = responseData.message || `${dadosFormatados.length} códigos pautais processados com sucesso.`;
      console.log('Importação concluída com sucesso:', successMsg);
      
      toast({
        title: "Importação concluída",
        description: successMsg,
      });

      return { 
        success: true, 
        message: successMsg,
        data: responseData 
      };
    } catch (error: any) {
      const errorMsg = error.message || 'Ocorreu um erro ao processar o arquivo. Verifique os dados e tente novamente.';
      console.error('Erro na importação:', errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Códigos Pautais</h1>
          <p className="text-sm text-muted-foreground">
            Formato dos códigos: 0000.00.00
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExcelImporter 
            onDataImported={handleImport} 
            templateFields={['codigo', 'descricao']}
            templateName="codigos-pautais"
            onDownloadTemplate={handleDownloadTemplate}
          />
          <Button 
            onClick={() => setShowAddDialog(true)} 
            className="gap-2 whitespace-nowrap bg-lime-500 hover:bg-lime-600 text-white"
          >
            <Plus className="h-4 w-4" />
            Adicionar Código
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar código (com ou sem pontos) ou descrição..."
          className="w-full pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearchTerm('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table className="bg-white">
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead className="w-full">Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCodigos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  Nenhum código pautal cadastrado
                </TableCell>
              </TableRow>
            ) : (
              filteredCodigos.map(codigo => (
                <TableRow key={codigo.id}>
                  <TableCell className="font-mono">
                    {editingId === codigo.id ? (
                      <div className="relative">
                        <Input
                          value={editData.codigo}
                          onChange={(e) => {
                            // Permite apenas números e limita a 8 dígitos
                            const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                            handleEditChange('codigo', value);
                          }}
                          className="w-full pr-24 font-mono"
                          placeholder="Digite 8 dígitos"
                        />
                        <span className="absolute right-2 top-2 text-sm text-muted-foreground font-mono">
                          {editData.codigo ? formatarCodigoPautal(editData.codigo) : '0000.00.00'}
                        </span>
                      </div>
                    ) : (
                      formatarCodigoPautal(codigo.codigo)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === codigo.id ? (
                      <Input
                        value={editData.descricao}
                        onChange={(e) => handleEditChange('descricao', e.target.value)}
                        className="w-full"
                      />
                    ) : (
                      codigo.descricao
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === codigo.id ? (
                      <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingId(null)}
                              className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleUpdate(codigo.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEdit(codigo)}
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDelete(codigo.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setFormErrors({});
          setFormData({ codigo: '', descricao: '' });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Adicionar Código Pautal</DialogTitle>
            </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label>Código</label>
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      value={formData.codigo}
                      onChange={(e) => {
                        // Permite apenas números e limita a 8 dígitos
                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setFormData({ ...formData, codigo: value });
                        // Limpa o erro quando o usuário começa a digitar
                        if (formErrors.codigo) {
                          setFormErrors(prev => ({ ...prev, codigo: undefined }));
                        }
                      }}
                      className={`w-full pr-24 font-mono ${formErrors.codigo ? 'border-red-500' : ''}`}
                      placeholder="Digite 8 dígitos"
                    />
                    <span className="absolute right-2 top-2 text-sm text-muted-foreground font-mono">
                      {formData.codigo ? formatarCodigoPautal(formData.codigo) : '0000.00.00'}
                    </span>
                  </div>
                  {formErrors.codigo && (
                    <p className="text-xs text-red-500">{formErrors.codigo}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label>Descrição</label>
                <div className="space-y-1">
                  <Input
                    value={formData.descricao}
                    onChange={(e) => {
                      setFormData({ ...formData, descricao: e.target.value });
                      // Limpa o erro quando o usuário começa a digitar
                      if (formErrors.descricao) {
                        setFormErrors(prev => ({ ...prev, descricao: undefined }));
                      }
                    }}
                    className={formErrors.descricao ? 'border-red-500' : ''}
                    placeholder="Descrição do código pautal"
                  />
                  {formErrors.descricao && (
                    <p className="text-xs text-red-500">{formErrors.descricao}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="w-full sm:w-auto bg-lime-500 hover:bg-lime-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
