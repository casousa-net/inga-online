"use client";

import React, { useState } from 'react';
import PDFPreview from 'components/pdf/PDFPreview';
import AutorizacaoAmbientalDownload from 'components/pdf/AutorizacaoAmbientalDownload';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';

export default function TestePDFPage() {
  const [dadosAutorizacao, setDadosAutorizacao] = useState({
    tipoAutorizacao: 'IMPORTAÇÃO' as 'IMPORTAÇÃO' | 'EXPORTAÇÃO' | 'REEXPORTAÇÃO',
    entidade: 'Divero Metal- Indústria, LDA',
    nif: '5001169602',
    numeroFactura: 'FT 2024/14',
    produtos: 'Partes de Computador',
    quantidade: '100.00 Un',
    codigosPautais: '85340000',
    dataEmissao: new Date(),
    numeroAutorizacao: '202505123456'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDadosAutorizacao(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Geração de PDF - Autorização Ambiental</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Dados da Autorização</h2>
          
          <div className="space-y-2">
            <Label htmlFor="tipoAutorizacao">Tipo de Autorização</Label>
            <select
              id="tipoAutorizacao"
              name="tipoAutorizacao"
              value={dadosAutorizacao.tipoAutorizacao}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="IMPORTAÇÃO">IMPORTAÇÃO</option>
              <option value="EXPORTAÇÃO">EXPORTAÇÃO</option>
              <option value="REEXPORTAÇÃO">REEXPORTAÇÃO</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entidade">Entidade</Label>
            <Input
              id="entidade"
              name="entidade"
              value={dadosAutorizacao.entidade}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nif">NIF</Label>
            <Input
              id="nif"
              name="nif"
              value={dadosAutorizacao.nif}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numeroFactura">Número da Factura</Label>
            <Input
              id="numeroFactura"
              name="numeroFactura"
              value={dadosAutorizacao.numeroFactura}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="produtos">Produtos</Label>
            <Input
              id="produtos"
              name="produtos"
              value={dadosAutorizacao.produtos}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              name="quantidade"
              value={dadosAutorizacao.quantidade}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="codigosPautais">Códigos Pautais</Label>
            <Input
              id="codigosPautais"
              name="codigosPautais"
              value={dadosAutorizacao.codigosPautais}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numeroAutorizacao">Número de Autorização</Label>
            <Input
              id="numeroAutorizacao"
              name="numeroAutorizacao"
              value={dadosAutorizacao.numeroAutorizacao}
              onChange={handleChange}
            />
          </div>
          
          <div className="pt-4">
            <AutorizacaoAmbientalDownload data={dadosAutorizacao} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">Pré-visualização do PDF</h2>
          <div className="h-[800px] border border-gray-300 rounded-md overflow-hidden">
            <PDFPreview data={dadosAutorizacao} />
          </div>
        </div>
      </div>
    </div>
  );
}
