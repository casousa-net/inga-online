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
  onDataImported: (data: any[]) => Promise<void>;
  templateFields: string[];
  templateName: string;
};

type ImportSummary = {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  sampleRecords: any[];
  errors: {row: number, message: string}[];
};

export default function ExcelImporter({ onDataImported, templateFields, templateName }: ExcelImporterProps) {
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      
      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Validate the data structure
      if (jsonData.length === 0) {
        throw new Error("O arquivo não contém dados.");
      }
      
      // Check if all required fields are present
      const firstRow = jsonData[0] as any;
      const missingFields = templateFields.filter(field => 
        !Object.keys(firstRow).some(key => key.toLowerCase() === field.toLowerCase())
      );
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
      }
      
      // Validate each record and prepare summary
      const errors: {row: number, message: string}[] = [];
      const validatedData = jsonData.map((row: any, index: number) => {
        // Add validation logic here if needed
        return row;
      });
      
      // Prepare summary data
      const summary: ImportSummary = {
        totalRecords: jsonData.length,
        validRecords: jsonData.length - errors.length,
        invalidRecords: errors.length,
        sampleRecords: jsonData.slice(0, 5), // Show first 5 records
        errors
      };
      
      // Store data and show preview
      setExcelData(jsonData);
      setImportSummary(summary);
      setShowPreview(true);
      
      // Reset the file input
      e.target.value = '';
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
    if (!excelData.length) return;
    
    try {
      setImporting(true);
      
      // Process the data
      await onDataImported(excelData);
      
      toast({
        title: "Importação concluída",
        description: `${excelData.length} registros importados com sucesso.`,
      });
      
      // Reset state
      setShowPreview(false);
      setImportSummary(null);
      setExcelData([]);
    } catch (error: any) {
      console.error('Erro ao processar importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao processar os dados.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create a template workbook
    const worksheet = XLSX.utils.json_to_sheet([
      templateFields.reduce((obj, field) => ({ ...obj, [field]: '' }), {})
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    
    // Generate and download the file
    XLSX.writeFile(workbook, `template_${templateName}.xlsx`);
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
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Resumo da Importação</DialogTitle>
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
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                <X size={14} className="mr-1" /> Cancelar
              </Button>
            </DialogClose>
            <Button 
              onClick={handleConfirmImport} 
              disabled={importing || !importSummary || importSummary.totalRecords === 0}
              className="bg-lime-600 hover:bg-lime-700 text-white"
              size="sm"
            >
              {importing ? 'Processando...' : 'Importar Dados'}
              {!importing && <ChevronRight size={14} className="ml-1" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
