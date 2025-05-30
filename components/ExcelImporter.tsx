'use client';

import { useState } from 'react';
import { Button } from "components/ui/button";
import { Upload, Check, AlertTriangle, X, ChevronRight } from "lucide-react";
import { toast } from "components/ui/use-toast";
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "components/ui/dialog";

type ExcelImporterProps = {
  onDataImported: (data: any[]) => Promise<{ success: boolean; message?: string }>;
  templateFields: string[];
  templateName: string;
  onDownloadTemplate?: () => void;
};

type ImportSummary = {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  sampleRecords: any[];
  errors: { row: number, message: string }[];
};

export default function ExcelImporter({ onDataImported, templateFields, templateName, onDownloadTemplate }: ExcelImporterProps) {
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica a extensão do arquivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      toast({
        title: "Formato de arquivo inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Iniciando leitura do arquivo...');
      setImporting(true);

      // Read the Excel file
      console.log('Lendo arquivo Excel...');
      const data = await file.arrayBuffer();
      let workbook;

      try {
        workbook = XLSX.read(data);
      } catch (error) {
        throw new Error("Não foi possível ler o arquivo. Certifique-se de que é um arquivo Excel válido.");
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("O arquivo não contém planilhas.");
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!worksheet) {
        throw new Error("Não foi possível acessar a planilha do arquivo.");
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      console.log('Dados lidos do Excel:', jsonData);

      // Validate the data structure
      if (jsonData.length === 0) {
        throw new Error("O arquivo não contém dados.");
      }

      // Check if all required fields are present (case-insensitive)
      const firstRow = jsonData[0] as any;
      console.log('Primeira linha do arquivo:', firstRow);
      console.log('Campos esperados:', templateFields);

      if (!firstRow) {
        throw new Error("Não foi possível ler os dados do arquivo. Verifique o formato.");
      }

      // Mapeia os nomes dos campos do arquivo para minúsculas para comparação
      const fileFields = Object.keys(firstRow).map(f => f.toLowerCase().trim());
      console.log('Campos encontrados no arquivo:', fileFields);

      // Verifica campos obrigatórios (case-insensitive)
      const missingFields = templateFields.filter(field =>
        !fileFields.some(f => f === field.toLowerCase().trim())
      );

      if (missingFields.length > 0) {
        console.error('Campos obrigatórios ausentes:', missingFields);
        throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
      }

      // Validate each record and prepare summary
      const errors: { row: number, message: string }[] = [];
      const processedRows = new Set();

      // Validar cada linha
      jsonData.forEach((row: any, index: number) => {
        const rowNumber = index + 2; // +2 porque a planilha começa na linha 2 (1 para cabeçalho)

        // Pular linhas vazias
        if (Object.values(row).every(val => val === "" || val === null || val === undefined)) {
          console.log(`Linha ${rowNumber} vazia, pulando...`);
          return;
        }

        // Verifica se a linha já foi processada (duplicada)
        const rowKey = JSON.stringify(row);
        if (processedRows.has(rowKey)) {
          errors.push({
            row: rowNumber,
            message: 'Linha duplicada encontrada.'
          });
          return;
        }
        processedRows.add(rowKey);

        // Verifica se os campos obrigatórios estão preenchidos (case-insensitive)
        for (const field of templateFields) {
          // Encontra o nome correto do campo (case-insensitive)
          const actualField = Object.keys(row).find(
            key => key.toLowerCase() === field.toLowerCase()
          );

          if (!actualField) continue;

          const value = row[actualField];
          const isValueEmpty = value === null || value === undefined ||
            (typeof value === 'string' && value.trim() === '');

          if (isValueEmpty) {
            errors.push({
              row: rowNumber,
              message: `O campo '${field}' é obrigatório`
            });
          }
        }
      });

      // Se todas as linhas estiverem vazias
      if (processedRows.size === 0 && jsonData.length > 0) {
        throw new Error("O arquivo contém apenas linhas vazias.");
      }

      // Prepare summary data
      const totalValidRows = processedRows.size - errors.length;
      const summary: ImportSummary = {
        totalRecords: processedRows.size,
        validRecords: totalValidRows,
        invalidRecords: errors.length,
        sampleRecords: jsonData.slice(0, 5).filter((_, i) => i < totalValidRows), // Show first 5 valid records
        errors
      };

      // Store data and show preview
      setExcelData(jsonData);
      setImportSummary(summary);

      // Reset the file input
      e.target.value = '';

      // Show preview after a small delay to ensure state is updated
      setTimeout(() => {
        setShowPreview(true);
        setImporting(false);
      }, 100);

    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao importar o arquivo.",
        variant: "destructive"
      });
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!excelData.length || !importSummary || importSummary.validRecords === 0) {
      console.error('Nenhum dado válido para importar');
      toast({
        title: "Aviso",
        description: "Nenhum dado válido para importar. Verifique os erros na pré-visualização.",
        variant: "destructive"
      });
      return;
    }

    console.log('Iniciando confirmação de importação...');

    try {
      setImporting(true);
      console.log('Chamando onDataImported com dados:', excelData);

      // Process the data and get the result
      const result = await onDataImported(excelData);

      if (result.success) {
        console.log('Importação concluída com sucesso:', result.message);

        // Show success toast if not already shown by the parent
        if (result.message) {
          toast({
            title: "Importação concluída",
            description: result.message,
          });
        }

        // Reset state on success
        setExcelData([]);
        setImportSummary(null);
        setShowPreview(false);
      } else {
        // Handle error case where success is false
        console.error('Falha na importação:', result.message);
        toast({
          title: "Erro na importação",
          description: result.message || "Ocorreu um erro ao processar os dados.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao processar importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao processar os dados.",
        variant: "destructive"
      });
    } finally {
      console.log('Finalizando importação, definindo importing como false');
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    try {
      if (onDownloadTemplate) {
        // Se houver um manipulador personalizado, use-o
        onDownloadTemplate();
      } else {
        // Se não, use a implementação padrão
        // Create a template workbook with headers and example data
        const headers = templateFields.reduce((obj: any, field) => {
          obj[field] = field === 'codigo' ? '01010101' : `Exemplo de ${field}`;
          return obj;
        }, {});

        // Adiciona uma linha em branco e instruções
        const data = [
          headers,
          templateFields.reduce((obj, field) => ({ ...obj, [field]: '' }), {}),
          ...templateFields.map(field => ({
            [field]: `* ${field} ${field === 'codigo' ? '(8 dígitos)' : ''} *`
          }))
        ];

        const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });

        // Adiciona cabeçalhos em negrito
        XLSX.utils.sheet_add_aoa(worksheet, [templateFields], { origin: 'A1' });

        // Ajusta a largura das colunas
        worksheet['!cols'] = templateFields.map(() => ({ wch: 25 }));

        // Cria o workbook e a planilha
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

        // Faz o download do arquivo
        XLSX.writeFile(workbook, `template_${templateName}.xlsx`);
      }
    } catch (error) {
      console.error('Erro ao gerar template:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o template.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="text-xs"
          >
            Baixar Template
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={importing}
            />
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1"
              disabled={importing}
            >
              <Upload size={14} />
              {importing ? 'Importando...' : 'Importar Excel'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Importe dados em massa através de um arquivo Excel.
        </p>
      </div>

      {/* Diálogo de Pré-visualização */}
      <Dialog
        open={showPreview}
        onOpenChange={(isOpen) => {
          if (!isOpen && !importing) {
            setShowPreview(false);
            setExcelData([]);
            setImportSummary(null);
          }
        }}
      >
        <DialogContent
          className="max-w-3xl"
          onInteractOutside={(e) => {
            if (importing) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (importing) {
              e.preventDefault();
            }
          }}
          aria-describedby="import-description"
          aria-busy={importing}
        >
          <DialogHeader>
            <DialogTitle>Resumo da Importação</DialogTitle>
            <p id="import-description" className="sr-only">
              Visualização dos dados a serem importados. Revise as informações antes de confirmar.
            </p>
          </DialogHeader>

          {importSummary && (
            <div className="space-y-4 py-4">
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{importSummary.totalRecords}</div>
                  <div className="text-sm text-green-800">Total de Registros</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{importSummary.validRecords}</div>
                  <div className="text-sm text-blue-800">Registros Válidos</div>
                </div>
                <div className={`${importSummary.invalidRecords > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'} border rounded-lg p-4 text-center`}>
                  <div className={`text-2xl font-bold ${importSummary.invalidRecords > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {importSummary.invalidRecords}
                  </div>
                  <div className={`text-sm ${importSummary.invalidRecords > 0 ? 'text-red-800' : 'text-gray-800'}`}>
                    Registros Inválidos
                  </div>
                </div>
              </div>

              {/* Amostra dos dados */}
              <div>
                <h3 className="text-sm font-medium mb-2">Amostra dos Dados (primeiros 5 registros)</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {importSummary.sampleRecords.length > 0 &&
                            Object.keys(importSummary.sampleRecords[0]).map(key => (
                              <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {key}
                              </th>
                            ))
                          }
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importSummary.sampleRecords.map((record, index) => (
                          <tr key={index}>
                            {Object.values(record).map((value: any, i) => (
                              <td key={i} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {importSummary.totalRecords > 5
                    ? `Mostrando 5 de ${importSummary.totalRecords} registros.`
                    : `Mostrando todos os ${importSummary.totalRecords} registros.`
                  }
                </p>
              </div>

              {/* Erros (se houver) */}
              {importSummary.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 flex items-center gap-1 mb-2">
                    <AlertTriangle size={16} />
                    Erros Encontrados
                  </h3>
                  <ul className="text-xs text-red-700 space-y-1">
                    {importSummary.errors.map((error, index) => (
                      <li key={index}>
                        Linha {error.row + 1}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(false)}
              disabled={importing}
            >
              <X size={14} className="mr-1" />
              {importing ? 'Cancelando...' : 'Cancelar'}
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={importing || !importSummary || importSummary.totalRecords === 0}
              className="bg-lime-600 hover:bg-lime-700 text-white"
              size="sm"
            >
              {importing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </>
              ) : (
                <>
                  Importar Dados
                  <ChevronRight size={14} className="ml-1" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
